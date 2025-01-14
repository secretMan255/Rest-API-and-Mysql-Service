import { Storage } from '@google-cloud/storage'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

type UploadImage = {
     bucket: string
     imageName: string
     imageBase64: string
}

type FilesName = {
     bucket: string
}

type DeleteFilesName = {
     bucket: string
     fileName: string[]
}

export class GoogleCloudStorage {
     private static GoogleStorage: Storage
     private static Bucket: string

     public static init() {
          dotenv.config()
          this.GoogleStorage = new Storage()
          this.Bucket = process.env.BUCKET
          console.log('GoogleCloudStorage initialized successfully')
     }

     private static checkInit(): void {
          if (!this.GoogleStorage || !this.Bucket) {
               throw new Error('GoogleCloudStorage is not initialized.')
          }
     }

     public static async uploadImage(data: UploadImage) {
          this.checkInit()

          const temFilePath: string = path.join(__dirname, data.imageName)
          fs.writeFileSync(temFilePath, Buffer.from(data.imageBase64, 'base64'))

          await this.GoogleStorage.bucket(data.bucket).upload(temFilePath, {
               destination: data.imageName,
               public: true,
          })

          fs.unlinkSync(temFilePath)
          console.log(`Image uploaded: ${data.imageName}`)
          return {}
     }

     public static async getFileName(data: FilesName) {
          this.checkInit()
          const [files] = await this.GoogleStorage.bucket(data.bucket).getFiles()
          const fileNames = files.map((file) => file.name)

          return fileNames
     }

     public static async deleteFiles(data: DeleteFilesName) {
          this.checkInit()
          for (const fileName of data.fileName) {
               await this.GoogleStorage.bucket(data.bucket).file(fileName).delete()
          }

          return
     }
}
