export * from "./assets";
export * from "./config";
export * from "./dom";
export * from './imageProcessing';
export * from "./screenshot";

export const deepCopy = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));
