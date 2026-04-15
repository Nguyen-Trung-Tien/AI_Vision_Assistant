import { JwtUser } from '../common/interfaces/jwt-user.interface';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends JwtUser {}
  }
}

export {};
