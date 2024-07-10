import { Application } from "pixi.js";
import { $ } from "@lib";

export const createApp = async () => {
  const app = new Application();
  await app.init({ antialias: true, resizeTo: window });
  $("#canvas").appendChild(app.canvas);
	window.renderer = app;
  return app;
};

export * from "./mino";
export * from './engine';
