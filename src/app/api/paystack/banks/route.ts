import { NextResponse } from 'next/server'
import { listBanks } from '@/lib/paystack'

export async function GET() {
  try {
    const banks = await listBanks()
    return NextResponse.json({ banks })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
