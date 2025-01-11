import { Request, Response } from 'express'
import { MysqlService } from '../mySql/mySqlServer'
import { JoinValidator, getImageRequest, getItemListRequest, getProductListRequest } from '../JoiValidator/JoiValidator'
import { getImage } from '../commond/commond'
import { ResultType } from './ApiBase'

export async function OnGetProductList(req: Request, res: Response): Promise<any> {
     return await JoinValidator(req.query, async (data) => MysqlService.getPorductList(data), getProductListRequest)
}

export async function OnGetItemList(req: Request, res: Response): Promise<any> {
     return await JoinValidator(req.query, async (data) => MysqlService.getItemList(), getItemListRequest)
}

export async function OnGetImage(req: Request, res: Response): Promise<any> {
     return { type: ResultType.IMAGE, image: await JoinValidator(req.query, async (data) => getImage(data), getImageRequest) }
}
