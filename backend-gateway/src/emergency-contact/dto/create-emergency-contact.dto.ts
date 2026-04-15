import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateEmergencyContactDto {
  @IsString()
  @Length(1, 120)
  name!: string;

  @IsString()
  @Length(3, 32)
  @Matches(/^[0-9+\-\s().]+$/, { message: 'phone format is invalid' })
  phone!: string;

  @IsOptional()
  @IsString()
  @Length(0, 80)
  relationship?: string;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;

  @IsOptional()
  @IsBoolean()
  notify_sms?: boolean;

  @IsOptional()
  @IsBoolean()
  notify_call?: boolean;
}
