import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import jwt, { JwtPayload } from 'jsonwebtoken'
import dotenv from 'dotenv'
import { inspect } from 'util'

export enum Auth {
     Bearer = 'Bearer',
     None = 'None',
}

export enum ResultType {
     NORMAL = 'NORMAL',
     IMAGE = 'IMAGE',
}

export class ApiBase {
     private static app: Express
     private static secretKey: string
     private static server: any

     public static init(host?: string, port?: number) {
          if (!this.app) {
               this.app = express()
               this.app.use(express.json())
               this.app.use(this.errorHandler)
               this.app.use(cors())
          }

          dotenv.config()
          this.secretKey = process.env.SECRET_KEY || 'defaultSecretKey'
          const resolveHost = host || 'localhost'
          const resolvePort = port || 8000

          this.server = this.app.listen(resolvePort, resolveHost, () => {
               console.log(`Server is running at http://${resolveHost}:${resolvePort}`)
          })
     }

     public static get(endPoint: string, handler: (req: Request, res: Response) => Promise<any> | any, authType: Auth): void {
          if (!this.app) {
               throw new Error('API service is not initialized...')
          }

          this.app.get(endPoint, this.getAuthMiddleWare(authType), async (req: Request, res: Response) => {
               try {
                    console.log(
                         `Request: \n { Headers :${inspect(req.headers, { depth: null, colors: true })} \n Query: ${inspect(req.query, { depth: null, colors: true })} \n Body: ${inspect(req.body, {
                              depth: null,
                              colors: true,
                         })} \nParams: ${inspect(req.params, { depth: null, colors: true })} }`
                    )
                    const result = await handler(req, res)
                    console.log(`Result: ${inspect(result, { depth: null, colors: true })}`)

                    if (result?.type && result?.type === ResultType.IMAGE) {
                         res.set('Content-Type', 'image/jpeg')
                         res.sendFile(result.image, (err) => {
                              if (err) {
                                   console.error('Error sending file:', err)
                                   res.status(500).json({ ret: -1, msg: 'Error sending file' })
                              }
                         })
                    } else {
                         res.status(200).json({ ret: 0, data: result })
                    }
               } catch (err) {
                    console.error(`API get error: ${err}`)
                    res.status(500).json({ ret: -1, msg: err instanceof Error ? err.message : 'Internal Server Error' })
               }
          })
     }

     public static post(endPoint: string, handler: (req: Request, res: Response) => Promise<any> | any, authType: Auth): void {
          if (!this.app) {
               throw new Error('API service is not initialized...')
          }

          this.app.post(endPoint, this.getAuthMiddleWare(authType), async (req: Request, res: Response) => {
               try {
                    console.log(
                         `Request: \n { Headers :${inspect(req.headers, { depth: null, colors: true })} \n Query: ${inspect(req.query, { depth: null, colors: true })} \n Body: ${inspect(req.body, {
                              depth: null,
                              colors: true,
                         })} \nParams: ${inspect(req.params, { depth: null, colors: true })} }`
                    )
                    const result = await handler(req, res)
                    console.log(`Result: ${inspect(result, { depth: null, colors: true })}`)
                    res.status(200).json({ ret: 0, data: result })
               } catch (err) {
                    console.error(`API get error: ${err}`)
                    res.status(500).json({ ret: -1, msg: err instanceof Error ? err.message : 'Internal Server Error' })
               }
          })
     }

     private static getAuthMiddleWare(authType: Auth): (req: Request, res: Response, next: NextFunction) => void | null {
          switch (authType) {
               case Auth.Bearer:
                    return (req, res, next) => this.AutheticationToken(req, res, next)
               case Auth.None:
                    return null
               default:
                    throw new Error(`Unsupported authentication type: ${authType}`)
          }
     }

     public static AutheticationToken(req: Request, res: Response, next: NextFunction): void {
          const authHeader: string | undefined = req.headers.authorization

          if (authHeader && authHeader.startsWith('Bearer ')) {
               const token: string = authHeader.split(' ')[1]

               jwt.verify(token, this.secretKey, (err, decoded) => {
                    if (err) {
                         res.status(401).json({ ret: -1, msg: 'Invalid token' })
                    } else {
                         const payload = decoded as JwtPayload

                         if (!payload.userId) {
                              res.status(401).json({ ret: -1, msg: 'userId is required' })
                         } else if (payload.userId === String) {
                              res.status(401).json({ ret: -1, msg: 'userId must be a number' })
                         } else {
                              req.body.user = payload
                              next()
                         }
                    }
               })
          } else {
               res.status(401).json({ ret: -1, msg: 'Bearer token required' })
          }
     }

     private static errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
          console.error(err.stack)
          res.status(500).json({ ret: -1, msg: `Internal server error, ${err.message}` })
     }

     public static terminate() {
          if (this.server) {
               this.server.close(() => {
                    console.log('API server have been shutdown ...')
               })
          } else {
               console.warn('API server is not running or already terminated ...')
          }
     }
}
