import type { DatabaseError, DatabaseErrorCode } from './types';

export function mapDatabaseError(error: unknown): DatabaseError {
  if (!error || typeof error !== 'object') {
    return { code: 'unknown', message: 'Unknown database error', cause: error };
  }

  const record = error as { code?: string; message?: string; details?: string };
  const message = record.message ?? record.details ?? 'Database error';

  let code: DatabaseErrorCode = 'unknown';
  if (record.code === '42501' || /permission|rls|policy/i.test(message)) {
    code = 'permission_denied';
  } else if (record.code === '23505' || /duplicate|unique/i.test(message)) {
    code = 'conflict';
  } else if (record.code === 'PGRST116' || /not found/i.test(message)) {
    code = 'not_found';
  } else if (/validation|check constraint/i.test(message)) {
    code = 'validation_failed';
  }

  return { code, message, cause: error };
}
