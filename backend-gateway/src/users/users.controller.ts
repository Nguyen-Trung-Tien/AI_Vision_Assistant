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

// Safe helper to extract the requester's ID from JWT payload
function getRequesterId(req: Request): string | undefined {
  const u = req.user as { sub?: string; userId?: string } | undefined;
  return u?.sub ?? u?.userId;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private ensureAdmin(req: Request) {
    const user = req.user as { role?: string } | undefined;
    if (user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
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
    @Body() body: { email: string; password: string; role?: string },
  ) {
    this.ensureAdmin(req);
    return this.usersService.createUser(
      body.email,
      body.password,
      body.role ?? 'USER',
    );
  }

  @Patch(':id')
  async updateUser(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { role?: string; password?: string },
  ) {
    this.ensureAdmin(req);
    return this.usersService.updateUser(id, body);
  }

  @Patch(':id/toggle-role')
  async toggleRole(@Req() req: Request, @Param('id') id: string) {
    this.ensureAdmin(req);
    return this.usersService.toggleRole(id);
  }

  @Patch(':id/lock')
  async lockUser(@Req() req: Request, @Param('id') id: string) {
    this.ensureAdmin(req);
    return this.usersService.lockUser(id, getRequesterId(req));
  }

  @Patch(':id/unlock')
  async unlockUser(@Req() req: Request, @Param('id') id: string) {
    this.ensureAdmin(req);
    return this.usersService.unlockUser(id);
  }

  @Delete(':id')
  async deleteUser(@Req() req: Request, @Param('id') id: string) {
    this.ensureAdmin(req);
    await this.usersService.deleteUser(id, getRequesterId(req));
    return { message: 'User deleted successfully' };
  }
}
