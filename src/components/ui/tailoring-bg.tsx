export function TailoringBg({ dark = false }: { dark?: boolean }) {
  const c = dark ? 'rgba(255,255,255,' : 'rgba(124,58,237,'
  const g = dark ? 'rgba(253,186,116,' : 'rgba(217,119,6,'

  return (
    <div className="pointer-events-none select-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* ── Scissors 1 (top-left, slow drift) */}
      <svg style={{ position:'absolute', top:'8%', left:'3%', opacity: dark ? 0.07 : 0.06, animation:'bg-float-1 14s ease-in-out infinite' }} width="80" height="80" viewBox="0 0 140 120" fill="none">
        <g style={{transformOrigin:'68px 58px', animation:'tn-snip 3s ease-in-out infinite'}}>
          <ellipse cx="28" cy="28" rx="18" ry="22" stroke={`${c}1)`} strokeWidth="3.5" fill="none"/>
          <ellipse cx="28" cy="28" rx="10" ry="12" stroke={`${c}1)`} strokeWidth="2" fill="none"/>
          <path d="M40 18 Q55 30 68 58" stroke={`${c}1)`} strokeWidth="3.5" strokeLinecap="round" fill="none"/>
          <path d="M38 36 Q53 44 68 58" stroke={`${c}1)`} strokeWidth="3.5" strokeLinecap="round" fill="none"/>
          <path d="M68 58 L110 30" stroke={`${c}1)`} strokeWidth="3" strokeLinecap="round"/>
        </g>
        <g style={{transformOrigin:'68px 62px', animation:'tn-snip 3s ease-in-out infinite reverse'}}>
          <ellipse cx="28" cy="92" rx="18" ry="22" stroke={`${g}1)`} strokeWidth="3.5" fill="none"/>
          <ellipse cx="28" cy="92" rx="10" ry="12" stroke={`${g}1)`} strokeWidth="2" fill="none"/>
          <path d="M40 102 Q55 90 68 62" stroke={`${g}1)`} strokeWidth="3.5" strokeLinecap="round" fill="none"/>
          <path d="M38 84 Q53 76 68 62" stroke={`${g}1)`} strokeWidth="3.5" strokeLinecap="round" fill="none"/>
          <path d="M68 62 L110 90" stroke={`${g}1)`} strokeWidth="3" strokeLinecap="round"/>
        </g>
        <circle cx="68" cy="60" r="6" stroke={`${c}1)`} strokeWidth="2.5" fill="none"/>
        <circle cx="68" cy="60" r="2.5" fill={`${c}1)`}/>
      </svg>

      {/* ── Scissors 2 (bottom-right, faster) */}
      <svg style={{ position:'absolute', bottom:'10%', right:'4%', opacity: dark ? 0.06 : 0.05, animation:'bg-float-2 10s ease-in-out infinite 2s' }} width="60" height="52" viewBox="0 0 140 120" fill="none">
        <g style={{transformOrigin:'68px 58px', animation:'tn-snip 2.5s ease-in-out infinite 0.5s'}}>
          <ellipse cx="28" cy="28" rx="18" ry="22" stroke={`${c}1)`} strokeWidth="3.5" fill="none"/>
          <ellipse cx="28" cy="28" rx="10" ry="12" stroke={`${c}1)`} strokeWidth="2" fill="none"/>
          <path d="M40 18 Q55 30 68 58" stroke={`${c}1)`} strokeWidth="3.5" strokeLinecap="round" fill="none"/>
          <path d="M38 36 Q53 44 68 58" stroke={`${c}1)`} strokeWidth="3.5" strokeLinecap="round" fill="none"/>
          <path d="M68 58 L110 30" stroke={`${c}1)`} strokeWidth="3" strokeLinecap="round"/>
        </g>
        <g style={{transformOrigin:'68px 62px', animation:'tn-snip 2.5s ease-in-out infinite 0.5s reverse'}}>
          <ellipse cx="28" cy="92" rx="18" ry="22" stroke={`${g}1)`} strokeWidth="3.5" fill="none"/>
          <ellipse cx="28" cy="92" rx="10" ry="12" stroke={`${g}1)`} strokeWidth="2" fill="none"/>
          <path d="M40 102 Q55 90 68 62" stroke={`${g}1)`} strokeWidth="3.5" strokeLinecap="round" fill="none"/>
          <path d="M38 84 Q53 76 68 62" stroke={`${g}1)`} strokeWidth="3.5" strokeLinecap="round" fill="none"/>
          <path d="M68 62 L110 90" stroke={`${g}1)`} strokeWidth="3" strokeLinecap="round"/>
        </g>
        <circle cx="68" cy="60" r="6" stroke={`${c}1)`} strokeWidth="2.5" fill="none"/>
        <circle cx="68" cy="60" r="2.5" fill={`${c}1)`}/>
      </svg>

      {/* ── Needle top-right */}
      <svg style={{ position:'absolute', top:'12%', right:'8%', opacity: dark ? 0.1 : 0.08, animation:'bg-needle 8s ease-in-out infinite 1s' }} width="12" height="70" viewBox="0 0 12 70" fill="none">
        <rect x="4" y="0" width="4" height="56" rx="2" fill={`${c}1)`}/>
        <ellipse cx="6" cy="6" rx="5" ry="6" stroke={`${c}1)`} strokeWidth="1.5" fill="none"/>
        <ellipse cx="6" cy="6" rx="2" ry="2.5" stroke={`${c}1)`} strokeWidth="1" fill="none"/>
        <path d="M4 56 L6 70 L8 56" fill={`${g}1)`}/>
      </svg>

      {/* ── Thread spool center-left */}
      <svg style={{ position:'absolute', top:'50%', left:'1.5%', opacity: dark ? 0.08 : 0.06, animation:'bg-float-1 12s ease-in-out infinite 3s' }} width="44" height="50" viewBox="0 0 44 50" fill="none">
        <ellipse cx="22" cy="8"  rx="18" ry="7" stroke={`${c}1)`} strokeWidth="2" fill="none"/>
        <ellipse cx="22" cy="42" rx="18" ry="7" stroke={`${c}1)`} strokeWidth="2" fill="none"/>
        <rect x="4"  y="8" width="36" height="34" rx="2" stroke={`${c}1)`} strokeWidth="1.5" fill="none"/>
        <ellipse cx="22" cy="25" rx="10" ry="18" stroke={`${g}1)`} strokeWidth="1.5" fill="none"/>
        <ellipse cx="22" cy="25" rx="6"  ry="12" stroke={`${g}1)`} strokeWidth="1" fill="none"/>
        <ellipse cx="22" cy="25" rx="2"  ry="4"  fill={`${c}1)`}/>
        {/* thread tail */}
        <path d="M40 25 Q52 10 60 2" stroke={`${g}1)`} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" fill="none"/>
      </svg>

      {/* ── Needle bottom-left */}
      <svg style={{ position:'absolute', bottom:'15%', left:'6%', opacity: dark ? 0.09 : 0.07, animation:'bg-needle 11s ease-in-out infinite 4s' }} width="10" height="55" viewBox="0 0 12 70" fill="none">
        <rect x="4" y="0" width="4" height="56" rx="2" fill={`${g}1)`}/>
        <ellipse cx="6" cy="6" rx="5" ry="6" stroke={`${g}1)`} strokeWidth="1.5" fill="none"/>
        <ellipse cx="6" cy="6" rx="2" ry="2.5" stroke={`${g}1)`} strokeWidth="1" fill="none"/>
        <path d="M4 56 L6 70 L8 56" fill={`${c}1)`}/>
      </svg>

      {/* ── Measuring tape top-center */}
      <svg style={{ position:'absolute', top:'5%', left:'40%', opacity: dark ? 0.06 : 0.05, animation:'bg-float-2 16s ease-in-out infinite 0.5s' }} width="90" height="22" viewBox="0 0 90 22" fill="none">
        <rect x="0" y="4" width="90" height="14" rx="7" stroke={`${c}1)`} strokeWidth="1.5" fill="none"/>
        {[0,1,2,3,4,5,6,7,8].map(i => (
          <line key={i} x1={10 + i*9} y1="4" x2={10 + i*9} y2={i % 2 === 0 ? "18" : "13"} stroke={`${c}1)`} strokeWidth="1" strokeLinecap="round"/>
        ))}
      </svg>

      {/* ── Scissors 3 center-right, tiny */}
      <svg style={{ position:'absolute', top:'35%', right:'2%', opacity: dark ? 0.05 : 0.04, animation:'bg-float-1 18s ease-in-out infinite 6s' }} width="40" height="34" viewBox="0 0 140 120" fill="none">
        <g style={{transformOrigin:'68px 58px', animation:'tn-snip 4s ease-in-out infinite 1s'}}>
          <ellipse cx="28" cy="28" rx="18" ry="22" stroke={`${c}1)`} strokeWidth="3.5" fill="none"/>
          <ellipse cx="28" cy="28" rx="10" ry="12" stroke={`${c}1)`} strokeWidth="2" fill="none"/>
          <path d="M40 18 Q55 30 68 58" stroke={`${c}1)`} strokeWidth="3.5" strokeLinecap="round" fill="none"/>
          <path d="M68 58 L110 30" stroke={`${c}1)`} strokeWidth="3" strokeLinecap="round"/>
        </g>
        <g style={{transformOrigin:'68px 62px', animation:'tn-snip 4s ease-in-out infinite 1s reverse'}}>
          <ellipse cx="28" cy="92" rx="18" ry="22" stroke={`${g}1)`} strokeWidth="3.5" fill="none"/>
          <ellipse cx="28" cy="92" rx="10" ry="12" stroke={`${g}1)`} strokeWidth="2" fill="none"/>
          <path d="M40 102 Q55 90 68 62" stroke={`${g}1)`} strokeWidth="3.5" strokeLinecap="round" fill="none"/>
          <path d="M68 62 L110 90" stroke={`${g}1)`} strokeWidth="3" strokeLinecap="round"/>
        </g>
        <circle cx="68" cy="60" r="6" stroke={`${c}1)`} strokeWidth="2.5" fill="none"/>
        <circle cx="68" cy="60" r="2.5" fill={`${c}1)`}/>
      </svg>

      {/* ── Pin dots scattered */}
      {[
        { top:'22%', left:'18%', delay:'0s' },
        { top:'68%', left:'88%', delay:'2s' },
        { top:'45%', left:'55%', delay:'4s' },
      ].map((p, i) => (
        <svg key={i} style={{ position:'absolute', top:p.top, left:p.left, opacity: dark ? 0.12 : 0.1, animation:`bg-pin 6s ease-in-out infinite ${p.delay}` }} width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="4" stroke={`${g}1)`} strokeWidth="1.5" fill="none"/>
          <circle cx="5" cy="5" r="1.5" fill={`${g}1)`}/>
        </svg>
      ))}
    </div>
  )
}
