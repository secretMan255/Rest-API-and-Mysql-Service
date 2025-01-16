import { GoogleCloudStorage } from '../GoogleCloud/index'
import { JoinValidator, UploadImageRequest, GetFilesNameRequest, DelteFilesRequest } from '../JoiValidator/JoiValidator'
import { Request, Response } from 'express'

export async function OnUploadImage(req: Request, res: Response): Promise<any> {
     return await JoinValidator(req.body, async (data) => GoogleCloudStorage.uploadImage(data), UploadImageRequest)
}

export async function OnGetFileName(req: Request, res: Response): Promise<any> {
     return await JoinValidator(req.query, async (data) => GoogleCloudStorage.getFileName(data), GetFilesNameRequest)
}

export async function OnDeleteFile(req: Request, res: Response): Promise<any> {
     return await JoinValidator(req.body, async (data) => GoogleCloudStorage.deleteFiles(data), DelteFilesRequest)
}
