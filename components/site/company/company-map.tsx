"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Circle } from "react-leaflet"
import type { LatLngExpression } from "leaflet"

import "leaflet/dist/leaflet.css"

type CompanyMapProps = {
    latitude: string
    longitude: string
    /** радиус зоны выезда в метрах */
    radiusMeters?: number
    className?: string
}

export function CompanyMap({
                               latitude,
                               longitude,
                               radiusMeters = 15000, // 15 км — примерная зона выезда
                               className,
                           }: CompanyMapProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const lat = Number(latitude)
    const lng = Number(longitude)

    if (!mounted || Number.isNaN(lat) || Number.isNaN(lng)) {
        return (
            <div
                className={`rounded-xl bg-muted animate-pulse aspect-[16/10] ${className ?? ""}`}
            />
        )
    }

    const center: LatLngExpression = [lat, lng]

    return (
        <div className={`overflow-hidden rounded-xl border ${className ?? ""}`}>
            <MapContainer
                center={center}
                zoom={11}
                scrollWheelZoom={false}
                className="h-[280px] w-full z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Circle
                    center={center}
                    radius={radiusMeters}
                    pathOptions={{
                        color: "hsl(var(--primary))",
                        fillColor: "hsl(var(--primary))",
                        fillOpacity: 0.15,
                        weight: 2,
                    }}
                />
            </MapContainer>
            <p className="px-3 py-2 text-xs text-muted-foreground bg-muted/50 border-t">
                Approximate service area (~{Math.round(radiusMeters / 1000)} km radius)
            </p>
        </div>
    )
}