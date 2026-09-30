import { CookieOptions, Response } from 'express';
import { config } from '../config/env';

export const ACCESS_TOKEN_COOKIE_NAME = 'accessToken';
export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

/**
 * Parse standard duration string (e.g. '15m', '30d', '1h', '7d', '900s') into milliseconds.
 * Defaults to fallbackMs if parsing fails.
 */
export const parseDurationToMs = (duration: string | number, fallbackMs: number): number => {
  if (typeof duration === 'number') {
    return duration;
  }
  if (!duration || typeof duration !== 'string') {
    return fallbackMs;
  }

  const match = duration.trim().match(/^(\d+)([smhd])$/i);
  if (!match) {
    const parsed = parseInt(duration, 10);
    return isNaN(parsed) ? fallbackMs : parsed * 1000;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return fallbackMs;
  }
};

const isProduction = (): boolean => {
  return config.nodeMode === 'production' || process.env.NODE_ENV === 'production';
};

/**
 * Common base cookie options
 */
const getBaseCookieOptions = (): CookieOptions => {
  const isProd = isProduction();
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  };
};

/**
 * Cookie options for Access Token based on JWT_ACCESS_EXPIRES_IN
 */
export const getAccessTokenCookieOptions = (): CookieOptions => {
  const maxAgeMs = parseDurationToMs(config.jwtAccessExpiresIn, 15 * 60 * 1000); // 15m fallback
  return {
    ...getBaseCookieOptions(),
    maxAge: maxAgeMs,
  };
};

/**
 * Cookie options for Refresh Token based on JWT_REFRESH_EXPIRES_IN
 */
export const getRefreshTokenCookieOptions = (): CookieOptions => {
  const maxAgeMs = parseDurationToMs(config.jwtRefreshExpiresIn, 30 * 24 * 60 * 60 * 1000); // 30d fallback
  return {
    ...getBaseCookieOptions(),
    maxAge: maxAgeMs,
  };
};

/**
 * Cookie options for Clearing Cookies
 */
export const getClearCookieOptions = (): CookieOptions => {
  return {
    ...getBaseCookieOptions(),
  };
};

/**
 * Helper to set both access and refresh HTTP-only cookies on the response
 */
export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
): void => {
  res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, getAccessTokenCookieOptions());
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, getRefreshTokenCookieOptions());
};

/**
 * Helper to clear auth HTTP-only cookies on the response
 */
export const clearAuthCookies = (res: Response): void => {
  const clearOptions = getClearCookieOptions();
  res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, clearOptions);
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, clearOptions);
};
