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
} from '../JoiValidator/JoiValidator'
import { getFile } from '../commond/commond'
import { ResultType } from './index'

export async function OnTest(req: Request, res: Response): Promise<any> {
     return 'GOOD'
}

export async function OnGetProductList(req: Request, res: Response): Promise<any> {
     return await JoinValidator(req.query, async (data) => MySqlService.getPorductList(data), GetProductListRequest)
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
     return await JoinValidator(req.body, async (data) => MySqlService.userLogin(data), UserLoginRequest)
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
