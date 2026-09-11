"use client"

import { useEffect, useMemo, useState } from "react"
import {
    GeoJSON,
    MapContainer,
    TileLayer,
    useMap,
    useMapEvents,
} from "react-leaflet"
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet"
import { circle } from "@turf/circle"
import { featureCollection } from "@turf/helpers"
import { union } from "@turf/union"

import "leaflet/dist/leaflet.css"

export type CompanyMapZone = {
    zip?: string
    latitude: string
    longitude: string
}

type CompanyMapProps = {
    latitude?: string
    longitude?: string
    zones?: CompanyMapZone[]
    /** базовый радиус круга ZIP в метрах, когда карта близко */
    radiusMeters?: number
    className?: string
}

/** Нижний порог круга на экране. Подкручивай здесь. */
const MIN_RADIUS_PX = 25

function metersPerPixel(latitude: number, zoom: number): number {
    return (
        (40075016.686 * Math.abs(Math.cos((latitude * Math.PI) / 180))) /
        2 ** (zoom + 8)
    )
}

function visibleRadiusMeters(
    latitude: number,
    zoom: number,
    baseRadiusMeters: number
): number {
    return Math.max(
        baseRadiusMeters,
        MIN_RADIUS_PX * metersPerPixel(latitude, zoom)
    )
}

type ZipArea = NonNullable<ReturnType<typeof union>>

function unionZipCircles(
    zones: CompanyMapZone[],
    radiusMeters: number
): ZipArea | null {
    const polygons = zones.flatMap((zone) => {
        const lat = Number(zone.latitude)
        const lng = Number(zone.longitude)
        if (Number.isNaN(lat) || Number.isNaN(lng)) return []
        return [
            circle([lng, lat], radiusMeters, {
                steps: 64,
                units: "meters",
            }),
        ]
    })

    if (polygons.length === 0) return null
    if (polygons.length === 1) return polygons[0]

    return union(featureCollection(polygons))
}

function FitZones({ points }: { points: LatLngExpression[] }) {
    const map = useMap()

    useEffect(() => {
        if (points.length === 0) return
        if (points.length === 1) {
            map.setView(points[0], 12)
            return
        }
        map.fitBounds(points as LatLngBoundsExpression, {
            padding: [36, 36],
            maxZoom: 13,
        })
    }, [map, points])

    return null
}

function ZipUnion({
                      zones,
                      baseRadiusMeters,
                  }: {
    zones: CompanyMapZone[]
    baseRadiusMeters: number
}) {
    const map = useMap()
    const [radius, setRadius] = useState(() =>
        visibleRadiusMeters(map.getCenter().lat, map.getZoom(), baseRadiusMeters)
    )

    function syncRadius() {
        setRadius(
            visibleRadiusMeters(
                map.getCenter().lat,
                map.getZoom(),
                baseRadiusMeters
            )
        )
    }

    useMapEvents({
        zoomend: syncRadius,
        moveend: syncRadius,
    })

    const area = useMemo(
        () => unionZipCircles(zones, radius),
        [zones, radius]
    )

    if (!area) return null

    return (
        <GeoJSON
            key={`${radius}-${zones.length}`}
            data={area}
            style={{
                color: "hsl(var(--primary))",
                fillColor: "hsl(var(--primary))",
                fillOpacity: 0.22,
                weight: 2,
            }}
        />
    )
}

export function CompanyMap({
                               latitude,
                               longitude,
                               zones = [],
                               radiusMeters = 2500,
                               className,
                           }: CompanyMapProps) {
    const resolvedZones = useMemo(() => {
        if (zones.length > 0) return zones
        if (latitude && longitude) {
            return [{ latitude, longitude }]
        }
        return []
    }, [zones, latitude, longitude])

    const points = useMemo(() => {
        return resolvedZones
            .map((zone) => {
                const lat = Number(zone.latitude)
                const lng = Number(zone.longitude)
                if (Number.isNaN(lat) || Number.isNaN(lng)) return null
                return [lat, lng] as [number, number]
            })
            .filter((point): point is [number, number] => point !== null)
    }, [resolvedZones])

    if (points.length === 0) {
        return (
            <div
                className={`rounded-xl bg-muted animate-pulse aspect-[16/10] ${className ?? ""}`}
            />
        )
    }

    const center: LatLngExpression = points[0]

    return (
        <div className={`overflow-hidden rounded-xl border ${className ?? ""}`}>
            <MapContainer
                center={center}
                zoom={12}
                scrollWheelZoom={false}
                className="h-[280px] w-full z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitZones points={points} />
                <ZipUnion
                    zones={resolvedZones}
                    baseRadiusMeters={radiusMeters}
                />
            </MapContainer>
            <p className="px-3 py-2 text-xs text-muted-foreground bg-muted/50 border-t">
                {resolvedZones.some((zone) => zone.zip)
                    ? `Service ZIPs (${resolvedZones.filter((zone) => zone.zip).length})`
                    : `Approximate service area (~${Math.round(radiusMeters / 1000)} km radius)`}
            </p>
        </div>
    )
}
