import { Graphics, Sprite } from "pixi.js";

export const createBlank = (width: number, height: number) => {
  // Create a Graphics object
  const graphics = new Graphics();

  // Draw a rectangle with the desired width and height
  graphics.rect(0, 0, width, height);
  graphics.fill({ alpha: 0 });

  // Generate a texture from the graphics object
  const texture = window.renderer.renderer.generateTexture(graphics);

  // Create a sprite from the texture
  const sprite = new Sprite(texture);

  return sprite;
};
