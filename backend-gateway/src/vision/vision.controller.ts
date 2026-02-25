import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TaskQueueService } from './task-queue.service';

@Controller()
export class VisionController {
  private readonly logger = new Logger(VisionController.name);

  constructor(private readonly taskQueueService: TaskQueueService) {}

  @EventPattern('ai_results_queue')
  async handleAIResult(@Payload() data: any) {
    this.logger.log(
      `Received final AI result from Python for client: ${data?.clientId}`,
    );
    await this.taskQueueService.handleAIResult(data);
  }
}
