export const logger = {
  info: (message: string, meta?: any): void => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta !== undefined ? meta : '');
  },
  warn: (message: string, meta?: any): void => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta !== undefined ? meta : '');
  },
  error: (message: string, meta?: any): void => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta !== undefined ? meta : '');
  },
};
