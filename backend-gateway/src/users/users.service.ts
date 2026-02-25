import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

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
}
