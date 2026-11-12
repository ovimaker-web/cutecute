import { loadFont } from "@remotion/fonts";
import React from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { PHASES, clamp01 } from "../timeline";
import { PALETTE } from "../scene/materials";

// Font dibundel lokal (public/fonts, lisensi SIL OFL) agar render bisa offline
const SANS = "Plus Jakarta Sans";
const SERIF = "Cormorant Garamond";
loadFont({ family: SANS, url: staticFile("fonts/PlusJakartaSans-latin.woff2"), weight: "200 800" });
loadFont({ family: SERIF, url: staticFile("fonts/CormorantGaramond-Italic500-latin.woff2"), weight: "500", style: "italic" });

const INK = "#3a2f26";
const MUTED = "#8b7461";

type Step = {
  key: keyof typeof PHASES;
  no: string;
  title: string;
  tip: string;
  chips: string[];
};

const STEPS: Step[] = [
  {
    key: "empty",
    no: "01",
    title: "Ruang Kosong",
    tip: "Mulai dari denah: tentukan focal point — dinding tempat tidur jadi pusat desain.",
    chips: ["± 4 × 4 m", "Plafon 2,7 m"],
  },
  {
    key: "floor",
    no: "02",
    title: "Lantai Kayu Oak",
    tip: "Pasang papan searah sisi terpanjang ruangan agar terasa lebih lega. Pilih oak natural finishing matte.",
    chips: ["Engineered oak", "Lebar papan 20 cm"],
  },
  {
    key: "walls",
    no: "03",
    title: "Panel Dinding & Lengkung",
    tip: "Slat kayu vertikal memberi tekstur & kesan plafon lebih tinggi. Bentuk arch dan wavy melembutkan ruang.",
    chips: ["Slat oak", "Arch backdrop", "Wainscot wavy"],
  },
  {
    key: "ceiling",
    no: "04",
    title: "Plafon & LED Tersembunyi",
    tip: "Drop ceiling dengan LED warm white 2700–3000K menghasilkan cahaya tidak langsung yang menenangkan.",
    chips: ["LED 2700K", "Indirect light"],
  },
  {
    key: "furniture",
    no: "05",
    title: "Furnitur Low-Profile",
    tip: "Ciri khas Japandi: furnitur rendah, sudut membulat, material alami — kayu, linen, bouclé.",
    chips: ["Bed", "Nakas", "Lemari", "Meja rias"],
  },
  {
    key: "reveal",
    no: "06",
    title: "Kamar Japandi",
    tip: "Minimalis Jepang × kehangatan Skandinavia: sedikit barang, banyak tekstur, warna bumi yang tenang.",
    chips: [],
  },
];

const SWATCHES = [
  { name: "Natural Oak", c: PALETTE.oak },
  { name: "Beige", c: PALETTE.beigeWall },
  { name: "Linen", c: PALETTE.linen },
  { name: "Walnut", c: PALETTE.walnut },
  { name: "Clay", c: PALETTE.clay },
  { name: "Sage", c: PALETTE.sage },
];

const ease = Easing.bezier(0.22, 1, 0.36, 1);

