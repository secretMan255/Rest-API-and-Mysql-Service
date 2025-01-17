import Joi, { string } from 'joi'

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

export const UserLoginRequest = Joi.object({
     email: Joi.string().required(),
     name: Joi.string(),
     sub: Joi.string(),
     password: Joi.string(),
     recaptchaToken: Joi.string().required(),
})

export const ResetPasswordOTPRequest = Joi.object({
     email: Joi.string().required(),
     recaptchaToken: Joi.string().required(),
})

export const UpdatePasswordRequest = Joi.object({
     email: Joi.string().required(),
     password: Joi.string().required(),
     otp: Joi.string().required(),
     recaptchaToken: Joi.string().required(),
})

export const VerifyEmailRequest = Joi.object({
     email: Joi.string().required(),
     recaptchaToken: Joi.string().required(),
})

export const CreateAccountRequest = Joi.object({
     email: Joi.string().required(),
     name: Joi.string().required(),
     password: Joi.string().required(),
     phone: Joi.number().required(),
     address: Joi.string().required(),
     postCode: Joi.number().required(),
     city: Joi.string().required(),
     country: Joi.string().required(),
     otp: Joi.string().required(),
     recaptchaToken: Joi.string().required(),
})

export const StateRequest = Joi.object({
     status: Joi.number().required(),
})
