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

  const fLat = parseFloat(fromLat);
  const fLng = parseFloat(fromLng);
  const tLat = parseFloat(toLat);
  const tLng = parseFloat(toLng);

  // Jika posisi sangat dekat (< 10 meter)
  if (Math.abs(fLat - tLat) < 0.0001 && Math.abs(fLng - tLng) < 0.0001) {
    return NextResponse.json({
      success: true,
      vehicleMode,
      routeDescription: 'Sudah di titik lokasi tujuan',
      distanceKm: 0.05,
      distanceFormatted: '50 m (Tiba di Lokasi)',
      durationMinutes: 1,
      durationFormatted: 'Tiba',
      coordinates: [[fLat, fLng], [tLat, tLng]]
    });
  }

  try {
    let routeUrl = '';
    if (vehicleMode === 'mobil') {
      // 🚗 MODE MOBIL: Logika Google Maps -> Prioritaskan Jalan Tol / Highway / Bebas Hambatan
      routeUrl = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${fLng},${fLat};${tLng},${tLat}?overview=full&geometries=geojson&steps=true`;
    } else {
      // 🏍️ MODE MOTOR: Logika Google Maps -> Tanpa Tol (Bebas Hambatan Non-Tol / Jalan Arteri & Nasional)
      routeUrl = `https://routing.openstreetmap.de/routed-bike/route/v1/driving/${fLng},${fLat};${tLng},${tLat}?overview=full&geometries=geojson&steps=true`;
    }

    let res = await fetch(routeUrl, {
      headers: { 'User-Agent': 'RideSync-App/2.0' },
      next: { revalidate: 30 }
    });

    // Fallback mirror jika server routed-car/bike sedang sibuk
    if (!res.ok) {
      const fallbackUrl = `https://router.project-osrm.org/route/v1/driving/${fLng},${fLat};${tLng},${tLat}?overview=full&geometries=geojson&steps=true`;
      res = await fetch(fallbackUrl, {
        headers: { 'User-Agent': 'RideSync-App/2.0' },
        next: { revalidate: 30 }
      });
    }

    if (!res.ok) throw new Error('Gagal mengambil rute navigasi dari server');

    const data = await res.json();
    if (!data.routes || data.routes.length === 0) {
      throw new Error('Rute jalan tidak ditemukan');
    }

    const route = data.routes[0];
    const latLngCoordinates = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);

    const distanceMeters = route.distance;
    const durationSeconds = route.duration;
    const distanceKm = distanceMeters / 1000;

    let adjustedDurationSeconds = durationSeconds;
    if (vehicleMode === 'motor') {
      // Motor di jalur non-tol Indonesia rata-rata 42 km/h
      adjustedDurationSeconds = (distanceKm / 42) * 3600;
    } else {
      // Mobil via Tol + Jalan Utama rata-rata 65-75 km/h
      adjustedDurationSeconds = Math.max(durationSeconds, (distanceKm / 70) * 3600);
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

    const routeDescription =
      vehicleMode === 'mobil'
        ? 'Jalur Cepat (Utamakan Jalan Tol)'
        : 'Jalur Bebas Tol (Khusus Sepeda Motor)';

    return NextResponse.json({
      success: true,
      vehicleMode,
      routeDescription,
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      distanceFormatted: distanceKm < 1 ? `${Math.round(distanceMeters)} m` : `${distanceKm.toFixed(1)} km`,
      durationMinutes: totalMinutes,
      durationFormatted,
      coordinates: latLngCoordinates
    });
  } catch (error: any) {
    // Fallback garis langsung jika OSRM offline
    const p1: [number, number] = [fLat, fLng];
    const p2: [number, number] = [tLat, tLng];

    const R = 6371;
    const dLat = ((tLat - fLat) * Math.PI) / 180;
    const dLon = ((tLng - fLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((fLat * Math.PI) / 180) *
        Math.cos((tLat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c * 1.25;

    const dur = Math.max(1, Math.round((dist / (vehicleMode === 'mobil' ? 65 : 42)) * 60));
    const hours = Math.floor(dur / 60);
    const mins = dur % 60;

    return NextResponse.json({
      success: true,
      vehicleMode,
      routeDescription: vehicleMode === 'mobil' ? 'Jalur Cepat Mobil' : 'Jalur Motor Non-Tol',
      distanceKm: parseFloat(dist.toFixed(1)),
      distanceFormatted: `${dist.toFixed(1)} km`,
      durationMinutes: dur,
      durationFormatted: hours > 0 ? `${hours} Jam ${mins} Menit` : `${mins} Menit`,
      coordinates: [p1, p2],
      isFallback: true
    });
  }
}
