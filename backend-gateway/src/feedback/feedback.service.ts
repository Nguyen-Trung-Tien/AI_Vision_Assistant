import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiFeedback } from './entities/ai-feedback.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(AiFeedback)
    private readonly feedbackRepo: Repository<AiFeedback>,
  ) {}

  async create(
    detectionId: string,
    userId: string,
    isCorrect: boolean,
    correctLabel?: string,
  ): Promise<AiFeedback> {
    const fb = this.feedbackRepo.create({
      detectionId,
      userId,
      is_correct: isCorrect,
      correct_label: correctLabel,
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
    return { data, total, page, totalPages: Math.ceil(total / limit) };
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
}
