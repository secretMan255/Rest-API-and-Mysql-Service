import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import jwt, { JwtPayload } from 'jsonwebtoken'
import dotenv from 'dotenv'
import { inspect } from 'util'
import cookieParser from 'cookie-parser'

export enum Auth {
     Bearer = 'Bearer',
     Cookie = 'Cookie',
     None = 'None',
}

export enum ResultType {
     NORMAL = 'NORMAL',
     IMAGE = 'IMAGE',
}

export enum Res {
     SUCCESS = 0,
     FAIL = -1,
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
               this.app.use(cookieParser())
               this.app.use(cors({ origin: 'http://localhost:3000', credentials: true, allowedHeaders: ['Content-Type', 'Authorization'], methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }))
          }

          dotenv.config()
          this.secretKey = process.env.SECRET_KEY || 'defaultSecretKey'
          const resolveHost = host || '0.0.0.0'
          const resolvePort = port || 8000

          this.server = this.app.listen(resolvePort, resolveHost, () => {
               console.log(`Server is running at http://${resolveHost}:${resolvePort}`)
          })
     }

     public static generateToken(payload: object, expiresIn: string = String(process.env.EXPIRES_IN)): string {
          if (!this.secretKey) {
               throw new Error('Secret key is not defined')
          }

          return jwt.sign(payload, this.secretKey, { expiresIn })
     }

     public static get(endPoint: string, handler: (req: Request, res: Response) => Promise<any> | any, allowedRoles: string[], authType: Auth): void {
          if (!this.app) {
               throw new Error('API service is not initialized...')
          }

          this.app.get(endPoint, this.getAuthMiddleWare(authType), this.roleAuthentication(allowedRoles), async (req: Request, res: Response) => {
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

     public static post(endPoint: string, handler: (req: Request, res: Response) => Promise<any> | any, allowedRoles: string[], authType: Auth): void {
          if (!this.app) {
               throw new Error('API service is not initialized...')
          }

          this.app.post(endPoint, this.getAuthMiddleWare(authType), this.roleAuthentication(allowedRoles), async (req: Request, res: Response) => {
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
                    console.error(`API post error: ${err}`)
                    res.status(400).json({ ret: -1, msg: err instanceof Error ? err.message : 'Internal Server Error' })
               }
          })
     }

     private static getAuthMiddleWare(authType: Auth): (req: Request, res: Response, next: NextFunction) => void | null {
          switch (authType) {
               case Auth.Bearer:
                    return (req, res, next) => this.AutheticationToken(req, res, next)
               case Auth.None:
                    return (req, res, next) => this.NoAuthetication(req, res, next)
               case Auth.Cookie:
                    return (req, res, next) => this.CookieAuthetication(req, res, next)
               default:
                    throw new Error(`Unsupported authentication type: ${authType}`)
          }
     }

     private static NoAuthetication(req: Request, res: Response, next: NextFunction): void {
          next()
     }

     private static AutheticationToken(req: Request, res: Response, next: NextFunction): void {
          const authHeader: string | undefined = req.headers.authorization

          if (authHeader && authHeader.startsWith('Bearer ')) {
               const token: string = authHeader.split(' ')[1]

               jwt.verify(token, this.secretKey, (err, decoded) => {
                    if (err) {
                         res.status(401).json({ ret: -1, msg: 'Invalid token' })
                    } else {
                         const payload = decoded as JwtPayload

                         if (!payload.role) {
                              res.status(401).json({ ret: -1, msg: 'role is required' })
                         } else {
                              req['authUser'] = payload
                              next()
                         }
                    }
               })
          } else {
               res.status(401).json({ ret: -1, msg: 'Bearer token required' })
          }
     }

     private static CookieAuthetication(req: Request, res: Response, next: NextFunction): void {
          const token: string | undefined = req.cookies?.authToken

          if (!token) {
               res.status(401).json({ ret: -1, msg: 'Cookie token required' })
          } else {
               jwt.verify(token, this.secretKey, (err, decoded) => {
                    if (err) {
                         res.status(401).json({ ret: -1, msg: 'Invalid token' })
                    } else {
                         const payload = decoded as JwtPayload
                         if (!payload.role) {
                              res.status(401).json({ ret: -1, msg: 'user is required' })
                         } else if (!payload.id) {
                              res.status(401).json({ ret: -1, mag: 'id is required' })
                         } else if (!payload.email) {
                              res.status(401).json({ ret: -1, msg: 'email is required' })
                         } else if (!payload.name) {
                              res.status(401).json({ ret: -1, msg: 'name is required' })
                         } else {
                              req['authUser'] = payload
                              next()
                         }
                    }
               })
          }
     }

     private static errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
          res.status(500).json({ ret: -1, msg: `Internal server error, ${err.message}` })
     }

     private static roleAuthentication(allowedRoles: string[]) {
          return (req: Request, res: Response, next: NextFunction): void => {
               const authUser = req['authUser']

               if (!authUser || !authUser.role) {
                    res.status(403).json({ ret: -1, msg: 'Access Denied: No role assigned' })
                    return
               }

               if (!allowedRoles.includes(authUser.role)) {
                    res.status(403).json({ ret: -1, msg: 'Access Denied: Insufficient permissions' })
                    return
               }

               next()
          }
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
