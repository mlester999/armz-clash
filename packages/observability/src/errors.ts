export function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    };
  }
  return {
    name: 'UnknownError',
    message: typeof error === 'string' ? error : 'Unknown error',
  };
}
