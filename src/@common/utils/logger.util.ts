export class LoggerUtil {
  static error(error: unknown): void {
    if (process.env.DEBUG) {
      return
    }

    console.error(error)
  }
}
