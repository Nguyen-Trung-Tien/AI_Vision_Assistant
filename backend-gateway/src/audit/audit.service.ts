import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(data: {
    adminId?: string;
    action: string;
    targetType: string;
    targetId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
  }) {
    const auditLog = this.auditLogRepository.create({
      admin_id: data.adminId,
      action: data.action,
      target_type: data.targetType,
      target_id: data.targetId,
      details: data.details,
      ip_address: data.ipAddress,
    });
    return this.auditLogRepository.save(auditLog);
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    action?: string;
    adminId?: string;
    targetType?: string;
  }) {
    const { page = 1, limit = 50, action, adminId, targetType } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.admin', 'admin')
      .select(['log', 'admin.id', 'admin.email'])
      .orderBy('log.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (action) {
      queryBuilder.andWhere('log.action = :action', { action });
    }
    if (adminId) {
      queryBuilder.andWhere('log.admin_id = :adminId', { adminId });
    }
    if (targetType) {
      queryBuilder.andWhere('log.target_type = :targetType', { targetType });
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
