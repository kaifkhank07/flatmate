import http from 'http';
import app from './app';
import { config } from './config/env';
import { connectDB } from './config/db';
import { initializeSocket } from './socket';

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    const server = http.createServer(app);

    initializeSocket(server);

    server.listen(config.port, () => {
      console.log(`Server running on port ${config.port} (${config.nodeMode} mode)`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
