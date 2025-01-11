import { service } from './service'

class App {
     public static async Init() {
          try {
               await service.init()

               process.on('SIGINT', async () => {
                    await service.TerminateService()
               })
          } catch (err) {
               await service.TerminateService()

               process.exit(1)
          }
     }
}

App.Init()
