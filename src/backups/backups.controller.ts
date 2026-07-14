import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PlanFeature } from '../subscriptions/constants/subscription.constants';
import { RequireFeature } from '../subscriptions/decorators/require-feature.decorator';
import { SubscriptionGuard } from '../subscriptions/guards/subscription.guard';
import { BackupsService } from './backups.service';

@Controller('backups')
@RequireFeature(PlanFeature.AutomaticBackup)
@UseGuards(JwtAuthGuard, SubscriptionGuard)
export class BackupsController {
  constructor(private readonly backupsService: BackupsService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.backupsService.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }) {
    return this.backupsService.createManual(user.id);
  }

  @Get(':id/download')
  async download(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const backup = await this.backupsService.download(user.id, id);
    response.set({
      'Content-Type': backup.contentType,
      'Content-Disposition': `attachment; filename="${backup.fileName}"`,
      'Content-Length': backup.data.length,
      'X-Content-SHA256': backup.checksum,
    });
    return new StreamableFile(backup.data);
  }
}
