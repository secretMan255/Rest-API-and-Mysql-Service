import { OnGetItemList, OnGetImage, OnGetProductList } from './base.api/item.rest.api'
import { ApiBase, Auth } from './base.api/ApiBase'
import { MysqlService } from './mySql/mySqlServer'

export class service {
     public static async init() {
          // Initialize the application
          ApiBase.init()
          await MysqlService.init()

          ApiBase.get('/products', OnGetProductList, Auth.Bearer)
          ApiBase.get('/items', OnGetItemList, Auth.Bearer)
          ApiBase.get('/image', OnGetImage, Auth.Bearer)

          this.start()
     }

     // program
     public static async start() {}

     public static async TerminateService() {
          console.log('Service terminate ...')
          ApiBase.terminate()
          await MysqlService.terminate()
     }
}
