import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

export class Mail {
     public static transport
     private static emailUser: string

     public static async init() {
          dotenv.config()
          this.emailUser = process.env.emailUser

          try {
               this.transport = await nodemailer.createTransport({
                    service: process.env.emailService,
                    host: process.env.emailHost, // 'smtp.gmail.com',
                    port: Number(process.env.emailPort), // 465,
                    secure: true,
                    auth: {
                         user: this.emailUser,
                         pass: process.env.emailPass,
                    },
               })
          } catch (err) {
               throw new Error(`Mail service initial failed ${err}`)
          }
     }

     public static async sendMail(to: string, subject: string, text: string) {
          await this.transport.sendMail({
               from: this.emailUser,
               to: to,
               subject: subject,
               html: text,
          })
     }
}
