import mongoose, { ClientSession } from 'mongoose';
import { logger } from './logger.util';

/**
 * Check if the current MongoDB connection supports multi-document transactions.
 * Transactions are supported on MongoDB Replica Sets (and sharded clusters).
 */
export const supportsTransactions = (): boolean => {
  try {
    const client: any = mongoose.connection.getClient();
    if (!client) return false;
    const topology = client.topology;
    if (!topology) return false;
    const description = topology.description;
    if (!description) return false;
    const type = description.type;
    return type === 'ReplicaSetWithPrimary' || type === 'ReplicaSetNoPrimary' || type === 'Sharded';
  } catch (err) {
    logger.warn('[TransactionUtil] Could not inspect topology, assuming fallback mode:', err);
    return false;
  }
};

/**
 * Execute a callback within a MongoDB transaction if transactions are supported.
 * If the MongoDB instance is a standalone server without replica sets, the callback
 * is executed with a `null` session as a graceful, safe fallback.
 *
 * @param operation Callback that accepts a `session` (ClientSession | null) and returns a promise.
 * @returns Result of the operation callback.
 */
export const runInTransaction = async <T>(
  operation: (session: ClientSession | null) => Promise<T>
): Promise<T> => {
  const isReplicaSet = supportsTransactions();

  if (!isReplicaSet) {
    logger.info('[TransactionUtil] Standalone MongoDB detected or replica set not ready. Running operation without transaction session.');
    return operation(null);
  }

  const session = await mongoose.startSession();
  try {
    let result: T;
    await session.withTransaction(async () => {
      result = await operation(session);
    });
    return result!;
  } catch (error) {
    logger.error('[TransactionUtil] Transaction aborted due to error:', error);
    throw error;
  } finally {
    await session.endSession();
  }
};
