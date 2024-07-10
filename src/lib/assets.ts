import { Assets } from "pixi.js";

export const loadSkin = async (name: string) => {
  const raw = new Image();
  const loaded = async () => {
    if (raw.complete) return;
    return new Promise<void>((resolve) => {
      raw.onload = () => resolve();
    });
  };
  raw.src = `/skins/${name}`;
  await loaded();

  // split the image into 12 equal segemnts (x only, y stays the same)
  const segments = Array.from({ length: 12 }, (_, i) => {
    const canvas = new OffscreenCanvas(raw.width / 12, raw.height);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(raw, -i * canvas.width, 0);
    return canvas;
  });

  // convert the segments to png urls

  const urls = await Promise.all(
    segments.map(async (segment) => {
      const blob = await segment.convertToBlob({ type: "image/png" });
      return URL.createObjectURL(blob);
    })
  );

  const textures = await Promise.all(
    urls.map(async (url) => {
      const asset = await Assets.load({
        src: url,
        format: "png",
        loadParser: "loadTextures",
      });
      URL.revokeObjectURL(url);
      return asset;
    })
  );

  return textures;
};
