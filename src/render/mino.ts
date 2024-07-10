import { config } from "@lib";
import { Sprite, Texture } from "pixi.js";

const order = "zlosijtwgabx";

export const createMino = (mino: string, textures?: Texture[]) => {
  const texturePack = textures || config.texture;

  const idx = order.indexOf(mino.toLowerCase());

  const texture = texturePack[idx];

  const sprite = new Sprite(texture);
  // sprite.anchor.set(0.5);
  return sprite;
};
