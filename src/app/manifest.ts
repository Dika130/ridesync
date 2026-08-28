import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RideSync - Pelacak Konvoi Motor & Mobil',
    short_name: 'RideSync',
    description: 'Real-Time Motorcycle Convoy GPS Tracker with Eco-OLED Navigation',
    start_url: '/',
    display: 'standalone',
    background_color: '#030705',
    theme_color: '#040d09',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
