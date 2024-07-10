import { Application } from "pixi.js";

declare global {
	interface Window {
		renderer: Application;
	}
}