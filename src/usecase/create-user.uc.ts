import { Usuario } from '../model/user'
import { UserRepository } from '../repositories/user.repository'
import { CreateUserDto } from '../view/dto/create-user-form.dto'

export class CreateUserUseCase {
  constructor(private readonly repository: UserRepository) {}

  async execute(user: CreateUserDto): Promise<Usuario> {
    const existingUser = await this.repository.findByLogin(user.login)

    if (existingUser) {
      throw new Error('Usuário já cadastrado')
    }

    return await this.repository.create(user)
  }
}
