import Joi from 'joi'

export async function JoinValidator(data: any, method: (data: any) => Promise<any>, joiValidator: any): Promise<any> {
     const { error } = joiValidator.validate(data)

     if (error) {
          throw new Error(String(error.details.map((detail) => detail.message)))
     }

     return await method(data)
}

export const getProductListRequest = Joi.object({
     status: Joi.number().required(),
})

export const getItemListRequest = Joi.object({})

export const getImageRequest = Joi.object({
     path: Joi.string().required(),
     fileName: Joi.string().required(),
})
