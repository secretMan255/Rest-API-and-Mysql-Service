import path from 'path'

type GetImage = {
     path: string
     fileName: string
}

export function getImage(data: GetImage) {
     const a = path.join(__dirname, '../../image/', String(data.path) + '/', String(data.fileName))
     console.log('path: ', a)
     return a
}