const StepBlock: React.FC<{ step: Step; frame: number }> = ({ step, frame }) => {
  const { from, to } = PHASES[step.key];
  const isLast = step.key === "reveal";
  const inP = interpolate(frame, [from + 2, from + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const outP = isLast ? 0 : interpolate(frame, [to - 12, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  if (frame < from || frame > to) return null;
  const vis = inP * (1 - outP);
  const tipP = interpolate(frame, [from + 12, from + 32], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

  return (
    <>
      {/* Judul langkah */}
      <div style={{ position: "absolute", top: 210, left: 64, right: 64, opacity: vis, transform: `translateY(${(1 - inP) * 40 - outP * 20}px)` }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 120, lineHeight: 1, color: PALETTE.oakDark, fontWeight: 500 }}>{step.no}</span>
          <span style={{ fontFamily: SANS, fontSize: 30, letterSpacing: 6, color: MUTED, fontWeight: 700 }}>LANGKAH {step.no} / 06</span>
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 70, color: INK, lineHeight: 1.05, marginTop: 6, letterSpacing: -1.5 }}>{step.title}</div>
      </div>

      {/* Kartu tip edukasi */}
      <div
        style={{
          position: "absolute",
          left: 56,
          right: 150,
          top: 1330,
          padding: "30px 34px",
          borderRadius: 34,
          background: "rgba(255,251,245,0.86)",
          boxShadow: "0 18px 50px rgba(80,55,30,0.16)",
          border: "1px solid rgba(160,130,100,0.18)",
          opacity: tipP * (1 - outP),
          transform: `translateY(${(1 - tipP) * 50}px)`,
        }}
      >
        <div style={{ fontFamily: SANS, fontSize: 24, fontWeight: 800, letterSpacing: 4, color: PALETTE.clay, marginBottom: 12 }}>
          {isLast ? "RUMUS JAPANDI" : "TIPS DESAINER"}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 37, lineHeight: 1.35, color: INK, fontWeight: 500 }}>{step.tip}</div>
        {step.chips.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 20 }}>
            {step.chips.map((c, i) => {
              const cp = clamp01((frame - from - 22 - i * 4) / 12);
              return (
                <span
                  key={c}
                  style={{
                    fontFamily: SANS,
                    fontSize: 25,
                    fontWeight: 700,
                    color: "#6b5543",
                    background: "#efe4d4",
                    padding: "9px 18px",
                    borderRadius: 999,
                    opacity: cp,
                    transform: `scale(${0.8 + cp * 0.2})`,
                  }}
                >
                  {c}
                </span>
              );
            })}
          </div>
        )}
        {isLast && <Swatches frame={frame - from} />}
      </div>
    </>
  );
};

const Swatches: React.FC<{ frame: number }> = ({ frame }) => (
  <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
    {SWATCHES.map((s, i) => {
      const p = clamp01((frame - 30 - i * 5) / 14);
      return (
        <div key={s.name} style={{ textAlign: "center", opacity: p, transform: `translateY(${(1 - p) * 24}px)` }}>
          <div style={{ width: 84, height: 84, borderRadius: 42, background: s.c, boxShadow: "inset 0 -6px 14px rgba(0,0,0,0.12), 0 6px 14px rgba(80,55,30,0.15)" }} />
          <div style={{ fontFamily: SANS, fontSize: 19, fontWeight: 700, color: MUTED, marginTop: 8 }}>{s.name}</div>
        </div>
      );
    })}
  </div>
);

export const Overlay: React.FC = () => {
  const frame = useCurrentFrame();
  const phaseList = STEPS.map((s) => PHASES[s.key]);
  const headerIn = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp", easing: ease });
  const ctaP = interpolate(frame, [820, 845], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* progress bar 6 segmen */}
      <div style={{ position: "absolute", top: 120, left: 64, right: 64, display: "flex", gap: 10, opacity: headerIn }}>
        {phaseList.map((p, i) => {
          const fill = clamp01((frame - p.from) / (p.to - p.from));
          return (
            <div key={i} style={{ flex: 1, height: 7, borderRadius: 4, background: "rgba(120,95,70,0.18)", overflow: "hidden" }}>
              <div style={{ width: `${fill * 100}%`, height: "100%", background: PALETTE.oakDark }} />
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 150, left: 64, fontFamily: SANS, fontSize: 26, fontWeight: 700, letterSpacing: 5, color: MUTED, opacity: headerIn }}>
        TRANSFORMASI INTERIOR · JAPANDI
      </div>

      {STEPS.map((s) => (
        <StepBlock key={s.key} step={s} frame={frame} />
      ))}

      {/* CTA penutup */}
      <div
        style={{
          position: "absolute",
          left: 56,
          right: 150,
          top: 1700,
          opacity: ctaP,
          transform: `translateY(${(1 - ctaP) * 30}px)`,
          fontFamily: SANS,
          fontSize: 32,
          fontWeight: 700,
          color: "#fff",
          background: INK,
          borderRadius: 999,
          padding: "22px 34px",
          textAlign: "center",
        }}
      >
        Simpan untuk inspirasi kamarmu ✦
      </div>
    </AbsoluteFill>
  );
};
