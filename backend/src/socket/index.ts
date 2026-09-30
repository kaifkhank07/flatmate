import { Server as HttpServer } from 'http';
import { Server, ServerOptions } from 'socket.io';
import { config } from '../config/env';
import { logger } from '../utils/logger.util';
import { registerSocketAuthMiddleware, setupChatSocketEvents } from './chat.socket';

let ioInstance: Server | null = null;

export const initializeSocket = (httpServer: HttpServer): Server => {
  const options: Partial<ServerOptions> = {
    cors: {
      origin: config.clientUrls,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  };

  const io = new Server(httpServer, options);

  registerSocketAuthMiddleware(io);
  setupChatSocketEvents(io);

  ioInstance = io;
  logger.info('[Socket] Socket.io server initialized successfully');

  return io;
};

export const getIO = (): Server => {
  if (!ioInstance) {
    throw new Error('Socket.io server has not been initialized yet!');
  }
  return ioInstance;
};
