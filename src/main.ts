import 'dotenv/config'
import { MainView } from './view/main.view'

async function bootstrap() {
  const mainView = new MainView()

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
