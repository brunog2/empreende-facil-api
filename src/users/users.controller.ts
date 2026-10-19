import {
  Controller,
  Patch,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserRole } from './user-access.constants';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: { id: string },
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const updatedUser = await this.usersService.update(user.id, {
      fullName: updateProfileDto.fullName,
      businessName: updateProfileDto.businessName,
      phone: updateProfileDto.phone,
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      businessName: updatedUser.businessName,
      phone: updatedUser.phone,
    };
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    if (user.role === UserRole.Admin) {
      throw new ForbiddenException(
        'A conta administrativa não pode ser excluída por esta rota',
      );
    }
    await this.usersService.deleteAccount(user.id);
    return { message: 'Conta excluída com sucesso' };
  }
}

