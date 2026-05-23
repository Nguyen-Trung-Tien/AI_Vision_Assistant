import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditService } from '../audit/audit.service';
import { Role } from '../common/enums/role.enum';
import { UpdateProfileDto } from './dto/update-profile.dto';

// Safe helper to extract the requester's ID from JWT payload
function getRequesterId(req: Request): string | undefined {
  const u = req.user as { sub?: string; userId?: string } | undefined;
  return u?.sub ?? u?.userId;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  private ensureAdmin(req: Request) {
    const user = req.user as { role?: Role } | undefined;
    if (user?.role !== Role.ADMIN && user?.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Admin access required');
    }
  }

  private ensureSuperAdmin(req: Request) {
    const user = req.user as { role?: Role } | undefined;
    if (user?.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admin access required');
    }
  }

  @Get()
  async findAll(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    this.ensureAdmin(req);
    return this.usersService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search ?? '',
    );
  }

  @Post()
  async createUser(
    @Req() req: Request,
    @Body() body: { email: string; password: string; role?: Role },
  ) {
    this.ensureSuperAdmin(req);
    const result = await this.usersService.createUser(
      body.email,
      body.password,
      body.role ?? Role.USER,
    );

    await this.auditService.log({
      adminId: getRequesterId(req),
      action: 'CREATE_USER',
      targetType: 'user',
      targetId: result.id,
      details: { email: body.email, role: body.role },
      ipAddress: req.ip,
    });

    return result;
  }

  @Patch('profile/me')
  async updateMyProfile(
    @Req() req: Request,
    @Body() body: UpdateProfileDto,
  ) {
    const id = getRequesterId(req);
    if (!id) throw new ForbiddenException('User ID not found');

    const result = await this.usersService.updateProfile(id, body);

    await this.auditService.log({
      adminId: id,
      action: 'UPDATE_PROFILE',
      targetType: 'user',
      targetId: id,
      details: body,
      ipAddress: req.ip,
    });

    return result;
  }

  @Patch(':id')
  async updateUser(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { role?: Role; password?: string },
  ) {
    this.ensureSuperAdmin(req);
    const result = await this.usersService.updateUser(id, body);

    await this.auditService.log({
      adminId: getRequesterId(req),
      action: 'UPDATE_USER',
      targetType: 'user',
      targetId: id,
      details: { ...body, password: body.password ? '******' : undefined },
      ipAddress: req.ip,
    });

    return result;
  }

  @Patch(':id/toggle-role')
  async toggleRole(@Req() req: Request, @Param('id') id: string) {
    this.ensureSuperAdmin(req);
    const result = await this.usersService.toggleRole(id);

    await this.auditService.log({
      adminId: getRequesterId(req),
      action: 'TOGGLE_USER_ROLE',
      targetType: 'user',
      targetId: id,
      ipAddress: req.ip,
    });

    return result;
  }

  @Patch(':id/lock')
  async lockUser(@Req() req: Request, @Param('id') id: string) {
    this.ensureSuperAdmin(req);
    const result = await this.usersService.lockUser(id, getRequesterId(req));

    await this.auditService.log({
      adminId: getRequesterId(req),
      action: 'LOCK_USER',
      targetType: 'user',
      targetId: id,
      ipAddress: req.ip,
    });

    return result;
  }

  @Patch(':id/unlock')
  async unlockUser(@Req() req: Request, @Param('id') id: string) {
    this.ensureSuperAdmin(req);
    const result = await this.usersService.unlockUser(id);

    await this.auditService.log({
      adminId: getRequesterId(req),
      action: 'UNLOCK_USER',
      targetType: 'user',
      targetId: id,
      ipAddress: req.ip,
    });

    return result;
  }

  @Delete(':id')
  async deleteUser(@Req() req: Request, @Param('id') id: string) {
    this.ensureSuperAdmin(req);
    await this.usersService.deleteUser(id, getRequesterId(req));

    await this.auditService.log({
      adminId: getRequesterId(req),
      action: 'DELETE_USER',
      targetType: 'user',
      targetId: id,
      ipAddress: req.ip,
    });

    return { message: 'User deleted successfully' };
  }
}
