import {
     ApiBase,
     Auth,
     OnGetItemList,
     OnGetImage,
     OnGetProductList,
     OnTest,
     OnUploadImage,
     OnGetFileName,
     OnDeleteFile,
     OnSubscribe,
     OnUserLogin,
     OnResetPassowrdOTP,
     OnUpdatePassword,
     OnEmailOTP,
     OnCreateAccount,
     OnGetState,
     OnEditAccount,
     OnGetCart,
     OnAddItemCart,
     OnMinusItemCart,
     OnRemoveItemCart,
     OnGetMainProductList,
} from './base.api/index'
import { MySqlService } from './mySql/index'
import { GoogleCloudStorage } from './GoogleCloud/index'
import { Mail } from './mail/index'
import { CronService } from './cronService/index'
import { CronJob } from 'cron'
import dotenv from 'dotenv'

export class service {
     private static cronJob: CronJob
     private static cronTime: string
     private static isDirty: boolean = false
     private static runner: NodeJS.Timeout

     public static async init() {
          dotenv.config()
          this.cronTime = process.env.cronTime

          // Initialize the application
          ApiBase.init()
          GoogleCloudStorage.init()
          await MySqlService.init()
          await Mail.init()

          // test
          ApiBase.get('/test', OnTest, Auth.None)

          // post
          ApiBase.post('/upload/image', OnUploadImage, Auth.Bearer)
          ApiBase.post('/file/delete', OnDeleteFile, Auth.Bearer)
          ApiBase.post('/login/user', OnUserLogin, Auth.Bearer)
          ApiBase.post('/send/reset/otp', OnResetPassowrdOTP, Auth.Bearer)
          ApiBase.post('/reset/password', OnUpdatePassword, Auth.Bearer)
          ApiBase.post('/send/verify/otp', OnEmailOTP, Auth.Bearer)
          ApiBase.post('/create/account', OnCreateAccount, Auth.Bearer)
          ApiBase.post('/edit/account', OnEditAccount, Auth.Cookie)
          ApiBase.post('/edit/cart/add', OnAddItemCart, Auth.Cookie)
          ApiBase.post('/edit/cart/minus', OnMinusItemCart, Auth.Cookie)
          ApiBase.post('/edit/cart/remove', OnRemoveItemCart, Auth.Cookie)

          // get
          ApiBase.get('/products', OnGetProductList, Auth.Bearer)
          ApiBase.get('/items', OnGetItemList, Auth.Bearer)
          ApiBase.get('/image', OnGetImage, Auth.Bearer)
          ApiBase.get('/file/name', OnGetFileName, Auth.Bearer)
          ApiBase.get('/subscribe', OnSubscribe, Auth.Bearer)
          ApiBase.get('/state', OnGetState, Auth.Bearer)
          ApiBase.get('/cart', OnGetCart, Auth.Cookie)
          ApiBase.get('/products/main', OnGetMainProductList, Auth.Bearer)

          // await this.start()
     }

     // program
     private static async start() {
          this.cronJob = new CronJob(this.cronTime, () => this.trigger(), null, true, '')
     }

     private static async trigger() {
          this.isDirty = true

          if (undefined === this.runner) {
               this.runner = setTimeout(async () => {
                    try {
                         do {
                              this.isDirty = false

                              await this.process()
                         } while (this.isDirty)
                    } catch (err) {
                         console.log(`Failed to trigger: `, err)
                    }

                    this.runner = undefined
                    return console.log('Process exited')
               }, 0)
          }
     }

     private static async process() {
          await CronService.process()
     }

     public static async TerminateService() {
          console.log('Service terminate ...')
          this.cronJob.stop()
          ApiBase.terminate()
          await MySqlService.terminate()
     }
}
