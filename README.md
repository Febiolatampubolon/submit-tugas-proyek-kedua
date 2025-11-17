🔗 Demo Aplikasi

**Akses Demo:** https://[username].github.io/story-explorer-pwa/

## 🎯 Fitur Utama

### 📦 Fitur PWA (Progressive Web App)

* **Bisa Dipasang:** Aplikasi dapat ditambahkan ke layar utama perangkat.
* **Berfungsi Tanpa Internet:** Konten inti tetap dapat diakses saat offline.
* **App Shell Cepat:** Tampilan utama termuat dengan instan.
* **Responsif:** Desain nyaman digunakan di segala ukuran layar.

### 🛎️ Notifikasi Push

* **Notifikasi Adaptif:** Isi notifikasi menyesuaikan kondisi.
* **Kontrol Notifikasi:** Pengguna bebas mengaktifkan atau menonaktifkan.
* **Aksi Dalam Notifikasi:** Tersedia tombol untuk membuka halaman tertentu.
* **Bisa Diterima Tanpa Membuka Aplikasi:** Bekerja di background.

### 🧭 Peta Interaktif

* **Leaflet Map:** Menyediakan peta interaktif modern.
* **Penanda Cerita:** Lokasi cerita ditampilkan sebagai marker.
* **Pemilihan Lokasi:** Klik peta untuk menentukan titik lokasi.
* **Gunakan Lokasi Pengguna:** Mendukung geolokasi perangkat.

### 💽 Penyimpanan IndexedDB

* **Data Offline:** Cerita dan favorit tetap bisa dibuka tanpa internet.
* **Manajemen Data Lengkap:** Tambah, baca, ubah, dan hapus data favorit.
* **Pencarian & Filter:** Cari cerita berdasarkan kata kunci atau kategori.
* **Pengurutan Data:** Urutkan berdasarkan nama, waktu unggah, dan lainnya.
* **Sinkronisasi Otomatis:** Data offline dikirim ke server saat koneksi kembali.

### 🔁 Sinkronisasi Latar Belakang

* **Tetap Bisa Menulis Offline:** Cerita tetap dapat dibuat tanpa koneksi.
* **Auto Sync:** Data dikirim otomatis ke server ketika online.
* **Penanda Status:** Menampilkan status proses sinkronisasi.
* **Retry Otomatis:** Sistem mencoba ulang jika terjadi kegagalan sync.

### ⭐ Sistem Favorit

* **Tambah ke Favorit:** Simpan cerita favorit Anda.
* **Tersimpan Secara Lokal:** Favorit tetap aman di IndexedDB.
* **Ekspor Data:** Simpan daftar favorit menjadi file JSON.
* **Filter Lanjutan:** Temukan favorit berdasarkan lokasi, tanggal, dan parameter lain.

## 🧰 Teknologi

* **JavaScript ES6+**
* **Vite sebagai Build Tool**
* **CSS modern dengan variabel**
* **Leaflet untuk peta**
* **Axios untuk HTTP request**
* **IndexedDB untuk data offline**
* **Service Worker & Web Manifest**
* **Web Push API + VAPID**

## ⚙️ Instalasi & Pengembangan

### Yang Dibutuhkan

* Node.js versi 18+
* npm atau yarn

### Cara Menjalankan

```bash
git clone [repository-url]
cd story-explorer-pwa
npm install
npm run dev
npm run build
npm run preview
```


