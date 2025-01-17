import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import { hashing, validateHash, generateOTP, recaptchaCheck, STATUS } from '../commond/commond'
import { Mail } from '../mail/mail'

type ProductList = {
     children: any[]
     id: number
     name: string
     p_id: number
     status: number
}

type ItemList = {
     id: number
     name: string
     price: number
     describe: string
     p_id: number
}

type GetProductList = {
     status: number
}

type Subscribe = {
     email: string
}

type SubscribeRes = {
     ret: number
     msg: string
}

type SendOTP = {
     email: string
     recaptchaToken: string
}

type RecaptchaResponse = {
     success: boolean
     score: number
     action?: string
     challenge_ts?: string
     hostname?: string
     'error-codes'?: string[]
}

type UserValidate = {
     id: number
     google_id: string
     user: string
     password: string
     email: string
     address: string
     noTExists: string
}

type UserLogin = {
     email: string
     name: string
     sub: string
     password: string
     address: string
     recaptchaToken: string
}

type UpdatePassword = {
     email: string
     password: string
     otp: string
     recaptchaToken: string
}

export class MySqlService {
     private static Instance: mysql.Connection
     private static MysqlURL: string
     private static RecaptchaSecret: string

     public static async init() {
          dotenv.config()
          this.MysqlURL = process.env.DATABASE_URL || ''
          this.RecaptchaSecret = process.env.recaptchaToken || ''

          try {
               // Create a connection instance
               this.Instance = await mysql.createConnection(this.MysqlURL)
               console.log('Connected to MySQL database!')
          } catch (err) {
               console.error('Error connecting to MySQL:', err)
               throw err
          }
     }

     private static async exec(sp: string, data?: any[]): Promise<any> {
          if (!this.Instance) {
               throw new Error('MySql connection not initializd. Call init first...')
          }

          const query = data?.length ? `CALL ${sp}(${data.map(() => '?').join(',')})` : `CALL ${sp}()`
          const [rows] = await this.Instance.execute(query, data || [])
          return rows[0]
     }

     public static async getPorductList(data: GetProductList) {
          const result: ProductList[] = await this.exec('sp_get_product_list', [data.status])

          const productMap: Record<number, ProductList> = {}
          result.forEach((product) => {
               product.children = []
               productMap[product.id] = product
          })

          const prodcuts: ProductList[] = []
          result.forEach((product) => {
               if (product.p_id === null) {
                    prodcuts.push(product)
               } else {
                    const parent = productMap[product.p_id]
                    if (parent) {
                         parent.children.push(product)
                    }
               }
          })

          return prodcuts
     }

     public static async getItemList() {
          return await this.exec('sp_get_item')
     }

     public static async subscribe(data: Subscribe) {
          await this.exec('sp_insert_subscribe', [data.email])

          return 'Inserted'
     }

     public static async userLogin(data: UserLogin) {
          const res: number = await recaptchaCheck(this.RecaptchaSecret, data.recaptchaToken)

          if (res === STATUS.FAILED) {
               return { error: 'Invalid email or password' }
          }

          const hashedSub = data.sub ? await hashing(data.sub) : ''
          const hashedPass = data.password ? await hashing(data.password) : ''

          const resultArray: UserValidate[] = await this.exec('sp_user_login', [hashedSub, data.name || '', data.email, hashedPass])

          const result: UserValidate = resultArray[0]

          if (result.noTExists) {
               return { error: 'User does not exists.' }
          }

          if (data.sub && !(await validateHash(data.sub, result.google_id || ''))) {
               return { error: 'Invalid email or password.' }
          }

          if (data.password && !(await validateHash(data.password, result.password || ''))) {
               return { error: 'Invalid email or passowrd.' }
          }

          await this.exec('sp_update_user_last_login', [result.id])

          return { id: result.id, email: result.email, name: result.user, address: result.address }
     }

     public static async sendOPT(data: SendOTP) {
          const res: number = await recaptchaCheck(this.RecaptchaSecret, data.recaptchaToken)

          if (res === STATUS.FAILED) {
               return { error: 'Invalid OTP' }
          }

          const opt: string = generateOTP()
          const checkUserExists = await this.exec('sp_check_user_exists', [data.email, opt])

          if (checkUserExists) {
               return checkUserExists
          }
          const html: string = `
               <div>
               <p>Hello! This is from the Support Team.</p>

               <p>This is the One-Time Password (OTP) for resetting your password:</p>

               <p><strong>${opt}</strong></p>

               <p>This OTP will expire in 5 minutes. If you did not request this, please ignore this email.</p>
               
               <p>Best regards,<br>
                    The Support Team</p>
               </div>
          `

          return await Mail.sendMail(data.email, 'Reset Password', html)
     }

     public static async updatePassword(data: UpdatePassword) {
          const res: number = await recaptchaCheck(this.RecaptchaSecret, data.recaptchaToken)

          if (res === STATUS.FAILED) {
               return { error: 'Invalid email or password' }
          }

          const updatePassword = await this.exec('sp_update_password', [data.email, await hashing(data.password), data.otp])

          if (updatePassword) {
               return updatePassword
          }

          return
     }

     public static async terminate() {
          if (this.Instance) {
               this.Instance.destroy()
               console.warn('MySql service terminate ...')
          } else {
               console.error('MySql server is not running or already terminated ...')
          }
     }
}
