import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
type RouteParams = {
  params: {
    id: string
  }
}

const projectId = process.env.PROJECT_ID
const keyFilename = process.env.KEYFILENAME
const nameBucket = process.env.BUCKET_NAME || 'dev-converter-rajat'
import { Storage } from '@google-cloud/storage'
import { ConversionStatus } from '@prisma/client'

const storage = new Storage({ projectId, keyFilename })

async function download(bucketName: string, filePath: string): Promise<Buffer> {
  try {
    const bucket = storage.bucket(bucketName)
    const file = bucket.file(filePath)
    const [contents] = await file.download()
    return contents
  } catch (error) {
    console.error('Error downloading file:', error)
    throw error
  }
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const conversion = await prisma.conversion.findUnique({
    where: { id: params.id },
  })

  if (!conversion) {
    return new NextResponse(JSON.stringify({ error: 'Not found' }), {
      status: 404,
    })
  }

  // check if conversion is done
  if (conversion.status !== ConversionStatus.DONE) {
    return new NextResponse(
      JSON.stringify({ error: 'File hase not finsihed being converted' }),
      {
        status: 400,
      }
    )
  }

  const filePath = conversion.fileLocation.replace(`gs://${nameBucket}/`, '')

  const fileBuffer = await download(nameBucket, filePath)

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': `image/${conversion.to}`,
      'Content-Disposition': `attachment; filename=download.${conversion.to}`,
    },
  })
  // return new NextResponse(
  //   JSON.stringify({ error: 'Failed to download file' }),
  //   {
  //     status: 500,
  //   }
  // )
}
