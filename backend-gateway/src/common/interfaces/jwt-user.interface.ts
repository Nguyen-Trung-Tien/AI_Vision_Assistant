import { Role } from '../enums/role.enum';

export interface JwtUser {
  userId: string;
  email?: string;
  role?: Role;
}
