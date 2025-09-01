import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum OrderBy {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class ProfitReportDto {
  @IsEnum(OrderBy)
  @IsOptional()
  orderBy?: OrderBy;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
