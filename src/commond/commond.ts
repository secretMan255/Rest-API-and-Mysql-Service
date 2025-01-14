import path from 'path'

type GetFile = {
     path: string
     fileName: string
}

export function getFile(data: GetFile) {
     const a = path.join(__dirname, '../../image/', String(data.path) + '/', String(data.fileName))
     return a
}

export function handlerApiError(err: any) {
     console.log('handler: ', err)
     return { ret: -1, data: err }
}

export function handlerApiSuccess(msg: any) {
     return { ret: 0, data: msg }
}
