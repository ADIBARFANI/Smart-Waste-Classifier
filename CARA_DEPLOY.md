# Cara Deploy Backend (Cloudflare Worker)

Ikuti langkah-langkah berikut agar AI sungguhan aktif di aplikasi.

## 1. Buat Akun Cloudflare (gratis)

- Buka https://dash.cloudflare.com
- Daftar / login

## 2. Buat Worker Baru

1. Di dashboard Cloudflare, pilih **Workers & Pages**
2. Klik **Create** → **Create Worker**
3. Beri nama (contoh: `smart-waste-ai`)
4. Klik **Deploy**

## 3. Masukkan Kode

1. Setelah Worker dibuat, klik **Edit code**
2. Hapus semua kode default
3. Salin seluruh isi file `worker.js` lalu tempel
4. Klik **Save and Deploy**

## 4. Simpan API Key Gemini (rahasia)

1. Masih di halaman Worker, buka tab **Settings**
2. Pilih **Variables and Secrets**
3. Klik **Add** → pilih **Secret**
4. Nama: `GEMINI_API_KEY`
5. Value: tempel API Key Gemini milikmu
6. Klik **Save**

> Dapatkan API Key gratis di: https://aistudio.google.com/apikey

## 5. Salin URL Worker

Setelah deploy, kamu akan mendapat URL seperti:

```
https://smart-waste-ai.nama-akunmu.workers.dev
```

## 6. Masukkan URL ke Aplikasi

Buka file `js/classification.js`, cari baris ini:

```js
const WORKER_URL = 'https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev';
```

Ganti dengan URL Worker-mu, contoh:

```js
const WORKER_URL = 'https://smart-waste-ai.nama-akunmu.workers.dev';
```

Simpan, lalu upload ulang file `classification.js` ke GitHub.

---

Selesai!  
Sekarang aplikasi akan menggunakan AI sungguhan secara aman, tanpa menampilkan API Key ke pengunjung.
