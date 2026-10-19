import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export class ReportPeriodDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export enum ReportExportFormat {
  Excel = 'xlsx',
  Pdf = 'pdf',
}

export class ExportReportDto extends ReportPeriodDto {
  @IsEnum(ReportExportFormat)
  format: ReportExportFormat;
}
