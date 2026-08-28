import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat dan lng diperlukan' }, { status: 400 });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'RideSync-App/2.0',
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8'
      },
      next: { revalidate: 60 }
    });

    if (!res.ok) throw new Error('Nominatim error');
    const data = await res.json();
    return NextResponse.json({ address: data.display_name || `${lat}, ${lng}` });
  } catch (error: any) {
    return NextResponse.json({ address: `Koordinat: ${lat}, ${lng}` });
  }
}
