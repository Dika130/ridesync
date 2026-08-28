# 🏍️ RideSync — Real-Time Motorcycle Convoy GPS & Eco Navigation

[![Live Website](https://img.shields.io/badge/Website-ridesync--web.vercel.app-10b981?style=for-the-badge&logo=vercel)](https://ridesync-web.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-13.5_App_Router-000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_&_REST-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![OpenStreetMap](https://img.shields.io/badge/Routing-OSM_Valhalla_Motorcycle-7EBC6F?style=for-the-badge&logo=openstreetmap)](https://www.openstreetmap.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

> **RideSync** adalah platform pelacak GPS dan navigasi rute konvoi *real-time* berbasis web untuk rombongan sepeda motor dan mobil. Didesain dengan antarmuka futuristik bertema gelap (*OLED Eco-Energy*), hemat baterai ponsel, cerdas memprioritaskan jalan raya bebas tol, serta dilengkapi obrolan grup instan tanpa perlu login rumit.

---

## 🌟 Mengapa RideSync?

Saat melakukan *touring* atau *sunmori* (Sunday Morning Ride), rombongan pengendara seringkali mengalami kendala:
* ❌ **Anggota terpisah di lampu merah atau persimpangan** tanpa tahu posisi teman lainnya.
* ❌ **Aplikasi navigasi umum sering mengarahkan motor ke gang sempit/jalan setapak** yang berbahaya untuk konvoi.
* ❌ **Aplikasi navigasi boros baterai** dan membuat HP pengendara cepat panas di atas dudukan motor.
* ❌ **Proses bergabung rumit** yang mengharuskan download aplikasi berat atau login akun.

**RideSync hadir sebagai solusi tuntas** untuk seluruh pengendara di Indonesia! 🚀

---

## 🚀 Fitur-Fitur Utama

### 1. 👥 Pelacak Rombongan *Multiplayer Real-Time*
* Pantau seluruh posisi teman konvoi di dalam satu peta dinamis.
* Menampilkan metrik *live* setiap pengendara: **Kecepatan gerak (km/h)**, **Sisa baterai ponsel (%)**, **Status pengecasan**, dan **Jarak ke titik tujuan**.
* Tombol **"Pantau Rider"** untuk mengarahkan kamera langsung ke pengendara tertentu.

### 2. 🛣️ Navigasi Pintar Khusus Motor (*Non-Toll & Anti-Gang Sempit*)
* Menggunakan mesin routing canggih berbasis OpenStreetMap & Valhalla:
  * **Mode Motor 🏍️**: Memprioritaskan jalan raya arteri yang lebar, otomatis menghindari jalan tol mobil, dan secara ketat memblokir gang-gang sempit permukiman (*living streets/trails*).
  * **Mode Mobil 🚗**: Mengoptimalkan rute jalan utama dan jalan tol berkecepatan tinggi.
* Menghitung estimasi waktu tempuh (**ETA**) dan total jarak rute secara akurat.

### 3. 👑 Manajemen Kepemimpinan (*Road Captain*)
* **Penentuan Titik Tujuan (*Checkpoint*)**: Hanya Road Captain yang berhak menentukan dan mengubah lokasi kumpul/finish konvoi.
* **Pindah Kepemimpinan (*Transfer Captain*)**: Road Captain dapat menyerahkan tongkat komando ke rider lain kapan saja.
* **Keluarkan Rider (*Kick Member*)**: Road Captain dapat menertibkan rombongan dari pengendara yang tidak dikenal.
* **Bubarkan Konvoi (*Auto-Disband*)**: Jika Road Captain mengakhiri perjalanan, room konvoi akan otomatis dibubarkan secara rapi.

### 4. 💬 Obrolan Konvoi Live (*Group Convoy Chat*)
* Berkomunikasi teks secara langsung dengan seluruh rombongan di dalam room.
* **Indikator Titik Merah (*Pulsing Red Dot*)**: Tombol obrolan di topbar akan menyala jika ada pesan baru masuk dari teman rombongan.
* **Audio & Vibration Feedback**: Dilengkapi notifikasi suara dan getar saat pesan baru diterima.

### 5. 📱 Kemudahan Scroll di HP (*Mobile Gesture Assistant*)
* Tombol **"Scroll Bebas" / "Mode Peta"** di layar HP memudahkan pengendara menggeser halaman ke bawah tanpa jari terperangkap oleh peta.

### 6. 🔋 *OLED Eco-Energy Saving* & PWA *Installable*
* Latar belakang hitam pekat (`#030705`) menghemat konsumsi daya layar AMOLED ponsel saat *touring* jarak jauh.
* Mendukung **PWA (*Progressive Web App*)**: Dapat diinstal (*Add to Home Screen*) di Android & iOS untuk berjalan *fullscreen* tanpa *address bar*.

### 7. 🔗 Akses Publik Instan (*Zero-Login Guest Join*)
* Bagikan tautan via WhatsApp atau salin link. Anggota konvoi cukup membuka tautan dan langsung aktif di peta tanpa perlu login atau verifikasi email.

---

## 🎯 Manfaat Menggunakan RideSync

| Manfaat | Deskripsi |
| :--- | :--- |
| **🛡️ Keamanan & Solidaritas Konvoi** | Memastikan tidak ada anggota rombongan yang tertinggal atau tersesat di persimpangan jalan. |
| **🔋 Hemat Daya & Baterai HP** | Tema gelap OLED dan optimalisasi interval GPS menjaga baterai HP tetap awet selama perjalanan jauh. |
| **⚡ Koordinasi Cepat & Praktis** | Cukup buat grup dalam 5 detik, sebar link ke grup WhatsApp rombongan, dan konvoi langsung siap jalan. |
| **🏍️ Rute Nyaman untuk Motor** | Terhindar dari jalan sempit berbelok-belok yang tidak ramah untuk motor besar maupun rombongan banyak. |

---

## 🛠️ Arsitektur & Teknologi

* **Frontend Framework**: [Next.js 13.5 (App Router)](https://nextjs.org/) & [React 18](https://react.dev/)
* **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
* **Styling & Desain**: [Tailwind CSS](https://tailwindcss.com/) (Cyber-OLED Dark Theme) & [Lucide Icons](https://lucide.dev/)
* **Peta Interaktif**: [Leaflet.js](https://leafletjs.com/) & [OpenStreetMap](https://www.openstreetmap.org/)
* **Routing Engine**: [OSM Valhalla Motor Costing API](https://github.com/valhalla/valhalla) & OSRM Engine
* **Database & REST**: [Supabase PostgreSQL](https://supabase.com/) & In-Memory Resilient Store
* **Deployment**: [Vercel Edge Network](https://vercel.com/)

---

## 💻 Panduan Instalasi Lokal (*Self-Hosting*)

### 1. Kloning Repositori
```bash
git clone https://github.com/Dika130/ridesync.git
cd ridesync
```

### 2. Pasang Dependensi
```bash
npm install
```

### 3. Konfigurasi *Environment Variables*
Buat file `.env.local` di direktori utama:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-anon-key
SUPABASE_SECRET_KEY=your-secret-key
```

### 4. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka browser di `http://localhost:3000`.

### 5. Build untuk Produksi
```bash
npm run build
npm start
```

---

## 📖 Cara Penggunaan

1. **Buka Aplikasi**: Kunjungi [ridesync-web.vercel.app](https://ridesync-web.vercel.app).
2. **Buat Grup Konvoi**:
   * Masukkan nama rombongan (misal: *Sunmori Puncak Pass*).
   * Masukkan nama Anda dan pilih jenis kendaraan (*Motor* / *Mobil*).
   * Tentukan titik kumpul/tujuan awal.
   * Klik **"Buka Room Konvoi & Generate Link"**.
3. **Undang Anggota Rombongan**:
   * Klik tombol **"Share WA"** atau **"Salin Link"** di topbar.
   * Kirimkan ke grup WhatsApp teman-teman Anda.
4. **Mulai Touring**:
   * Setiap rider yang membuka link akan langsung muncul di peta secara *live*.
   * Gunakan fitur **"Obrolan"** untuk berkoordinasi dan **"Pantau Rider"** untuk melihat posisi teman lainnya!


---

<div align="center">
  <b>RideSync</b> — <i>Safe, Connected, and Eco-Friendly Convoy Navigation.</i> 🏁🏍️
</div>
