import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AiFeedback } from './entities/ai-feedback.entity';
import { User } from '../users/entities/user.entity';
import { DetectionLog } from '../vision/entities/detection-log.entity';
import { GeminiService } from '../ai/gemini.service';
import { promises as fs } from 'node:fs';
import path from 'node:path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import archiver = require('archiver');
import type { Response } from 'express';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    @InjectRepository(AiFeedback)
    private readonly feedbackRepo: Repository<AiFeedback>,
    @InjectRepository(DetectionLog)
    private readonly detectionRepo: Repository<DetectionLog>,
    private readonly geminiService: GeminiService,
  ) {}

  async suggestLabel(id: string): Promise<{ suggestion: string }> {
    const fb = await this.feedbackRepo.findOne({ where: { id } });
    if (!fb) throw new NotFoundException(`Feedback #${id} not found`);
    if (!fb.image_path) {
      return { suggestion: 'Không có ảnh để phân tích' };
    }

    const suggestion = await this.geminiService.suggestLabel(fb.image_path);
    return { suggestion };
  }

  private sanitizeLabel(raw?: string | null): string {
    const text = (raw ?? '').toString().trim();
    if (!text) return 'unknown';

    let cleaned = text.replace(/[\r\n\t]+/g, ' ').trim();
    cleaned = cleaned.replace(/\s+/g, '_');
    cleaned = cleaned.replace(/['"]/g, '');
    cleaned = cleaned.replace(/[^\p{L}\p{N}_-]/gu, '_');
    cleaned = cleaned.replace(/_+/g, '_').replace(/^_+|_+$/g, '');

    if (!cleaned) return 'unknown';
    if (cleaned.length > 64) cleaned = cleaned.slice(0, 64);
    return cleaned;
  }

  private getFeedbackDatasetDir(): string {
    const envDir = process.env.FEEDBACK_DATASET_DIR;
    if (envDir) return envDir;

    const cwd = process.cwd().toLowerCase();
    if (cwd.endsWith('backend-gateway')) {
      return path.resolve(
        process.cwd(),
        '..',
        'ai-worker',
        'dataset',
        'feedback',
      );
    }

    return path.resolve(process.cwd(), 'ai-worker', 'dataset', 'feedback');
  }

  private async saveFeedbackImage(
    detectionId: string,
    imageBase64?: string,
  ): Promise<string | undefined> {
    if (!imageBase64) return undefined;

    const cleaned = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleaned, 'base64');
    if (buffer.length === 0) return undefined;

    const targetDir = this.getFeedbackDatasetDir();
    await fs.mkdir(targetDir, { recursive: true });
    const filename = `feedback_${detectionId}_${Date.now()}.jpg`;
    const fullPath = path.join(targetDir, filename);
    await fs.writeFile(fullPath, buffer);
    return fullPath;
  }

  async create(
    detectionId: string,
    userId: string,
    isCorrect: boolean,
    correctLabel?: string,
    imageBase64?: string,
  ): Promise<AiFeedback> {
    const detection = await this.detectionRepo.findOne({
      where: { id: detectionId },
    });
    if (!detection) {
      throw new NotFoundException(`Detection #${detectionId} not found`);
    }

    const imagePath = isCorrect
      ? undefined
      : await this.saveFeedbackImage(detectionId, imageBase64);

    const fb = this.feedbackRepo.create({
      detectionId,
      userId,
      is_correct: isCorrect,
      correct_label: correctLabel,
      image_path: imagePath,
      review_status: 'pending',
    });
    return this.feedbackRepo.save(fb);
  }

  async findAll(page: number = 1, limit: number = 20, onlyWrong = false) {
    const qb = this.feedbackRepo
      .createQueryBuilder('fb')
      .leftJoinAndSelect('fb.detection', 'detection')
      .leftJoinAndSelect('fb.user', 'user')
      .orderBy('fb.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (onlyWrong) {
      qb.where('fb.is_correct = :v', { v: false });
    }

    const [data, total] = await qb.getManyAndCount();

    // Convert absolute path to public URL
    const dataWithUrls = data.map((fb) => {
      let imageUrl: string | null = null;
      if (fb.image_path) {
        const filename = path.basename(fb.image_path);
        imageUrl = `/uploads/feedback/${filename}`;
      }
      return { ...fb, image_url: imageUrl };
    });

    return {
      data: dataWithUrls,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async review(
    id: string,
    adminId: string,
    correctLabel: string,
  ): Promise<AiFeedback> {
    const fb = await this.feedbackRepo.findOne({ where: { id } });
    if (!fb) throw new NotFoundException(`Feedback #${id} not found`);

    fb.correct_label = correctLabel;
    fb.review_status = 'reviewed';
    fb.reviewedBy = { id: adminId } as User;
    fb.reviewed_at = new Date();
    return this.feedbackRepo.save(fb);
  }

  async getStats() {
    const total = await this.feedbackRepo.count();
    const correct = await this.feedbackRepo.count({
      where: { is_correct: true },
    });
    const wrong = total - correct;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { total, correct, wrong, accuracy };
  }

  async exportYoloDatasetZip(res: Response) {
    const rows = await this.feedbackRepo.find({
      where: { is_correct: false },
      relations: ['detection'],
      order: { created_at: 'DESC' },
    });

    const validRows = rows.filter((row) => Boolean(row.image_path));

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    res.attachment('feedback-yolo-dataset.zip');
    archive.pipe(res);

    const classes = new Set<string>();
    validRows.forEach((row) => {
      classes.add(
        this.sanitizeLabel(row.correct_label || row.detection?.result_text),
      );
    });
    const classArray = Array.from(classes);
    const classMap = new Map<string, number>();
    classArray.forEach((name, index) => classMap.set(name, index));

    let yamlContent = `train: images\nval: images\n\nnc: ${classArray.length}\nnames: [`;
    yamlContent += classArray.map((c) => `'${c}'`).join(', ') + `]\n`;
    archive.append(yamlContent, { name: 'data.yaml' });

    for (const row of validRows) {
      const clsName = this.sanitizeLabel(
        row.correct_label || row.detection?.result_text,
      );
      const classId = classMap.get(clsName) ?? classMap.get('unknown') ?? 0;

      try {
        const imageBuffer = await fs.readFile(row.image_path);
        const ext = path.extname(row.image_path) || '.jpg';
        const filename = `img_${row.id}${ext}`;
        const labelFilename = `img_${row.id}.txt`;

        archive.append(imageBuffer, { name: `images/${filename}` });

        const labelContent = `${classId} 0.5 0.5 1.0 1.0\n`;
        archive.append(labelContent, { name: `labels/${labelFilename}` });
      } catch {
        // ignore missing images
      }
    }

    await archive.finalize();
  }

  async remove(id: string): Promise<void> {
    const fb = await this.feedbackRepo.findOne({ where: { id } });
    if (!fb) throw new NotFoundException(`Feedback #${id} not found`);

    if (fb.image_path) {
      try {
        await fs.unlink(fb.image_path);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to delete image file: ${msg}`);
      }
    }

    await this.feedbackRepo.remove(fb);
  }

  async removeBulk(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;

    const feedbacks = await this.feedbackRepo.find({
      where: { id: In(ids) },
    });

    for (const fb of feedbacks) {
      if (fb.image_path) {
        try {
          await fs.unlink(fb.image_path);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(
            `Failed to delete image file ${fb.image_path}: ${msg}`,
          );
        }
      }
    }

    await this.feedbackRepo.remove(feedbacks);
  }

  async removeAll(onlyWrong = false): Promise<void> {
    const where = onlyWrong ? { is_correct: false } : {};
    const feedbacks = await this.feedbackRepo.find({ where });

    for (const fb of feedbacks) {
      if (fb.image_path) {
        try {
          await fs.unlink(fb.image_path);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(`Failed to delete image file: ${msg}`);
        }
      }
    }

    if (onlyWrong) {
      await this.feedbackRepo.remove(feedbacks);
    } else {
      await this.feedbackRepo.clear();
    }
  }
}
