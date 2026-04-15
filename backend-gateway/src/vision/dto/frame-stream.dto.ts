import {
  IsString,
  IsNumber,
  IsOptional,
  IsLatitude,
  IsLongitude,
} from 'class-validator';

export class FrameStreamDto {
  @IsString()
  frame!: string;

  @IsOptional()
  @IsString()
  task_type?: string;

  @IsOptional()
  @IsString()
  lang?: string;

  @IsOptional()
  @IsNumber()
  warning_distance_m?: number;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @IsString()
  mode?: string;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsNumber()
  frame_seq?: number;
}
