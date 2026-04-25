import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SosAlert } from './entities/sos-alert.entity';
import { User } from '../users/entities/user.entity';
import { SosService } from './sos.service';
import { SosController } from './sos.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SmsModule } from '../sms/sms.module';
import { EmergencyContactModule } from '../emergency-contact/emergency-contact.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SosAlert, User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => ({
        secret: cs.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
    SmsModule,
    EmergencyContactModule,
    AuditModule,
  ],
  controllers: [SosController],
  providers: [SosService],
  exports: [SosService],
})
export class SosModule {}
