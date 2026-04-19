import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { promises as fs } from 'node:fs';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash-latest',
      });
      this.logger.log('Gemini Service initialized');
    } else {
      this.logger.warn('GEMINI_API_KEY is not set');
    }
  }

  async suggestLabel(imagePath: string): Promise<string> {
    if (!this.model) {
      return 'Chưa cấu hình Gemini API Key';
    }

    try {
      const imageBuffer = await fs.readFile(imagePath);
      const imageParts = [
        {
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType: 'image/jpeg',
          },
        },
      ];

      const prompt = `Bạn là một chuyên gia dán nhãn dữ liệu cho hệ thống hỗ trợ người khiếm thị. 
      Hãy nhìn vào bức ảnh này và cho biết vật thể chính trong ảnh là gì. 
      Trả lời duy nhất 1-2 từ bằng tiếng Việt, viết hoa chữ cái đầu, không dấu chấm, không giải thích thêm.
      Ví dụ: Cái bàn, Ghế gỗ, Xe máy, Người đi bộ, Cầu thang.`;

      const result = await this.model.generateContent([prompt, ...imageParts]);
      const response = result.response;
      let text = response.text().trim();

      // Clean up text if Gemini adds extra stuff
      text = text.replace(/[.\n\r]/g, '');

      return text;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error suggesting label: ${errorMessage}`);
      return 'Không thể gợi ý nhãn';
    }
  }
}
