import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';

export interface UserAccessTokenPayload {
  userId: string;
  type: 'user';
}

export interface AdminAccessTokenPayload {
  adminId: string;
  role: 'admin' | 'super_admin';
  type: 'admin';
}

export type AccessTokenPayload = UserAccessTokenPayload | AdminAccessTokenPayload;

export interface RefreshTokenPayload {
  id: string;
  type: 'user' | 'admin';
  sessionId?: string;
}

export const generateAccessToken = (payload: AccessTokenPayload): string => {
  const secret: Secret = config.jwtAccessSecret;
  const options: SignOptions = {
    expiresIn: config.jwtAccessExpiresIn as any,
  };
  return jwt.sign(payload, secret, options);
};

export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  const secret: Secret = config.jwtRefreshSecret;
  const options: SignOptions = {
    expiresIn: config.jwtRefreshExpiresIn as any,
  };
  return jwt.sign(payload, secret, options);
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const secret: Secret = config.jwtAccessSecret;
  return jwt.verify(token, secret) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const secret: Secret = config.jwtRefreshSecret;
  return jwt.verify(token, secret) as RefreshTokenPayload;
};
