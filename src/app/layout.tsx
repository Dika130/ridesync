import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RideSync - Real-Time Motorcycle Convoy & Touring GPS Tracker',
  description: 'Aplikasi monitoring konvoi motor & touring real-time dengan tracking anggota rider, road captain, dan titik tujuan checkpoint.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
