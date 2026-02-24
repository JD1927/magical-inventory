import { User } from '../entities/user.entity';

export interface IRequestWithUser extends Request {
  user?: User;
}

export interface ITokenPayload {
  uid: string;
  role: string;
}

export interface ITokenResponse {
  accessToken: string;
}
