import { BaseException } from '../errors/base.exception'
import { defer } from '../utils/common.util'
import { LoggerUtil } from '../utils/logger.util'
import { ReadlineInterfaceUtil } from '../utils/readline-interface.util'

export type ConsoleFormSchema = Record<string, InteractiveFormKey>

interface InteractiveFormKey {
  type: 'string' | 'number' | 'boolean'
  required?: boolean
  default?: string | number | boolean
}

export abstract class ConsoleView {
  protected static readonly ABORT_SENTINEL = '\x00ABORT'

  protected isInView = true

  private aborted = false

  private readlineInterface = ReadlineInterfaceUtil.readlineInterface

  constructor(private readonly isRootView = false) {}

  private resetState(): void {
    this.isInView = true
    this.aborted = false
  }

  private async promptUntilValid(prompt: string, schema: InteractiveFormKey) {
    const parseResponse = (
      response: string,
      schema: InteractiveFormKey
    ): [boolean, string | number | boolean | null] => {
      if (!response) {
        if (schema.default) {
          return [true, schema.default]
        }

        if (schema.required) {
          this.display('Campo obrigatório! Tente novamente...')
          return [false, null]
        }

        return [true, null]
      }

      if (schema.type === 'string') {
        return [true, response]
      }

      if (schema.type === 'number') {
        this.display('Digite um número válido! Tente novamente...')
        const n = Number(response)
        return [!Number.isNaN(n), n]
      }

      if (
        response.toLowerCase() !== 'true' &&
        response.toLocaleLowerCase() !== 'false'
      ) {
        this.display(
          'O campo só pode ser verdadeiro ou falso! Tente novamente...'
        )
        return [false, null]
      }

      return [true, Boolean(response)]
    }

    for (;;) {
      const response = await this.prompt(prompt)

      const [isValid, parsedResponse] = parseResponse(response, schema)
      if (isValid) {
        return parsedResponse
      }
    }
  }

  protected abstract update(): void | Promise<void>

  protected async prompt(message: string): Promise<string> {
    if (this.aborted) {
      return ConsoleView.ABORT_SENTINEL
    }

    const controller = new AbortController()

    const onSigint = (): void => {
      controller.abort()
    }

    this.readlineInterface.once('SIGINT', onSigint)

    try {
      return await this.readlineInterface.question(message, {
        signal: controller.signal
      })
    } catch (error) {
      if (
        controller.signal.aborted ||
        (error instanceof Error &&
          'code' in error &&
          error.code === 'ERR_USE_AFTER_CLOSE')
      ) {
        process.exit(0)
      }

      throw error
    } finally {
      this.readlineInterface.removeListener('SIGINT', onSigint)
    }
  }

  protected async promptInteractiveForm<T extends object>(
    message: string,
    formSchema: Record<string, InteractiveFormKey>, // values are the default, if undefined, one must be provided. You can also use REQUIRED.
    projection: new (...args: any) => T
  ): Promise<T> {
    this.display(message)

    const projectionCopy = new projection()

    for (const [key, value] of Object.entries(formSchema)) {
      const response = await this.promptUntilValid(
        `${key}${value.default ? ` (${value.default.toString()})` : ''}: `,
        value
      )

      // TODO: What this error should be? it's a technical implementation error, not domain. Non recoverable
      if (!(key in projectionCopy)) {
        throw new BaseException({
          cause: `Schema key ${key} not found in projection`
        })
      }
      Object.assign(projectionCopy, { [key]: response })
    }

    return projectionCopy
  }

  protected display(message: string): void {
    console.log(message)
  }

  /**
   * Report a *technical* failure: log the real error (stderr, for the dev) and
   * show the user a curated, non-leaking message. Never pass `error.message`
   * straight to `display` — it can carry internals (contract JSON, stack). Only
   * for technical errors; domain outcomes are shown directly, never logged.
   */
  protected reportTechnicalError(
    error: unknown,
    userMessage = 'Algo deu errado. Tente novamente.'
  ): void {
    LoggerUtil.error(error)
    this.display(userMessage)
  }

  protected showError(message: string | Error): void {
    LoggerUtil.error(message)
  }

  protected clear(): void {
    console.clear()
  }

  protected close(): void {
    return void 0
  }

  protected onEnter(): void | Promise<void> {
    this.clear()
  }

  protected onExit(): void | Promise<void> {
    return void 0
  }

  protected async onUpdateError(error: unknown): Promise<void> {
    if (error instanceof BaseException) {
      LoggerUtil.error(error)
      this.display(error.message)
      await this.prompt('Pressione ENTER para continuar:')
      return
    }
    throw error
  }

  protected exit(reason?: Error): void {
    this.isInView = false
    if (reason) {
      this.showError(reason)
    }
  }

  async start(): Promise<void> {
    this.resetState()

    using _ = this.isRootView
      ? defer(() => {
          this.readlineInterface.close()
        })
      : undefined

    try {
      await this.onEnter()

      while (this.isInView) {
        try {
          this.clear()
          await this.update()
        } catch (error: unknown) {
          await this.onUpdateError(error)
        }
      }

      await this.onExit()
    } catch (error) {
      if (error instanceof Error) {
        this.showError(error)
      }
      this.display('View exiting with error')
      await this.prompt('Press ENTER to continue:')
    }
  }
}
