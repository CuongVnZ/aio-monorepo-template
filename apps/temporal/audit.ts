
type AuditLogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";
const AuditLogLevelCmp = {
  "DEBUG": 0,
  "INFO": 1,
  "WARNING": 2,
  "ERROR": 3,
  "CRITICAL": 4,
}

interface AuditLog {
  userId?: string;
  requestId?: string;

  severity: AuditLogLevel;
  message: string;
  timestampMs: number;
}

export interface AuditLogOptions {
  userId?: string;
  requestId?: string;
}

const loggerWithLevel = (level: AuditLogLevel) => {
  return (message: string, options: AuditLogOptions = {}) => {
    if (process.env.DISABLE_AUDIT_LOGGING === "true") {
      return;
    }
    if (process.env.AUDIT_LOG_LEVEL && AuditLogLevelCmp[level] < AuditLogLevelCmp[process.env.AUDIT_LOG_LEVEL as AuditLogLevel]) {
      return;
    }

    const log: AuditLog = {
      message: message,
      severity: level,
      timestampMs: Date.now(),
      ...options,
    }

    switch (level) {
      case "DEBUG":
        console.debug(JSON.stringify(log));
        break;
      case "INFO":
        console.info(JSON.stringify(log));
        break;
      case "WARNING":
        console.warn(JSON.stringify(log));
        break;
      case "ERROR":
        console.error(JSON.stringify(log));
        break;
      case "CRITICAL":
        console.error(JSON.stringify(log));
        throw new Error(JSON.stringify(log));
    }
  }
}

export const audit = {
  // Default to debug
  log: loggerWithLevel(process.env.AUDIT_LOG_LEVEL as AuditLogLevel ?? "DEBUG"),

  debug: loggerWithLevel("DEBUG"),
  info: loggerWithLevel("INFO"),
  warn: loggerWithLevel("WARNING"),
  error: loggerWithLevel("ERROR"),
  critical: loggerWithLevel("CRITICAL"),
}

export const auditLogIfNecessary = (message: string, options?: AuditLogOptions) => {
  if (!options) {
    return undefined;
  }
  return audit.log(message, options);
}

export const getAuditedService = <T extends object>(service: T, options?: AuditLogOptions): T => {
  return new Proxy(service, {
    get: (target, prop) => {
      if (typeof target[prop as keyof T] === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        return new Proxy(target[prop as keyof T] as unknown as Function, {
          apply: (targetMethod, thisArg, argumentsList) => {
            const methodName = String(prop);
            audit.log(`Calling method ${methodName}`, options);

            try {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              const result = targetMethod.apply(thisArg, argumentsList);

              if (result instanceof Promise) {
                return result.then((resolvedResult) => {
                  audit.log(`Method ${methodName} promise resolved`, options);
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                  return resolvedResult;
                }).catch((error) => {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  audit.error(`Method ${methodName} promise rejection: ${error.message}`, options);
                  throw error;
                });
              } else {
                audit.log(`Method ${methodName} completed successfully`, options);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return result;
              }
            } catch (error) {
              audit.error(`Method ${methodName} failed: ${error instanceof Error ? error.message : JSON.stringify(error)}`, options);
              throw error;
            }
          }
        });
      }
      return service[prop as keyof T];
    }
  });
}