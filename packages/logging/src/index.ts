import { serializeError } from "serialize-error";

/**
 * IMPORTANT NOTE: instantiating Logger in the test environment will fail, due to 'serialize-error' package
 */

export class Logger {
  private messageQueue: string[] = [];
  private maxChars = 4000;

  constructor(private readonly context: string) {
    this.context = `${process.env.APP_ENV ? `[${process.env.APP_ENV}] ` : ""}${context ? `[${context}] ` : ""}`;

    // this.info(`STARTED 🚀`);
  }

  private addToQueue(message: string) {
    // Add the trimmed message to the queue, ensuring it doesn't exceed 4000 characters
    // Add the (TRIMMED) text at the end
    let trimmedMsg = message;
    if (message.length > this.maxChars) {
      trimmedMsg = message.substring(0, this.maxChars - 12) + "...(TRIMMED)";
    }
    this.messageQueue.push(trimmedMsg);
  }

  /**
   * Doesn't send to slack
   * @param args
   */
  debug(...args: any[]): void {
    const messages = [
      `🐞️ [DEBUG] ${this.context}`,
      ...this.stringifyArgs(args),
    ];
    console.debug(...messages);
  }

  log(...args: any[]): void {
    console.log(...this.stringifyArgs(args));
  }

  processing(...args: any[]): void {
    const messages = [
      `⚙️ [PROCESSING] ${this.context}`,
      ...this.stringifyArgs(args),
    ];
    console.log(...messages);
    this.addToQueue(messages.join(" "));
  }

  success(...args: any[]): void {
    const messages = [
      `✅ [SUCCESS] ${this.context}`,
      ...this.stringifyArgs(args),
    ];
    console.log(...messages);
    this.addToQueue(messages.join(" "));
  }

  info(...args: any[]): void {
    const messages = [
      `ℹ️  [INFO] ${this.context}`,
      ...this.stringifyArgs(args),
    ];
    console.log(...messages);
    this.addToQueue(messages.join(" "));
  }

  warn(...args: any[]): void {
    const messages = [`⚠️ [WARN] ${this.context}`, ...this.stringifyArgs(args)];
    console.warn(...messages);
    this.addToQueue(messages.join(" "));
  }

  error(...args: any[]): void {
    const messages = [
      `❌ [ERROR] ${this.context}`,
      ...this.stringifyArgs(args),
    ];
    console.error(...messages);
    this.addToQueue(messages.join(" ") + " <@U06V8CN7ZH9>");
  }

  fatal(...args: any[]): void {
    const messages = [
      `🔥 [FATAL] ${this.context}`,
      ...this.stringifyArgs(args),
    ];
    console.error(...messages);
    this.addToQueue(messages.join(" ") + " <@U06V8CN7ZH9>");
  }

  private stringifyArgs(args: any[]): string[] {
    const finalArgs: any[] = [];
    for (const arg of args) {
      // if arg is a type of object, stringify it
      const obj: string =
        typeof arg === "object"
          ? `\n${JSON.stringify(serializeError(arg), null, 2)}\n`
          : String(arg);
      finalArgs.push(obj);
    }
    return finalArgs as string[];
  }
}
