import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SHOWROOM_PROMPT = [
  'Transform this tailor portfolio photo into a premium fashion-commerce showroom image, like an Apple product photo meets a luxury fashion lookbook.',
  'Make the garment the hero: clean vertical crop, balanced composition, crisp fabric texture, flattering natural skin tones, premium lighting, soft realistic shadows, and high-end editorial clarity.',
  'Replace distracting backgrounds such as cars, cluttered rooms, streets, harsh flash, bad lighting, or messy walls with a tasteful minimalist showroom, boutique studio, or soft neutral editorial backdrop.',
  'Make the final image feel ready for a polished marketplace feed: sharp, bright, refined, elegant, aspirational, and commercially usable.',
  'Preserve the exact outfit design, fabric, color, pattern, cut, fit, stitching, trims, and visible handmade details.',
  'Do not redesign the clothing, add logos, add text, change the garment, change the wearer identity, alter body shape, or invent fashion details that were not in the original.',
].join(' ')

type PolishRequest = {
  imageUrl?: string
  title?: string
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI photo polish is not configured yet. Add OPENAI_API_KEY in Vercel to enable it.' },
      { status: 501 }
    )
  }

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Please sign in again to polish this photo.' }, { status: 401 })
  }

  let body: PolishRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!body.imageUrl) {
    return NextResponse.json({ error: 'Upload a photo before polishing it.' }, { status: 400 })
  }

  try {
    const imageUrl = new URL(body.imageUrl)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null
    if (!supabaseUrl || imageUrl.hostname !== supabaseUrl.hostname) {
      return NextResponse.json({ error: 'Only uploaded TailorNow portfolio photos can be polished.' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid photo URL.' }, { status: 400 })
  }

  let imageResponse: Response
  try {
    imageResponse = await fetch(body.imageUrl)
  } catch {
    return NextResponse.json({ error: 'Could not read the uploaded photo.' }, { status: 400 })
  }

  if (!imageResponse.ok) {
    return NextResponse.json({ error: 'Could not read the uploaded photo.' }, { status: 400 })
  }

  const contentType = imageResponse.headers.get('content-type') || 'image/png'
  if (!contentType.startsWith('image/')) {
    return NextResponse.json({ error: 'The uploaded file must be an image.' }, { status: 400 })
  }

  const imageBytes = await imageResponse.arrayBuffer()
  if (imageBytes.byteLength > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Photo is too large for AI polish. Use an image under 10MB.' }, { status: 400 })
  }

  const inputBlob = new Blob([imageBytes], { type: contentType })
  const formData = new FormData()
  formData.append('model', 'gpt-image-2')
  formData.append('image[]', inputBlob, `tailornow-${user.id}.png`)
  formData.append('prompt', body.title ? `${SHOWROOM_PROMPT} Portfolio title: ${body.title}.` : SHOWROOM_PROMPT)
  formData.append('size', '1024x1536')
  formData.append('quality', 'medium')
  formData.append('output_format', 'png')

  const openAiResponse = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  })

  const openAiJson = await openAiResponse.json().catch(() => null)
  if (!openAiResponse.ok) {
    return NextResponse.json(
      { error: openAiJson?.error?.message || 'AI photo polish failed. Please try again.' },
      { status: openAiResponse.status }
    )
  }

  const b64 = openAiJson?.data?.[0]?.b64_json
  if (!b64) {
    return NextResponse.json({ error: 'AI photo polish returned no image. Please try again.' }, { status: 502 })
  }

  const polishedBytes = Buffer.from(b64, 'base64')
  const polishedPath = `portfolio/${user.id}/ai-polished-${Date.now()}.png`
  const { error: uploadError } = await supabase.storage
    .from('portfolio')
    .upload(polishedPath, polishedBytes, { contentType: 'image/png', upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage.from('portfolio').getPublicUrl(polishedPath)
  return NextResponse.json({ imageUrl: publicUrl })
}
