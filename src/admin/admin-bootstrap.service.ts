import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { AdminService } from './admin.service';

@Injectable()
export class AdminBootstrapService implements OnApplicationBootstrap {
  constructor(private adminService: AdminService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.adminService.ensureDevelopmentAdmin();
  }
}

