import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'
import { Buffer } from 'buffer'
import { prisma } from '@/lib/prisma'
import { ConversionStatus } from '@prisma/client'
import { extname } from 'path'
import { v4 as uuid } from 'uuid'

const projectId = process.env.PROJECT_ID
const keyFilename = process.env.KEYFILENAME
const nameBucket = process.env.BUCKET_NAME || 'dev-converter-rajat'
const storage = new Storage({ projectId, keyFilename })

async function uploadFile(
  bucketName: string,
  buffer: Buffer,
  fileOutputName: string
) {
  try {
    const bucket = storage.bucket(bucketName)
    const file = bucket.file(fileOutputName)
    await file.save(buffer)
    return file.publicUrl()
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}

export async function POST(req: NextRequest) {
  // load the file from the request
  const data = await req.formData()
  const file: File | null = data.get('file') as unknown as File
  const to = data.get('to') as string
  const from = extname(file.name).replace('.', '')
  if (!file) {
    return new NextResponse(JSON.stringify({ error: 'No file found' }), {
      status: 400,
    })
  }

  if (!to) {
    return new NextResponse(JSON.stringify({ error: 'No "to found' }), {
      status: 400,
    })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // upload the file to bucket
  const key = `${uuid()}.${from}`
  await uploadFile(nameBucket, buffer, key)
  const conversion = await prisma.conversion.create({
    data: {
      fileLocation: `gs://${nameBucket}/${key}`,
      from,
      to,
      current: from,
      status: ConversionStatus.PENDING,
    },
  })
  // save the metadata to postgres

  // return a UUID

  return NextResponse.json({ id: conversion.id })
}
