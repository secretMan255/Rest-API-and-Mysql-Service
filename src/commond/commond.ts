import path from 'path'
import bcrypt from 'bcrypt'

type GetFile = {
     path: string
     fileName: string
}

type RecaptchaResponse = {
     success: boolean
     score: number
     action?: string
     challenge_ts?: string
     hostname?: string
     'error-codes'?: string[]
}

export enum STATUS {
     SUCCESS = 0,
     FAILED = -1,
}

export function getFile(data: GetFile) {
     const filePath: string = path.join(__dirname, '../../image/', String(data.path) + '/', String(data.fileName))
     return filePath
}

export function handlerApiError(err: any) {
     return { ret: -1, data: err }
}

export function handlerApiSuccess(msg: any) {
     return { ret: 0, data: msg }
}

export async function hashing(data: string) {
     return await bcrypt.hash(data, 10)
}

export async function validateHash(plainText: string, hashedText: string) {
     return await bcrypt.compare(plainText, hashedText)
}

export function generateOTP() {
     return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function recaptchaCheck(secret: string, token: string) {
     const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
               secret: secret,
               response: token,
          }),
     })

     const recapRes = (await res.json()) as RecaptchaResponse
     console.log('recapRes: ', recapRes)
     if (!recapRes.success || recapRes.score < 0.5) {
          return STATUS.FAILED
     }

     return STATUS.SUCCESS
}
