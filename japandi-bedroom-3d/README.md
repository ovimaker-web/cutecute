# Japandi Bedroom 3D — Transformasi Ruang Kosong → Kamar Tidur Japandi

Video animasi 3D isometrik **30 detik, 1080×1920 (9:16), 30 fps, MP4 H.264** untuk konten edukasi
desain interior (TikTok/Reels). Dibangun dengan **Remotion 4 + Three.js (React Three Fiber)**.
Semua ruangan, furnitur, dan tekstur (serat kayu oak/walnut, linen, bouclé, plester limewash)
dibuat **prosedural lewat kode** — tidak ada gambar/model 3D eksternal; setiap objek benar-benar
bergerak dalam ruang 3D dengan bayangan lembut real-time.

## Alur animasi

| Detik | Fase | Yang terjadi di 3D |
|---|---|---|
| 0–4 | Ruang kosong | Maket isometrik dinding plester + lantai beton, kamera push-in |
| 4–8 | Lantai kayu | ±80 papan oak jatuh & terkunci berurutan secara diagonal |
| 8–13 | Dinding | Dinding berubah jadi limewash beige, slat oak naik dari tengah, arch backdrop tumbuh, wainscot *wavy* "tergambar" |
| 13–17 | Plafon & LED | Bulkhead turun, strip LED tersembunyi menyapu & menyala, lampu gantung kertas bergelombang, cahaya menghangat |
| 17–24 | Furnitur | Karpet organik, bed (plinth → rangka → headboard channel → matras → duvet → bantal), nakas (laci meluncur), lemari (pintu arch mengayun), meja rias + cermin wavy + stool, tanaman |
| 24–30 | Hasil akhir | Kamera mengorbit, palet warna Japandi, CTA |

Teks edukasi (Bahasa Indonesia) ada di `src/ui/Overlay.tsx`; timing di `src/timeline.ts`;
keyframe kamera di `src/scene/Scene.tsx`.

## Struktur

```
src/
  timeline.ts          # fps, durasi, fase, easing
  Video.tsx            # ThreeCanvas + overlay teks
  scene/Scene.tsx      # kamera sinematik (spline), pencahayaan
  scene/Room.tsx       # alas, dinding, lantai papan, slat, arch, wavy, plafon & LED
  scene/Furniture.tsx  # karpet, bed, nakas, lemari, meja rias, tanaman
  scene/materials.ts   # tekstur prosedural (kayu, kain, plester) + palet
  ui/Overlay.tsx       # judul langkah, kartu tips, palet, CTA
public/fonts/          # Plus Jakarta Sans & Cormorant Garamond (SIL OFL), dibundel lokal
```

## Menjalankan di komputer

```bash
npm install
npm run dev            # Remotion Studio (preview interaktif di browser)
npm run render         # -> out/japandi-bedroom.mp4 (pakai GPU via ANGLE)
```

Tanpa GPU (server/cloud/CI), pakai renderer software:

```bash
npx remotion render src/index.ts JapandiBedroom out/japandi-bedroom.mp4 --gl=swangle --concurrency=4
```

## Render dari HP Android (tanpa komputer)

### Opsi A — GitHub Actions (disarankan, gratis)
Workflow `.github/workflows/render-japandi.yml` (di root repo) merender video di server GitHub.

1. Buka repo di browser HP (Chrome → github.com, aktifkan *Desktop site* bila perlu) atau aplikasi GitHub.
2. Tab **Actions** → **Render Japandi Bedroom MP4** → **Run workflow** (`scale` = `1` untuk 1080×1920,
   `0.5` untuk draft cepat). Workflow juga otomatis jalan setiap ada perubahan di `src/`.
3. Tunggu ±30–60 menit (render WebGL software), buka run yang selesai → bagian **Artifacts** →
   unduh `japandi-bedroom-mp4` (file .zip berisi MP4) → ekstrak dengan aplikasi Files → unggah ke TikTok.

Mengubah teks/warna dari HP: buka file (mis. `src/ui/Overlay.tsx`) di GitHub → ikon pensil → *Commit* —
render ulang berjalan otomatis.

### Opsi B — Claude Code di web/HP
Buka sesi Claude Code (claude.ai/code) dari HP dan minta render ulang; video dikirim sebagai file.

### Opsi C — Termux (lanjutan, lambat)
Remotion butuh Chromium + WebGL; di Termux hanya memungkinkan lewat `proot-distro` Ubuntu
(`pkg install proot-distro && proot-distro install ubuntu`, lalu pasang Node 22 + `npx remotion browser ensure`).
Render 900 frame di CPU HP bisa memakan beberapa jam — gunakan `--scale=0.5` untuk uji.

## Catatan render di cloud/CI
- Tidak ada GPU: wajib `--gl=swangle` (SwiftShader). Draft skala 0.35 ≈ 15 menit di 4 vCPU.
- Font dibundel lokal karena Chromium headless di balik proxy tidak bisa mengambil Google Fonts.
- Area aman TikTok: teks ditempatkan di luar ±150 px kanan (tombol) dan bawah (caption).
