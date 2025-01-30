import { Request, Response } from 'express'
import { MySqlService } from '../mySql/index'
import {
     JoinValidator,
     GetImageRequest,
     GetItemListRequest,
     GetProductListRequest,
     SubscribeResquest,
     UserLoginRequest,
     ResetPasswordOTPRequest,
     UpdatePasswordRequest,
     VerifyEmailRequest,
     CreateAccountRequest,
     StateRequest,
     EditAccountRequest,
     GetCartRequest,
     CartItemRequest,
     GetMainProductRequest,
} from '../JoiValidator/JoiValidator'
import { getFile, CartRequestType } from '../commond/commond'
import { ResultType } from './index'
import { ApiBase } from './index'
import jwt, { JwtPayload } from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()

export async function OnTest(req: Request, res: Response): Promise<any> {
     return 'GOOD'
}

export async function OnGetProductList(req: Request, res: Response): Promise<any> {
     return await JoinValidator(req.query, async (data) => MySqlService.getPorductList(data), GetProductListRequest)
}

export async function OnGetMainProductList(req: Request, res: Response): Promise<any> {
     return await JoinValidator(req.query, async (data) => MySqlService.getMainProductList(), GetMainProductRequest)
}

export async function OnGetItemList(req: Request, res: Response): Promise<any> {
     return await JoinValidator(req.query, async (data) => MySqlService.getItemList(), GetItemListRequest)
}

export async function OnGetImage(req: Request, res: Response): Promise<any> {
     return { type: ResultType.IMAGE, image: await JoinValidator(req.query, async (data) => getFile(data), GetImageRequest) }
}

export async function OnSubscribe(req: Request, res: Response): Promise<any> {
     return await JoinValidator(req.query, async (data) => MySqlService.subscribe(data), SubscribeResquest)
}

export async function OnUserLogin(req: Request, res: Response): Promise<any> {
     const userData = await JoinValidator(req.body, async (data) => MySqlService.userLogin(data), UserLoginRequest)

     if (!userData || userData?.err) {
          return userData
     }

     const token = ApiBase.generateToken({ id: userData.id, role: 'customer', email: userData.email, name: userData.name })

     res.cookie('authToken', token, {
          httpOnly: true,
          secure: false, // process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000,
     })
     userData.token = token

     return userData
}

export async function OnResetPassowrdOTP(req: Request, res: Response): Promise<any> {
     return await JoinValidator(req.body, async (data) => MySqlService.resetPasswordOtp(data), ResetPasswordOTPRequest)
}

export async function OnUpdatePassword(req: Request, res: Response): Promise<any> {
     return await JoinValidator(req.body, async (data) => MySqlService.updatePassword(data), UpdatePasswordRequest)
}

export async function OnEmailOTP(req: Request, res: Response): Promise<any> {
     return await JoinValidator(req.body, async (data) => MySqlService.emailOTP(data), VerifyEmailRequest)
}

export async function OnCreateAccount(req: Request, res: Response): Promise<any> {
     return await JoinValidator(req.body, async (data) => MySqlService.createAccount(data), CreateAccountRequest)
}

export async function OnGetState(req: Request, res: Response): Promise<any> {
     return await JoinValidator(req.query, async (data) => MySqlService.getState(data.status), StateRequest)
}

export async function OnEditAccount(req: Request, res: Response): Promise<any> {
     const decodedJwt = jwt.verify(req.cookies?.authToken, process.env.SECRET_KEY) as JwtPayload
     return await JoinValidator(req.body, async (data) => MySqlService.editAccount(data, decodedJwt), EditAccountRequest)
}

export async function OnGetCart(req: Request, res: Response): Promise<any> {
     const decodedJwt = jwt.verify(req.cookies?.authToken, process.env.SECRET_KEY) as JwtPayload
     const cartPayload: CartRequestType = {
          userId: String(req.query.id),
          tokenId: String(decodedJwt.id),
     }
     return await JoinValidator(cartPayload, async (data) => MySqlService.getCart(data), GetCartRequest)
}

export async function OnAddItemCart(req: Request, res: Response): Promise<any> {
     const decodedJwt = jwt.verify(req.cookies?.authToken, process.env.SECRET_KEY) as JwtPayload
     return await JoinValidator(req.body, async (data) => MySqlService.addCartItem(data, decodedJwt), CartItemRequest)
}

export async function OnMinusItemCart(req: Request, res: Response): Promise<any> {
     const decodedJwt = jwt.verify(req.cookies?.authToken, process.env.SECRET_KEY) as JwtPayload
     return await JoinValidator(req.body, async (data) => MySqlService.minusCartItem(data, decodedJwt), CartItemRequest)
}

export async function OnRemoveItemCart(req: Request, res: Response): Promise<any> {
     const decodedJwt = jwt.verify(req.cookies?.authToken, process.env.SECRET_KEY) as JwtPayload
     return await JoinValidator(req.body, async (data) => MySqlService.removeCartItem(data, decodedJwt), CartItemRequest)
}
