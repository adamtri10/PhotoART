# 📸 PhotoArt - Web Photo Booth & Frame Studio

Aplikasi web **Photo Booth** modern yang berjalan di browser, terinspirasi dari tren *self photo booth* ala Korea (*Life Four Cuts / Photomatix*). Anda dapat membagikan **Barcode (QR Code)** agar tamu atau pengunjung dapat langsung berfoto ria menggunakan kamera ponsel pribadi masing-masing tanpa perlu install aplikasi apapun!

---

## ✨ Fitur Unggulan

1. **📱 Scan Barcode (QR Code) Instan:**
   - Cukup tekan tombol **"Bagikan Barcode"** di kanan atas.
   - Barcode otomatis muncul dan siap di-scan langsung oleh kamera HP pengunjung.
   - Tersedia tombol **"Unduh Gambar Barcode"** untuk dicetak atau ditampilkan di tablet/meja booth.

2. **🎞️ Pilihan Bingkai (Frames) Bervariasi & Sudah Berhias Cantik:**
   - **🌸 Floral & Ribbon Sweet (2 Foto Kebawah)**: Hiasan bunga sakura (🌸, 🌷, 🌼, 🌿), pita manis (🎀), dan garis mutiara.
   - **🏷️ Polaroid Duo & Washi Tape (2 Foto Kanan Kiri)**: Format polaroid landscape bersebelahan dengan stiker selotip washi tape warna-warni dan tangkai daun estetik.
   - **🎟️ Theater Ticket Vintage (3 Foto Kebawah)**: Tiket bioskop marun Kafa Studio dengan lengkungan emas, bintang (★), dan nomor kursi (*ROW B2 • SEAT 02*).
   - **✉️ Retro Postage Stamp (3 Foto Kebawah)**: Perangko pos hijau klasik dengan gerigi perangko (*scalloped edge*) dan stempel pos udara (*Air Mail 2026*).
   - **🧸 Action Figure Blister Pack (3 Foto Kebawah)**: Kemasan mainan gantung retro (*Sukhakala series*) dengan lubang gantungan blister pack dan barcode.
   - **🙂 Checkers & Smiley Daisy (4 Foto Grid 2x2)**: 4 foto format kotak 2 ke samping & 2 kebawah dengan papan catur hijau & krem, bunga daisy (🌼) dan smiley 🙂.
   - **📰 Partner In Crime / Koran Vintage (3 Foto)**: Tata letak persis koran *Selfie Time* dengan kolom berita kiri (judul *"THE DUO THAT STOLE THE SPOTLIGHT"*, 1 foto, dan artikel berita persahabatan), serta kolom kanan dengan 2 foto (1 foto besar di atas & 1 foto di bawah) lengkap dengan kutipan estetik.
   - **🤖 Gundam Tactical Mecha HUD (6 Foto Grid 2x3)**: Kokpit mecha sci-fi 6 foto (grid 2x3) dengan **4 ornamen mecha otentik**: Badge militer E.F.S.F. (kiri atas), Logo Katakana Jepang "機動戦士 ガンダム" (kanan atas), Stensil peringatan hazard mecha (kiri bawah), dan Badge Robot RX-78-2 Gundam Holo-Armor (kanan bawah) serta HUD telemetri dan retikel kamera CAM-01..06.
   - **💖 Sunset Glow & Love Hearts (4 Foto Grid 2x2)**: Gradasi senja lembut berhias stiker hati berkilau (💖, ✨) dan love stamp.
   - **✨ Life4Cuts Minimalist Studio (4 Foto Kebawah)**: Strip 4 foto putih bersih elegan khas studio foto Korea.

4. **💾 Dashboard Galeri Foto User Otomatis:**
   - **Tersimpan Otomatis**: Setiap kali pengunjung menyelesaikan sesi fotonya di booth, hasil foto otomatis tersimpan ke **Dashboard Galeri** dan media penyimpanan server tanpa perlu repot upload manual.
   - **Unduh Langsung dari Dashboard**: Pengunjung dapat membuka tab **"🖼️ Galeri"** di navigasi atas atau tombol di editor untuk melihat seluruh koleksi foto dan mengunduhnya kapan saja.
   - **Lightbox Viewer Fullscreen**: Ketuk foto untuk membuka pratinjau resolusi tinggi (HD) dengan informasi waktu dan tema bingkai.
   - **Pengelolaan Foto Mandiri**: Pengunjung dapat menghapus foto yang tidak diinginkan dari galeri pribadinya.

