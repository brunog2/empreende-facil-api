import {
  Controller,
  Get,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PlanFeature } from '../subscriptions/constants/subscription.constants';
import { RequireFeature } from '../subscriptions/decorators/require-feature.decorator';
import { SubscriptionGuard } from '../subscriptions/guards/subscription.guard';
import { UserPermission } from '../users/user-access.constants';
import {
  ExportReportDto,
  ReportExportFormat,
  ReportPeriodDto,
} from './dto/report-query.dto';
import { ReportExportService } from './report-export.service';
import { ReportsService } from './reports.service';

@Controller('reports')
@RequirePermission(UserPermission.Reports)
@RequireFeature(PlanFeature.Reports)
@UseGuards(JwtAuthGuard, PermissionGuard, SubscriptionGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly exportService: ReportExportService,
  ) {}

  @Get('summary')
  getSummary(
    @CurrentUser() user: { id: string },
    @Query() query: ReportPeriodDto,
  ) {
    return this.reportsService.getSummary(user.id, query);
  }

  @Get('advanced')
  @RequireFeature(PlanFeature.AdvancedReports)
  getAdvanced(
    @CurrentUser() user: { id: string },
    @Query() query: ReportPeriodDto,
  ) {
    return this.reportsService.getAdvanced(user.id, query);
  }

  @Get('export')
  @RequireFeature(PlanFeature.DataExport)
  async export(
    @CurrentUser() user: { id: string },
    @Query() query: ExportReportDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const data = await this.reportsService.getExportData(user.id, query);
    const date = new Date().toISOString().slice(0, 10);
    const isExcel = query.format === ReportExportFormat.Excel;
    const content = isExcel
      ? await this.exportService.toExcel(data)
      : await this.exportService.toPdf(data);
    const extension = isExcel ? 'xlsx' : 'pdf';
    response.set({
      'Content-Type': isExcel
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf',
      'Content-Disposition': `attachment; filename="gestao-pro-relatorio-${date}.${extension}"`,
      'Content-Length': content.length,
    });
    return new StreamableFile(content);
  }
}
