import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fromLat = searchParams.get('fromLat');
  const fromLng = searchParams.get('fromLng');
  const toLat = searchParams.get('toLat');
  const toLng = searchParams.get('toLng');
  const vehicleMode = searchParams.get('vehicleMode') || 'motor'; // 'motor' | 'mobil'

  if (!fromLat || !fromLng || !toLat || !toLng) {
    return NextResponse.json({ error: 'Titik koordinat asal dan tujuan diperlukan' }, { status: 400 });
  }

  try {
    let routeUrl = '';

    if (vehicleMode === 'motor') {
      // 🏍️ MODE MOTOR: Gunakan OpenStreetMap Bike/Two-Wheeler Router (Bebas Tol / Menghindari Jalan Tol)
      routeUrl = `https://routing.openstreetmap.de/routed-bike/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`;
    } else {
      // 🚗 MODE MOBIL: Gunakan OSRM Car Router (Bisa Lewat Jalan Tol / Jalur Cepat)
      routeUrl = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`;
    }

    let res = await fetch(routeUrl, {
      headers: { 'User-Agent': 'RideSync-App/2.0' },
      next: { revalidate: 30 }
    });

    // Fallback jika routed-bike sedang sibuk: gunakan OSRM biasa
    if (!res.ok && vehicleMode === 'motor') {
      routeUrl = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`;
      res = await fetch(routeUrl, {
        headers: { 'User-Agent': 'RideSync-App/2.0' },
        next: { revalidate: 30 }
      });
    }

    if (!res.ok) throw new Error('Gagal mengambil rute navigasi');

    const data = await res.json();
    if (!data.routes || data.routes.length === 0) {
      throw new Error('Rute tidak ditemukan');
    }

    const route = data.routes[0];
    const latLngCoordinates = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);

    const distanceMeters = route.distance;
    const durationSeconds = route.duration;
    const distanceKm = distanceMeters / 1000;

    let adjustedDurationSeconds = durationSeconds;
    if (vehicleMode === 'motor') {
      // Motor di jalur non-tol Indonesia rata-rata 40-50 km/h
      adjustedDurationSeconds = (distanceKm / 42) * 3600;
    }

    const totalMinutes = Math.max(1, Math.round(adjustedDurationSeconds / 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    let durationFormatted = '';
    if (hours > 0) {
      durationFormatted = `${hours} Jam ${minutes} Menit`;
    } else {
      durationFormatted = `${minutes} Menit`;
    }

    return NextResponse.json({
      success: true,
      vehicleMode,
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      distanceFormatted: distanceKm < 1 ? `${Math.round(distanceMeters)} m` : `${distanceKm.toFixed(1)} km`,
      durationMinutes: totalMinutes,
      durationFormatted,
      coordinates: latLngCoordinates
    });
  } catch (error: any) {
    const p1 = [parseFloat(fromLat), parseFloat(fromLng)];
    const p2 = [parseFloat(toLat), parseFloat(toLng)];
    return NextResponse.json({
      success: true,
      vehicleMode,
      distanceKm: 10,
      distanceFormatted: '~10 km',
      durationMinutes: 20,
      durationFormatted: '~20 Menit',
      coordinates: [p1, p2],
      isFallback: true
    });
  }
}
