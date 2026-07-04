import { Pool } from 'pg'

import { Usuario } from '../model/user'

export class UserRepository {
  constructor(private readonly pool: Pool) {}

  async findByLogin(login: string): Promise<Usuario | null> {
    const { rows } = await this.pool.query<Usuario>(
      'SELECT * FROM usuario WHERE login = $1',
      [login]
    )

    if (rows.length === 0) {
      return null
    }

    return rows[0]
  }

  async create(user: Omit<Usuario, 'id'>): Promise<Usuario> {
    const {
      rows: [row]
    } = await this.pool.query<Usuario>(
      'INSERT INTO usuario (nome, email, login, senha, cpf) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.nome, user.email, user.login, user.senha, user.cpf]
    )

    return row
  }
}
