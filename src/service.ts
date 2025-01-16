import { ApiBase, Auth, OnGetItemList, OnGetImage, OnGetProductList, OnTest, OnUploadImage, OnGetFileName, OnDeleteFile, OnSubscribe, OnUserLogin, OnSendOTP } from './base.api/index'
import { MySqlService } from './mySql/index'
import { GoogleCloudStorage } from './GoogleCloud/index'
import { Mail } from './mail/index'

export class service {
     public static async init() {
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

          // get
          ApiBase.get('/products', OnGetProductList, Auth.Bearer)
          ApiBase.get('/items', OnGetItemList, Auth.Bearer)
          ApiBase.get('/image', OnGetImage, Auth.Bearer)
          ApiBase.get('/file/name', OnGetFileName, Auth.Bearer)
          ApiBase.get('/subscribe', OnSubscribe, Auth.Bearer)
          ApiBase.get('/send/opt', OnSendOTP, Auth.Bearer)

          this.start()
     }

     // program
     public static async start() {}

     public static async TerminateService() {
          console.log('Service terminate ...')
          ApiBase.terminate()
          await MySqlService.terminate()
     }
}