5. **🔐 Panel Khusus Admin Media & Pemulihan Foto Terhapus (Recycle Bin):**
   - **Akses Aman dengan PIN**: Dilindungi otentikasi PIN khusus admin (PIN default: **8888**, dapat diubah via environment variable `PHOTOART_ADMIN_PIN`).
   - **Sistem Pemulihan Foto (*Recovery System*)**: Ketika pengunjung tidak sengaja menghapus foto dari dashboard galeri user (*soft-delete*), file fisik foto di server **TIDAK AKAN HILANG**.
   - **1-Click Restore**: Admin cukup membuka tab **"🗑️ Keranjang Sampah"** lalu klik tombol hijau **"🔄 Pulihkan Foto ke User"**. Foto yang terhapus akan seketika kembali muncul di dashboard pengunjung secara *real-time*!
   - **Kontrol Penuh Media**: Admin dapat melihat statistik total foto, media aktif, keranjang sampah, mengunduh arsip foto, atau melakukan pembersihan permanen (*permanent delete*) bila diperlukan.

6. **🎯 Penyesuaian Lokasi Stiker Bebas (Touch Drag & Drop + Tombol Cepat):**
   - **Geser Bebas Langsung di Foto**: Pengguna cukup menyentuh/mengklik stiker di atas foto dan menggesernya (*drag & drop*) ke posisi mana saja secara *real-time*.
   - **Tombol Posisi Cepat**: Pilihan posisi sekali ketuk (↖️ Kiri Atas, ↗️ Kanan Atas, ⏺️ Tengah, ↙️ Kiri Bawah, ↘️ Kanan Bawah).
   - **D-Pad & Kontrol Ukuran**: Tombol geser halus (⬆️, ⬇️, ⬅️, ➡️), perbesar/perkecil (➕, ➖), dan putar stiker (🔄).
   - **4 Stiker Mecha Gundam**: Tersedia tombol stiker Robot Gundam RX-78-2, Logo Katakana, Badge EFSF, dan Stensil Hazard yang bisa ditempelkan dan digeser ke sisi mana pun.

4. **📸 Ikon Filter Realistis Foto Wajah Asli (Bukan Kotak Warna Biasa):**
   - Tombol pilihan filter di kamera & editor kini menggunakan **ikon foto wajah manusia realistis** yang memperlihatkan contoh nyata efek filter pada warna kulit, pencahayaan, dan tone secara langsung.
   - 10 Preset Filter: *Normal, B&W Classic, Vintage 90s, Sepia Klasik, Pastel Dream Korea, Golden Hour, Cold Moody, Cyberpunk Pop, High Glam, Noir Drama*.

5. **✨ Desain UI Studio Profesional (Brand: PhotoArt):**
   - **Estetika Studio Otentik**: Didesain khusus layaknya web aplikasi photobooth komersial (Korea/Jepang) dengan palet warna *Studio Noir*, aksen *Rose Coral* & *Warm Gold*, dan efek *frosted glass*.
   - **Studio Step Tracker**: Navigasi tahap terstruktur (`01 Pilih Frame` ➔ `02 Ambil Pose` ➔ `03 Cetak & Hias`) yang mempermudah tamu mengikuti alur foto.
   - **Filter Kategori Cepat**: Memfilter bingkai berdasarkan kategori (*Koran Viral, Gundam Mecha, Sweet & Cute, Retro Ticket, Strip Foto*).
   - **Studio Viewfinder & Shutter Leica**: Layar kamera dilengkapi crop mark studio, film reel thumbnail tray, dan tombol jepret tactile multi-layer.
   - **Photo Easel Stand**: Pratinjau hasil cetak di studio editor dengan bayangan realistis pameran foto.

6. **📱 100% Responsif Ponsel (Bebas Bug & Tanpa Perlu Desktop Mode):**
   - Didesain khusus untuk layar HP (*Mobile-First*).
   - Tampilan pas di layar (tanpa scroll horizontal yang rusak).
   - Kamera pratinjau proporsional dengan tombol jepret yang mudah dijangkau jempol.
   - Pilihan filter kamera dapat di-*swipe* menyamping secara mulus (*touch scroll*).
   - Hasil foto otomatis menyesuaikan jumlah pose (2, 3, atau 4 foto) sesuai bingkai yang dipilih.

7. **📸 Pengambilan Foto & Filter Langsung di Layar Kamera (Live Capture):**
   - **Pilihan Filter Langsung di Kamera**: Pengguna bisa langsung memilih filter (*Normal, B&W Classic, Vintage 90s, Pastel Korea, Golden Hour, Sepia, Cold Moody, Cyberpunk, High Glam, Noir*) dan melihat efeknya secara *real-time* di layar kamera sebelum menekan tombol jepret!
   - Live camera preview dengan pilihan cermin (mirror) dan ganti kamera (depan/belakang).
   - Hitung mundur otomatis (**3 detik**, **5 detik**, atau manual per pose).
   - Efek suara hitungan mundur & suara jepretan kamera (*camera shutter* sintetis via Web Audio API, tanpa file audio luar).
   - Efek kilatan layar (*flash animation*) saat foto diambil.
   - **Dukungan Kamera Bawaan HP**: Tersedia tombol *"Buka Kamera HP Langsung / Galeri"* untuk kemudahan di semua jenis ponsel (iOS Safari & Android Chrome).

