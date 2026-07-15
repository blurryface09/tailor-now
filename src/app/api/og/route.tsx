import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const title = searchParams.get('title') || 'TailorNow'
  const sub = searchParams.get('sub') || 'Nigeria\'s Fashion Marketplace'
  const type = searchParams.get('type') || 'default' // 'tailor' | 'post' | 'default'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #140F1E 0%, #241C36 50%, #140F1E 100%)',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow orbs */}
        <div style={{
          position: 'absolute', top: '-120px', left: '-80px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(198,138,82,0.3) 0%, transparent 70%)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', bottom: '-100px', right: '-60px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(140,90,120,0.3) 0%, transparent 70%)',
          display: 'flex',
        }} />

        {/* Content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 80px',
          height: '100%',
          position: 'relative',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #C68A52, #8C5A78, #4B3B66)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px',
            }}>
              ✂️
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#FAF6F0', fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                TailorNow
              </span>
              <span style={{ color: 'rgba(222,185,149,0.8)', fontSize: '13px', marginTop: '1px' }}>
                tailornow.shop
              </span>
            </div>
          </div>

          {/* Main text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {type !== 'default' && (
              <div style={{
                display: 'flex',
                background: 'rgba(198,138,82,0.15)',
                border: '1px solid rgba(198,138,82,0.4)',
                borderRadius: '100px',
                padding: '6px 18px',
                width: 'fit-content',
              }}>
                <span style={{ color: '#DEB995', fontSize: '14px', fontWeight: 600, letterSpacing: '0.5px' }}>
                  {type === 'tailor' ? '✦ VERIFIED CREATIVE' : '✦ FASHION PIECE'}
                </span>
              </div>
            )}
            <div style={{
              color: '#FAF6F0',
              fontSize: title.length > 40 ? '52px' : '64px',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-1px',
              maxWidth: '900px',
            }}>
              {title}
            </div>
            <div style={{
              color: 'rgba(222,185,149,0.85)',
              fontSize: '24px',
              fontWeight: 400,
              maxWidth: '800px',
              lineHeight: 1.4,
            }}>
              {sub}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#22c55e',
                display: 'flex',
              }} />
              <span style={{ color: 'rgba(250,246,240,0.5)', fontSize: '16px' }}>
                Nigeria&apos;s Fashion Marketplace
              </span>
            </div>
            <span style={{
              color: '#C68A52',
              fontSize: '16px',
              fontWeight: 600,
              background: 'rgba(198,138,82,0.12)',
              border: '1px solid rgba(198,138,82,0.35)',
              borderRadius: '8px',
              padding: '6px 16px',
              display: 'flex',
            }}>
              Book Now →
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
