type LogContext = Record<string, unknown>;

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return error;
}

export const aiLogger = {
  info(stage: string, context?: LogContext) {
    console.log(`[AI:${stage}]`, context ?? "");
  },

  error(stage: string, error: unknown, context?: LogContext) {
    console.error(`[AI:${stage}]`, {
      ...context,
      error: serializeError(error),
    });
  },
};
