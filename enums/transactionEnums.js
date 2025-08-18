/**
 * Transaction-related enums based on database schema
 */

const TransactionType = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal'
};

const TransactionStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

module.exports = {
  TransactionType,
  TransactionStatus
};

