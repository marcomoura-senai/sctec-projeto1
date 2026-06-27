import { ConsoleFormSchema } from '../../@common/view/console.view'

export class LoginFormDto {
  constructor(
    public login: string,
    public senha: string
  ) {}

  static schema(): ConsoleFormSchema {
    return {
      login: { type: 'string', required: true, default: 'admin' },
      senha: { type: 'string', required: true }
    }
  }
}
