import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../users/user-access.constants';
import { UsersService } from '../../users/users.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const config = { get: jest.fn().mockReturnValue('test-secret') } as unknown as ConfigService;
  const users = { findById: jest.fn() } as unknown as UsersService;
  const strategy = new JwtStrategy(config, users);

  it('bloqueia usuário administrativamente inativo', async () => {
    (users.findById as jest.Mock).mockResolvedValue({
      id: 'user-id',
      role: UserRole.Customer,
      isActive: false,
    });
    await expect(
      strategy.validate({ sub: 'user-id', role: UserRole.Customer }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
