'use client'

import { useState } from 'react'

export function UploadForm() {
  const [file, setFile] = useState<File>()
  const [to, setTo] = useState('')
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) return
    try {
      const formData = new FormData()
      formData.set('file', file)
      formData.set('to', to)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error(await res.text())
    } catch (error) {
      console.error(error)
    }
  }
  return (
    <form onSubmit={onSubmit}>
      <input
        type="file"
        name="file"
        onChange={(e) => setFile(e.target.files?.[0])}
      />
      <div>
        <label>To</label>
        <input type="text" name="to" onChange={(e) => setTo(e.target.value)} />
      </div>
      <input type="submit" value="upload" />
    </form>
  )
}
