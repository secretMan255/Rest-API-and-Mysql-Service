import Joi from 'joi'

export async function JoinValidator(data: any, method: (data: any) => Promise<any>, joiValidator: any): Promise<any> {
     const { error } = joiValidator.validate(data)

     if (error) {
          throw new Error(String(error.details.map((detail) => detail.message)))
     }

     return await method(data)
}

export const GetProductListRequest = Joi.object({
     status: Joi.number().required(),
})

export const GetItemListRequest = Joi.object({})

export const GetImageRequest = Joi.object({
     path: Joi.string().required(),
     fileName: Joi.string().required(),
})

export const UploadImageRequest = Joi.object({
     bucket: Joi.string().required(),
     imageName: Joi.string().required(),
     imageBase64: Joi.binary().required(),
})

export const GetFilesNameRequest = Joi.object({
     bucket: Joi.string().required(),
})

export const DelteFilesRequest = Joi.object({
     bucket: Joi.string().required(),
     fileName: Joi.array().required(),
})

export const SubscribeResquest = Joi.object({
     email: Joi.string().required(),
})
