import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(userCode: Partial<User>): Promise<User> {
    const newUser = this.usersRepository.create(userCode);
    return this.usersRepository.save(newUser);
  }

  async save(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }

  async findAll(
    page = 1,
    limit = 20,
    search = '',
  ): Promise<{
    data: Omit<User, 'password_hash'>[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const qb = this.usersRepository
      .createQueryBuilder('u')
      .select([
        'u.id',
        'u.email',
        'u.role',
        'u.is_active',
        'u.created_at',
        'u.updated_at',
      ])
      .orderBy('u.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.where('u.email ILIKE :search', { search: `%${search}%` });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async toggleRole(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.role = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    return this.usersRepository.save(user);
  }

  async deleteUser(id: string, requesterId?: string): Promise<void> {
    if (requesterId && id === requesterId)
      throw new Error('Không thể xoá chính tài khoản của mình');
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.usersRepository.remove(user);
  }

  async lockUser(id: string, requesterId?: string): Promise<User> {
    if (requesterId && id === requesterId)
      throw new Error('Không thể khoá chính tài khoản của mình');
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.is_active = false;
    return this.usersRepository.save(user);
  }

  async unlockUser(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.is_active = true;
    return this.usersRepository.save(user);
  }

  async createUser(
    email: string,
    password: string,
    role = 'USER',
  ): Promise<User> {
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) throw new ConflictException('Email already in use');
    const password_hash = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({ email, password_hash, role });
    return this.usersRepository.save(user);
  }

  async updateUser(
    id: string,
    data: { role?: string; password?: string },
  ): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (data.role) user.role = data.role;
    if (data.password)
      user.password_hash = await bcrypt.hash(data.password, 10);
    return this.usersRepository.save(user);
  }
}
