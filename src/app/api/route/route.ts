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
    // Gunakan OSRM Routing Engine publik berkecepatan tinggi
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`;

    const res = await fetch(osrmUrl, {
      headers: { 'User-Agent': 'RideSync-App/2.0' },
      next: { revalidate: 30 }
    });

    if (!res.ok) throw new Error('Gagal mengambil rute dari OSRM');

    const data = await res.json();
    if (!data.routes || data.routes.length === 0) {
      throw new Error('Rute tidak ditemukan');
    }

    const route = data.routes[0];
    // GeoJSON coordinates adalah [lng, lat], ubah ke [lat, lng] untuk Leaflet
    const latLngCoordinates = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);

    const distanceMeters = route.distance; // meters
    const durationSeconds = route.duration; // seconds

    const distanceKm = distanceMeters / 1000;

    // Estimasi kecepatan: motor rata-rata lebih lincah di kemacetan kota
    let adjustedDurationSeconds = durationSeconds;
    if (vehicleMode === 'motor') {
      // Kecepatan motor di lalu lintas padat 15-20% lebih gesit
      adjustedDurationSeconds = durationSeconds * 0.85;
    }

    const totalMinutes = Math.round(adjustedDurationSeconds / 60);
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
    // Fallback garis lurus jika API rute offline
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
