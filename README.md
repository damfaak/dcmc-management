# DCMC Management — Vercel

Aplikasi internal GTA RP dengan Next.js, Vercel, dan database libSQL/Turso.
Versi ini **mulai kosong**: tidak ada player, item, stok, saldo, setoran, target, atau transaksi demo.
Hanya profil Owner (dan Member jika dipilih), role, permission, serta nama channel Discord yang dibuat saat login pertama.

## Persiapan

1. Buat project Vercel bernama `dcmc-management` dari folder/repository ini. Nama domain tergantung ketersediaan.
2. Hubungkan database **libSQL** Turso melalui Marketplace Vercel atau akun Turso. Jangan pilih engine yang tidak mendukung libSQL client.
3. Atur Environment Variables di Vercel, sesuai `.env.example`:
   - `TURSO_DATABASE_URL`: URL database remote.
   - `TURSO_AUTH_TOKEN`: token database, hanya di server.
   - `SETUP_OWNER_PIN`: 4 angka untuk PIN Owner awal, wajib; tidak ada PIN default.
   - `SETUP_MEMBER_PIN`: opsional, 4 angka berbeda dari Owner.
   - `DISCORD_SETORAN_WEBHOOK`, `DISCORD_DEPOSIT_WEBHOOK`, `DISCORD_WITHDRAW_WEBHOOK`, `DISCORD_INVENTORY_WEBHOOK`, `DISCORD_TRANSACTION_WEBHOOK`, dan `DISCORD_ALERTS_WEBHOOK`: opsional; isi hanya untuk channel yang digunakan.
4. Terapkan schema ke database target: simpan nilai environment yang sama ke `.env.local`, lalu jalankan `pnpm db:migrate`. File ini tidak boleh masuk Git.
5. Deploy dengan framework Next.js, build `pnpm build`, Node.js 24.
6. Login dengan PIN Owner yang dipilih. Buat player/item dan masukkan transaksi pertama dari aplikasi.
7. Setelah profil Owner terbentuk, hapus `SETUP_OWNER_PIN` dan `SETUP_MEMBER_PIN` dari environment dan redeploy. Profil yang sudah ada tidak berubah atau dibuat ulang.

Database schema dibuat dengan migrasi, bukan otomatis saat build. Menjalankan `db:migrate` kembali aman; checksum mencegah modifikasi migrasi yang sudah diterapkan. Pembuatan schema tidak mengisi data bisnis.

## Perintah

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm dev
```

Untuk pemeriksaan:

```sh
pnpm build
pnpm test
```

Test memakai database sementara di komputer dan PIN khusus pengujian. Test tidak memakai database production dan tidak mengirim pesan Discord.

## Perubahan dari versi Sites

- Vinext/Cloudflare Worker diganti dengan Next.js untuk Vercel.
- D1 diganti libSQL/Turso dengan prepared statements dan transactional write batches.
- Bukti PNG/JPEG/WEBP tersimpan dalam database dan hanya disajikan setelah otorisasi. Batas 3 MB, menyesuaikan batas request fungsi hosting.
- Tidak ada seed data demo atau PIN demo.
- Tidak terhubung ke database atau penyimpanan Sites lama. Data lama tidak dihapus.
- Login berbasis session, hash PIN, role permissions, reversal dan outbox Discord dipertahankan.
- CSV tersedia; PDF melalui print browser. Tidak ada ekspor XLSX native.

## Status

Kode sudah disiapkan; deployment Vercel dan database remote perlu dikonfigurasi pada akun pemilik. ZIP ini tidak memuat credential, database pengguna, bukti transaksi, node_modules, atau hasil build.
