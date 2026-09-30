import { IUser } from '../models/auth/user.model';
import { IAdmin } from '../models/auth/admin.model';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      admin?: IAdmin;
    }
  }
}
