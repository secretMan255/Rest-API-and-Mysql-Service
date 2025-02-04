import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import { hashing, validateHash, generateOTP, recaptchaCheck, STATUS, CartRequestType, CheckoutPendingType } from '../commond/commond'
import { Mail } from '../mail/mail'

type ProductList = {
     children: any[]
     id: number
     name: string
     p_id: number
     status: number
}

type GetProductList = {
     status: number
}

type Subscribe = {
     email: string
}

type SendOTP = {
     email: string
     recaptchaToken: string
}

type UserValidate = {
     id: number
     google_id: string
     user: string
     password: string
     phone: string
     email: string
     address: string
     city: string
     postCode: string
     country: string
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

type EmailOTP = {
     email: string
     recaptchaToken: string
}

type CreateAccount = {
     email: string
     name: string
     password: string
     phone: string
     address: string
     postCode: number
     city: string
     country: string
     otp: string
     recaptchaToken: string
}

type EditAccount = {
     id: number
     email: string
     name: string
     password: string
     phone: string
     address: string
     postCode: number
     city: string
     country: string
     recaptchaToken: string
}

type CartManage = {
     userId: number
     itemId: number
     recaptchaToken: string
}

type PendingCheckout = {
     itemId: number
     name: string
     qty: number
     amt: number
     stockRemain: number
     totalAmt: number
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
               this.Instance = await mysql.createConnection({ uri: this.MysqlURL, multipleStatements: true })
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

     public static async getMainProductList() {
          return await this.exec('sp_get_main_product', [])
     }

     public static async getItemList() {
          return await this.exec('sp_get_item')
     }

     public static async getImage(p_id: number) {
          return await this.exec('sp_get_product_img', [p_id])
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

          if (result?.noTExists) {
               return { error: 'User does not exists.' }
          }

          if (data.sub && !(await validateHash(data.sub, result?.google_id || ''))) {
               return { error: 'Invalid email or password.' }
          }

          if (data.password && !(await validateHash(data.password, result.password || ''))) {
               return { error: 'Invalid email or passowrd.' }
          }

          await this.exec('sp_update_user_last_login', [result.id])

          return { id: result.id, email: result.email, name: result.user, phone: result.phone, address: result.address, postCode: result.postCode, city: result.city, country: result.country }
     }

     public static async resetPasswordOtp(data: SendOTP) {
          const res: number = await recaptchaCheck(this.RecaptchaSecret, data.recaptchaToken)

          if (res === STATUS.FAILED) {
               return { ErrorMsg: 'Invalid OTP' }
          }

          const otp: string = generateOTP()
          const checkUserExists = await this.exec('sp_check_user_exists', [data.email, otp])

          if (checkUserExists) {
               return checkUserExists
          }

          const html: string = `
               <div>
               <p>Hello! This is from the Support Team.</p>

               <p>This is the One-Time Password (OTP) for resetting your password:</p>

               <p><strong>${otp}</strong></p>

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

     public static async emailOTP(data: EmailOTP) {
          const recaptcha: number = await recaptchaCheck(this.RecaptchaSecret, data.recaptchaToken)

          if (recaptcha === STATUS.FAILED) {
               return { error: 'Invalid OTP' }
          }

          const otp: string = generateOTP()
          const saveEmailOtp = await this.exec('sp_save_email_otp', [data.email, otp])

          if (saveEmailOtp) {
               return saveEmailOtp
          }

          const html: string = `
               <div>
               <p>Hello! This is from the Support Team.</p>

               <p>This is the One-Time Password (OTP) for creating your account:</p>

               <p><strong>${otp}</strong></p>

               <p>This OTP will expire in 5 minutes. If you did not request this, please ignore this email.</p>

               <p>Best regards,<br>
                    The Support Team</p>
               </div>
          `

          return await Mail.sendMail(data.email, 'Create Account', html)
     }

     public static async createAccount(data: CreateAccount) {
          const recaptcha: number = await recaptchaCheck(this.RecaptchaSecret, data.recaptchaToken)

          if (recaptcha === STATUS.FAILED) {
               return { errorMsg: 'Invalid OTP' }
          }

          data.password = await hashing(data.password)

          const res = await this.exec('sp_create_account', [data.email, data.name, data.password, data.phone, data.address, data.postCode, data.city, data.country, data.otp])

          if (res) {
               return res
          }

          return
     }

     public static async getState(status: number) {
          return await this.exec('sp_get_state', [status])
     }

     public static async clearExpiryOTP() {
          return await this.exec('sp_clear_expiry_otp', [])
     }

     public static async editAccount(data: EditAccount, decodedJwt: any) {
          if (data.id !== decodedJwt.id) {
               return { errorMsg: 'Edit information failed, please check the edit information' }
          }

          const recaptcha: number = await recaptchaCheck(this.RecaptchaSecret, data.recaptchaToken)

          if (recaptcha === STATUS.FAILED) {
               return { errorMsg: 'Edit information failed, please check the edit information' }
          }

          const res = await this.exec('sp_edit_account', [data.email, data.name, data.password ? await hashing(data.password) : '', data.phone, data.address, data.postCode, data.city, data.country])

          if (res) {
               return res
          }

          return
     }

     public static async getCart(data: CartRequestType) {
          if (data.tokenId === data.userId) {
               return await this.exec('sp_get_cart', [data.userId])
          }

          return { name: '', qty: '' }
     }

     public static async addCartItem(data: CartManage, decodedJwt: any) {
          if (data.userId !== decodedJwt.id) {
               return
          }

          const recaptcha: number = await recaptchaCheck(this.RecaptchaSecret, data.recaptchaToken)

          if (recaptcha === STATUS.FAILED) {
               return { errorMsg: 'Failed to add item to cart' }
          }

          const res = await this.exec('sp_add_item_cart_qty', [data.userId, data.itemId])

          return res
     }

     public static async minusCartItem(data: CartManage, decodedJwt: any) {
          if (data.userId !== decodedJwt.id) {
               return
          }

          const recaptcha: number = await recaptchaCheck(this.RecaptchaSecret, data.recaptchaToken)

          if (recaptcha === STATUS.FAILED) {
               return { errorMsg: 'Failed to remove item to cart' }
          }

          const res = await this.exec('sp_minus_item_cart_qty', [data.userId, data.itemId])

          return res
     }

     public static async removeCartItem(data: CartManage, decodedJwt: any) {
          if (data.userId !== decodedJwt.id) {
               return
          }

          const recaptcha: number = await recaptchaCheck(this.RecaptchaSecret, data.recaptchaToken)

          if (recaptcha === STATUS.FAILED) {
               return { errorMsg: 'Failed to remove item to cart' }
          }

          const res = await this.exec('sp_remove_item_cart', [data.userId, data.itemId])

          return res
     }

     public static async checkoutPending(data: CheckoutPendingType, decodedJwt: any) {
          if (data.userId !== decodedJwt.id) {
               return { errorMsg: 'Please checkout later' }
          }

          const recaptcha: number = await recaptchaCheck(this.RecaptchaSecret, data.recaptchaToken)

          if (recaptcha === STATUS.FAILED) {
               return { errorMsg: 'Please checkout later' }
          }

          const checkUserInfo = await this.exec('sp_get_user_infor', [data.userId])

          const nullFields = Object.entries(checkUserInfo)
               .filter(([key, value]) => value === null)
               .map(([key]) => key)

          if (nullFields) {
               return { status: false, nullFields: nullFields }
          }

          const items = await this.exec('sp_get_cart', [data.userId])
          const checkoutPendingItems: PendingCheckout[] = []
          const outOfStockItems = []
          const shippingFee = []

          // check which item is out of stock
          for (let item of items) {
               if (item.in_stock) {
                    checkoutPendingItems.push({
                         itemId: item.id,
                         name: item.name,
                         qty: item.qty,
                         amt: item.price,
                         stockRemain: item.stock_remain,
                         totalAmt: item.price * item.qty,
                    })
               } else {
                    outOfStockItems.push({
                         itemId: item.id,
                         name: item.name,
                         qty: item.qty,
                         amt: item.price,
                         stockRemain: item.stock_remain,
                    })
               }
          }

          // return if item are out of stock
          if (outOfStockItems.length > 0) {
               await this.exec('sp_delete_pending_checkout', [data.userId])
               return { status: false, msg: 'Some items are out of stock', items: outOfStockItems }
          }

          // insert items into pending table
          for (let item of checkoutPendingItems) {
               const res = await this.exec('sp_insert_pending_checkout', [data.userId, item.itemId, item.qty, item.totalAmt])

               // check if other user are faster to insert
               if (res?.outOfStock) {
                    outOfStockItems.push({
                         itemId: item.itemId,
                         name: item.name,
                         qty: item.qty,
                         stockRemain: item.stockRemain,
                    })
               }

               shippingFee.push(res)
          }

          // delete pending checkout and return if item are out of stock
          if (outOfStockItems.length > 0) {
               // prevent check recaptcha again
               await this.exec('sp_delete_pending_checkout', [data.userId])
               return { status: false, msg: 'Some items are out of stock', items: outOfStockItems }
          }

          return { status: true, msg: 'Pending payment', items: checkoutPendingItems, fee: shippingFee }
     }

     public static async deleteCheckoutList(data?: CheckoutPendingType, decodedJwt?: any) {
          if (data.userId) {
               const recaptcha: number = await recaptchaCheck(this.RecaptchaSecret, data.recaptchaToken)

               if (data.userId != decodedJwt.id || recaptcha === STATUS.FAILED) {
                    return { errorMsg: 'Please checkout later' }
               }

               return await this.exec('sp_delete_pending_checkout', [data.userId])
          }

          return await this.exec('sp_delete_pending_checkout', [])
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
