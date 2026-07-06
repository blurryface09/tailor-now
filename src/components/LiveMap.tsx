'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface LiveMapProps {
  orderId: string
}

export function LiveMap({ orderId }: LiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [offline, setOffline] = useState(false)

  // Load Leaflet dynamically (SSR safe)
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return
    import('leaflet').then((L) => {
      // Fix default icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!).setView([6.5244, 3.3792], 14)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map)
      mapInstance.current = map
    })
  }, [])

  // Subscribe to realtime location updates
  useEffect(() => {
    const supabase = createClient()

    // Get initial location
    supabase.from('delivery_locations').select('lat,lng').eq('order_id', orderId).single()
      .then(({ data }) => {
        if (data) updateMarker(data.lat, data.lng)
        else setOffline(true)
      })

    const channel = supabase
      .channel(`delivery:${orderId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'delivery_locations',
        filter: `order_id=eq.${orderId}`,
      }, (payload: any) => {
        const { lat, lng } = payload.new
        setOffline(false)
        updateMarker(lat, lng)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orderId])

  const updateMarker = (lat: number, lng: number) => {
    setLocation({ lat, lng })
    import('leaflet').then((L) => {
      if (!mapInstance.current) return
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(mapInstance.current)
          .bindPopup('Creative is on the way 🛵').openPopup()
      }
      mapInstance.current.setView([lat, lng], 15)
    })
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.1]">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 border-b border-violet-100">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm font-medium text-violet-800">Creative is on the way</span>
        {location && (
          <span className="ml-auto text-xs text-zinc-600">Live tracking active</span>
        )}
      </div>
      {offline ? (
        <div className="h-48 flex items-center justify-center bg-[#09090B] text-sm text-zinc-600">
          Waiting for creative to start delivery...
        </div>
      ) : (
        <div ref={mapRef} style={{ height: 280 }} />
      )}
    </div>
  )
}
