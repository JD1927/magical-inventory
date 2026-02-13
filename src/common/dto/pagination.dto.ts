import { Transform } from 'class-transformer';
import { IsOptional, IsPositive, IsString, Min } from 'class-validator';

export enum ELimitSettings {
  DEFAULT = 10,
  MAX = 100,
}

export class PaginationDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsPositive()
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsString()
  term?: string;
}
