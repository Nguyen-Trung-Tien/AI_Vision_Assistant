import { IsString, IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class FrameStreamDto {
  @IsString()
  frame: string;

  @IsOptional()
  @IsString()
  task_type?: string;

  @IsOptional()
  @IsString()
  lang?: string;

  @IsOptional()
  @IsNumber()
  warning_distance_m?: number;
}
