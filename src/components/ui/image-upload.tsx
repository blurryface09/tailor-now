'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'

interface ImageUploadProps {
  bucket: string
  folder: string
  value: string[]
  onChange: (urls: string[]) => void
  maxFiles?: number
  label?: string
  hint?: string
}

export function ImageUpload({ bucket, folder, value, onChange, maxFiles = 5, label, hint }: ImageUploadProps) {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)

  const uploadFile = async (file: File) => {
    if (value.length >= maxFiles) { toast.error(`Max ${maxFiles} images allowed`); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return }
    setUploading(true)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type })
    if (error) { toast.error(error.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
    onChange([...value, publicUrl])
    setUploading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ''
  }

  const remove = (url: string) => onChange(value.filter(u => u !== url))

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-3 items-start">
        {value.map((url, i) => (
          <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border border-white/[0.08] shadow-sm group">
            <img src={url} alt={`Upload ${i + 1}`} className="w-full h-full object-cover"  loading="lazy"/>
            <button
              type="button"
              onClick={() => remove(url)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            >
              <X size={13} />
            </button>
          </div>
        ))}
        {value.length < maxFiles && (
          <label className={`
            w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer
            transition-colors flex-shrink-0
            ${uploading ? 'border-violet-300 bg-violet-50 cursor-not-allowed' : 'border-gray-300 hover:border-violet-400 hover:bg-violet-50/30'}
          `}>
            {uploading ? (
              <div className="flex flex-col items-center gap-1">
                <div className="animate-spin w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full" />
                <span className="text-xs text-violet-500">Uploading…</span>
              </div>
            ) : (
              <>
                <Upload size={18} className="text-zinc-600 mb-1" />
                <span className="text-xs text-zinc-600 text-center leading-tight px-1">Add photo</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleChange}
              disabled={uploading}
            />
          </label>
        )}
        {value.length === 0 && !uploading && (
          <div className="flex items-center gap-2 self-center ml-1">
            <ImageIcon size={14} className="text-zinc-600" />
            <span className="text-xs text-zinc-600">No photos yet</span>
          </div>
        )}
      </div>
      {hint && <p className="text-xs text-zinc-600 mt-1.5">{hint}</p>}
      {maxFiles > 1 && value.length > 0 && (
        <p className="text-xs text-zinc-600 mt-1">{value.length}/{maxFiles} photos added</p>
      )}
    </div>
  )
}
