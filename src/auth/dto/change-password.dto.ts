import { IsString, Matches, MinLength } from 'class-validator';
import {
  STRONG_PASSWORD_MESSAGE,
  STRONG_PASSWORD_PATTERN,
} from '../password.policy';

export class ChangePasswordDto {
  @IsString({ message: 'A senha atual deve ser uma string' })
  @MinLength(1, { message: 'Informe a senha atual' })
  currentPassword: string;

  @IsString({ message: 'A nova senha deve ser uma string' })
  @Matches(STRONG_PASSWORD_PATTERN, { message: STRONG_PASSWORD_MESSAGE })
  newPassword: string;
}
