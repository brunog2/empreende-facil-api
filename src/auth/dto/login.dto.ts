import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString({ message: 'A senha é obrigatória' })
  password: string;
}


