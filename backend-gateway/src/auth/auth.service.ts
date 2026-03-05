import {
  Injectable,
  ConflictException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.ensureDefaultAdmin();
  }

  private async ensureDefaultAdmin() {
    const adminEmail = 'admin@gmail.com';
    // Read from env — fallback to '123456' only in non-production
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const adminPassword =
      this.configService.get<string>('ADMIN_DEFAULT_PASSWORD') ??
      (nodeEnv !== 'production' ? '123456' : null);

    if (!adminPassword) {
      this.logger.warn(
        'ADMIN_DEFAULT_PASSWORD is not set in production. Skipping admin seed.',
      );
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, BCRYPT_SALT_ROUNDS);

    const existing = await this.usersService.findOneByEmail(adminEmail);
    if (!existing) {
      await this.usersService.create({
        email: adminEmail,
        password_hash: hashedPassword,
        role: 'ADMIN',
        accessibility_prefs: {
          tts_speed: 1.0,
          warning_distance_m: 2.0,
        },
      });
      this.logger.log(`Seeded default admin account: ${adminEmail}`);
      return;
    }

    existing.role = 'ADMIN';

    let isSamePassword = false;
    try {
      isSamePassword = await bcrypt.compare(
        adminPassword,
        existing.password_hash,
      );
    } catch {
      isSamePassword = false;
    }

    if (!isSamePassword) {
      existing.password_hash = hashedPassword;
    }

    await this.usersService.save(existing);
    this.logger.log(`Default admin account is ready: ${adminEmail}`);
  }

  async validateUser(
    email: string,
    pass: string,
  ): Promise<Record<string, unknown> | null> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) return null;

    // Locked account — cannot login
    if (user.is_active === false) return { __locked: true };

    const isPasswordValid = await bcrypt.compare(pass, user.password_hash);
    if (!isPasswordValid) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...result } = user;
    return result as Record<string, unknown>;
  }

  login(user: {
    id: string;
    email: string;
    role: string;
    accessibility_prefs: Record<string, unknown>;
  }) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        accessibility_prefs: user.accessibility_prefs,
      },
    };
  }

  async register(data: {
    email: string;
    password: string;
    accessibility_prefs?: Record<string, unknown>;
  }) {
    const existing = await this.usersService.findOneByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);

    const newUser = await this.usersService.create({
      email: data.email,
      password_hash: hashedPassword,
      accessibility_prefs: data.accessibility_prefs || {
        tts_speed: 1.0,
        warning_distance_m: 2.0,
      },
    });

    return this.login(newUser);
  }
}
