import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

type productList = {
     children: any[]
     id: number
     name: string
     p_id: number
     status: number
}

type itemLis = {
     id: number
     name: string
     price: number
     describe: string
     p_id: number
}

type getProductList = {
     status: number
}

export class MysqlService {
     private static Instance: mysql.Connection
     private static MysqlURL: string

     public static async init() {
          dotenv.config()
          this.MysqlURL = process.env.DATABASE_URL || ''

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

          try {
               const query = data?.length ? `CALL ${sp}(?)` : `CALL ${sp}()`
               const [rows] = await this.Instance.execute(query, data)
               return rows[0]
          } catch (err) {
               console.log('Error executing store procedure: ', err)
               throw err
          }
     }

     public static async getPorductList(data: getProductList) {
          const result: productList[] = await this.exec('sp_get_product_list', [data.status])

          const productMap: Record<number, productList> = {}
          result.forEach((product) => {
               product.children = []
               productMap[product.id] = product
          })

          const prodcuts: productList[] = []
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
          const result: itemLis = await this.exec('sp_get_item')

          return result
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
