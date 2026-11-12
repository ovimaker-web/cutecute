import { Config } from "@remotion/cli/config";

// WebGL (Three.js) butuh renderer OpenGL di Chromium headless.
// "angle" = pakai GPU bila ada. Di server/cloud tanpa GPU, override dengan:
//   npx remotion render ... --gl=swangle
Config.setChromiumOpenGlRenderer("angle");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setCodec("h264");
Config.setCrf(18);
Config.setPixelFormat("yuv420p");
Config.setConcurrency(1);
