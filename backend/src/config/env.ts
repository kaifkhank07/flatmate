import dotenv from 'dotenv';
dotenv.config();

export type NodeMode = 'development' | 'production' | 'test';

export interface AppConfig {
  nodeMode: NodeMode;
  port: number;
  mongodbUri: string;
  mongodbDbName: string;
  clientUrls: string[];
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiresIn: string;
  jwtRefreshExpiresIn: string;
  superAdminName?: string;
  superAdminEmail?: string;
  superAdminPassword?: string;
}

const getNodeMode = (): NodeMode => {
  const mode = process.env.NODE_MODE?.toLowerCase();
  if (mode === 'production' || mode === 'test') {
    return mode;
  }
  return 'development';
};

const getMongoUri = (): string => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    throw new Error(
      `[Config Error] Missing MONGODB_URI in environment variables. Please specify MONGODB_URI.`
    );
  }

  return uri;
};

const getDbName = (mode: NodeMode): string => {
  if (process.env.MONGODB_DB_NAME && process.env.MONGODB_DB_NAME.trim() !== '') {
    return process.env.MONGODB_DB_NAME.trim();
  }

  switch (mode) {
    case 'test':
      return 'flatmate_test';
    case 'production':
      return 'flatmate_production';
    case 'development':
    default:
      return 'flatmate_dev';
  }
};

const getClientUrls = (): string[] => {
  const rawUrls = process.env.CLIENT_URLS;
  if (!rawUrls || rawUrls.trim() === '') {
    return ['http://localhost:3000', 'http://localhost:3001'];
  }
  return rawUrls
    .split(',')
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
};

const currentMode = getNodeMode();
const clientUrls = getClientUrls();

export const config: AppConfig = {
  nodeMode: currentMode,
  port: parseInt(process.env.PORT || '5000', 10),
  mongodbUri: getMongoUri(),
  mongodbDbName: getDbName(currentMode),
  clientUrls: clientUrls,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'default_access_secret_change_in_prod',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_change_in_prod',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  superAdminName: process.env.SUPER_ADMIN_NAME,
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL,
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD,
};
