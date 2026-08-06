import { Navbar } from '@/components/layout/navbar'
import Link from 'next/link'

export const metadata = {
  title: 'Download the App — TailorNow',
  description: 'Get the TailorNow Android app. Browse creatives, place orders and track them from your home screen.',
  alternates: { canonical: '/download' },
}

// Always resolves to the newest published release, so this page never needs
// editing when a new version ships.
const APK_URL = 'https://github.com/blurryface09/tailor-now/releases/latest/download/tailornow.apk'

const steps = [
  'Tap "Download for Android" — the file saves to your Downloads folder.',
  'Open it. Android will ask permission to install apps from this source — allow it.',
  'Tap Install, then Open. TailorNow appears on your home screen.',
]

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-[#140F1E]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-12">

        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-violet-600 rounded-3xl flex items-center justify-center mb-5 mx-auto shadow-lg shadow-violet-900/40">
            <span className="text-4xl">✂️</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-3">Get TailorNow on Android</h1>
          <p className="text-zinc-400 leading-relaxed max-w-md mx-auto">
            Browse creatives, place orders and track them — from your home screen, with no browser in the way.
          </p>
        </div>

        <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-8">
          <a
            href={APK_URL}
            className="flex items-center justify-center w-full px-6 py-4 bg-violet-700 hover:bg-violet-800 text-white rounded-xl font-semibold transition-all duration-150 active:scale-[0.97]"
          >
            Download for Android
          </a>
          <p className="text-zinc-500 text-xs text-center mt-3">
            Free · Works on Android 5.0 and newer
          </p>

          <div className="mt-8 pt-8 border-t border-white/[0.08]">
            <h2 className="text-sm font-bold text-white mb-4">How to install</h2>
            <ol className="space-y-3">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-zinc-300 leading-relaxed">
                  <span className="flex-shrink-0 w-5 h-5 bg-violet-600/20 text-violet-300 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="text-zinc-500 text-xs mt-5 leading-relaxed">
              The permission prompt is normal for apps installed outside the Play Store. TailorNow is
              published by us and the app only ever opens tailornow.shop.
            </p>
          </div>
        </div>

        <div className="mt-6 bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6 text-center">
          <p className="text-zinc-400 text-sm">
            Prefer not to install anything? TailorNow works in your browser too —{' '}
            <Link href="/browse" className="text-violet-400 hover:text-violet-300 font-medium">
              start browsing creatives
            </Link>
            .
          </p>
        </div>

      </div>
    </div>
  )
}
