export * from './assets';
export * from './config';
export * from './dom';

export const deepCopy = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));