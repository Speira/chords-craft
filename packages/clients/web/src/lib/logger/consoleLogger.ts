export type LoggerMethod = "log" | "error" | "warn" | "info" | "debug" | "trace";
/**
 * Logger helper class to be used as the main logger of the application
 *
 * @example
 *   ```ts
 *   Logger.log('Hello, world!');
 *   Logger.error('Error, world!');
 *   Logger.warn('Warning, world!');
 *   Logger.info('Info, world!');
 *   Logger.debug('Debug, world!');
 *   Logger.trace('Trace, world!');
 *   Logger.table(['Hello', 'world']);
 *   Logger.group('Group, world!');
 *   Logger.groupEnd();
 *   Logger.count('Count, world!');
 *   Logger.timeStart('Time, world!');
 *   Logger.timeEnd('Time, world!');
 *   ```;
 */
export class Logger {
  private static get isProduction() {
    return process.env.NODE_ENV === "production";
  }

  static log = this.isProduction ? () => {} : console.log?.bind(console);
  static error = this.isProduction ? () => {} : console.error?.bind(console);
  static warn = this.isProduction ? () => {} : console.warn?.bind(console);
  static info = this.isProduction ? () => {} : console.info?.bind(console);
  static debug = this.isProduction ? () => {} : console.debug?.bind(console);
  static trace = this.isProduction ? () => {} : console.trace?.bind(console);
  static table = this.isProduction
    ? () => {}
    : console.table?.bind(console) || (() => {});
  static group = this.isProduction
    ? () => {}
    : console.group?.bind(console) || (() => {});
  static groupEnd = this.isProduction
    ? () => {}
    : console.groupEnd?.bind(console) || (() => {});
  static count = this.isProduction
    ? () => {}
    : console.count?.bind(console) || (() => {});
  static timeStart = this.isProduction
    ? () => {}
    : console.time?.bind(console) || (() => {});
  static timeEnd = this.isProduction
    ? () => {}
    : console.timeEnd?.bind(console) || (() => {});
}
