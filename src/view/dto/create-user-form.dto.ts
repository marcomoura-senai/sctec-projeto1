import { ConsoleFormSchema } from '../../@common/view/console.view'

export class CreateUserDto {
  constructor(
    public login: string,
    public senha: string,
    public email: string,
    public nome: string,
    public cpf: string
  ) {}

  static schema(): ConsoleFormSchema {
    return {
      nome: { type: 'string', required: true },
      email: { type: 'string', required: true },
      cpf: { type: 'string', required: true },
      login: { type: 'string', required: true },
      senha: { type: 'string', required: true }
    }
  }
}
