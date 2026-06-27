import { LoginFormDto } from './dto/login-form.dto'
import { ConsoleView } from '../@common/view/console.view'

export class MainView extends ConsoleView {
  constructor() {
    super(true)
  }

  protected async update(): Promise<void> {
    this.display('========================================')
    this.display('   Bem-vindo ao Acervo CLI              ')
    this.display('   Sistema de Gestão de Biblioteca      ')
    this.display('========================================')
    this.display('')

    const loginDto = await this.promptInteractiveForm(
      `Amigão passa o login e senha please: `,
      LoginFormDto.schema(),
      LoginFormDto
    )

    this.display(`Você logou como ${JSON.stringify(loginDto)}`)

    await this.prompt('Pressione ENTER para sair...')
    this.exit()
  }
}
