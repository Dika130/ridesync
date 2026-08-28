import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RideSync - Futuristic Eco Motorcycle Convoy & GPS Tracker',
  description: 'Sistem monitoring konvoi motor real-time futuristik, bersih, ramah lingkungan, dan hemat energi dengan pelacakan presisi anggota rider.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  themeColor: '#040d09',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <head>
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="bg-[#040806] text-emerald-50 antialiased selection:bg-emerald-400 selection:text-black">
        {children}
      </body>
    </html>
  );
}