4. **🎨 Filter Foto Estetik:**
   - **Normal / Asli** (Warna natural)
   - **B&W Classic** (Monokrom elegan)
   - **Vintage 90s** (Nostalgia hangat)
   - **Sepia Klasik** (Coklat lawas)
   - **Pastel Dream** (Gaya Korea cerah & glowing)
   - **Golden Hour** (Hangat keemasan sore hari)
   - **Cold Moody** (Tone sinematik keren)
   - **Cyberpunk Pop** (Warna neon cerah)
   - **High Glam** (Cerah dan tajam)
   - **Noir Drama** (Hitam putih kontras tinggi)

5. **🖼️ Pilihan Bingkai (Frames) & Kustomisasi:**
   - Classic White (Putih minimalis)
   - Midnight Noir (Hitam matte berkelas)
   - Pastel Pink & Lavender Dream (Aesthetic Korea)
   - Matcha Mint, Butter Cream, Sky Aesthetic
   - Y2K Retro Checkers (Kotak-kotak monokrom)
   - 35mm Analog Film Roll (Perforasi rol film jadul)
   - Love & Hearts, Party Confetti
   - **Color Picker Custom**: Bebas pilih warna bingkai apapun!
   - Kustomisasi teks judul atas & tanggal/catatan bawah bingkai.

6. **🎀 Stiker Lucu (Doodles & Emojis):**
   - Tambahkan stiker emoji (🎀, 💖, ✨, 🌸, 🕶️, 👑, 🐱, 🐻, 📸, ⭐) langsung ke atas cetakan foto.

7. **💾 Simpan, Bagikan & Cetak:**
   - Ekspor foto resolusi tinggi (*High Definition*).
   - Tombol **Simpan / Download Foto** langsung ke galeri ponsel.
   - Tombol **Bagikan (Share)** via Web Share API (WhatsApp, Instagram, dsb.).
   - Tombol **Cetak (Print)** yang sudah dioptimasi untuk kertas foto ukuran cetak.

---

## 🚀 Cara Menjalankan

### Cara 1: Menggunakan Server Lokal Python (Direkomendasikan)
Cukup jalankan script `serve.py` di terminal:
```bash
python3 serve.py
```
Terminal akan menampilkan alamat IP lokal Anda, misalnya:
```text
[✓] Buka di Komputer / Laptop Host:
    👉 http://localhost:8000

[✓] Link untuk Ponsel Pengguna (Satu Jaringan WiFi):
    👉 http://192.168.1.15:8000
```
1. Buka `http://localhost:8000` di laptop atau layar display booth Anda.
2. Klik tombol **"📱 Bagikan Barcode"** di kanan atas.
3. Tamu yang terhubung ke WiFi yang sama tinggal mengarahkan kamera HP ke barcode tersebut.

### Cara 2: Langsung Buka File HTML
Anda juga bisa membuka langsung file `index.html` dengan mengklik dua kali di file manager atau menyeretnya ke browser Anda.

### Cara 3: Hosting Online (Opsional)
Jika Anda ingin aplikasi ini bisa diakses dari mana saja tanpa perlu satu jaringan WiFi:
- Unggah folder `photoart` ke **GitHub Pages**, **Vercel**, atau **Netlify** (karena berbasis file statis HTML, CSS, dan JS murni, aplikasi ini dapat langsung berjalan 100% gratis).

---

## 📁 Struktur File
```
photoart/
├── index.html         # Struktur utama web aplikasi photo booth & dashboard
├── css/
│   └── style.css      # Desain tampilan UI modern, dark studio & responsif ponsel
├── js/
│   ├── app.js         # Logika booth, auto-save gallery, admin control & lightbox
│   ├── frames.js      # Mesin render layout bingkai & dekorasi canvas
│   ├── filters.js     # Filter warna dan efek foto dengan ikon wajah realistis
│   └── qrcode.min.js  # Generator barcode QR Code mandiri (offline)
├── assets/            # Aset grafis stiker otentik Gundam RX-78-2 & ornamen
├── data/              # Media storage backend
│   ├── photos/        # File foto HD hasil sesi booth pengunjung
│   └── photos_db.json # Database JSON riwayat foto & status pemulihan
├── serve.py           # Backend REST API & server web lokal otomatis
└── README.md          # Dokumentasi panduan penggunaan
```

---

## 💡 Tips untuk Acara / Event
- **Display Meja Booth**: Buka web ini di tablet (iPad / Android Tablet) atau laptop, klik **"Bagikan Barcode"**, lalu letakkan tablet di meja agar pengunjung tinggal scan.
- **Cetak Poster Barcode**: Klik tombol **"Unduh Gambar Barcode"**, masukkan ke template poster atau cetak di kertas A5/A4 bertuliskan *"Scan untuk Berfoto"* dan letakkan di area photobooth Anda.

