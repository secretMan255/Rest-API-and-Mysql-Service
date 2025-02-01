import { MySqlService } from '../mySql/index'

export class CronService {
     public static async process(): Promise<void> {
          return new Promise((resolve) => {
               this.clearExpiryOTP()
               resolve()
          })
     }

     private static async clearExpiryOTP() {
          await MySqlService.clearExpiryOTP()
          console.log('Clear expiry otp')
          await MySqlService.deleteCheckoutList()
          console.log('Clear pending checkout')
     }
}
