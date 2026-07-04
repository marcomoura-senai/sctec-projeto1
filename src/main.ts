import 'dotenv/config'
import { initDatabase, pool } from './@common/database/database'
import { UserRepository } from './repositories/user.repository'
import { CreateUserUseCase } from './usecase/create-user.uc'
import { MainView } from './view/main.view'

async function bootstrap() {
  await initDatabase()

  const createUserUc = new CreateUserUseCase(new UserRepository(pool))
  const mainView = new MainView(createUserUc)

  await mainView.start()
}

bootstrap()
  .then(() => {
    process.exit(0)
  })
  .catch((e: unknown) => {
    console.log('UNHANDLED REJECTION')
    console.error(e)
    process.exit(1)
  })
