import { BoardSquare } from "@engine";

type Color = BoardSquare;

// const getAverageColor = (imageData: ImageData, startX: number, startY: number, width: number, height: number): number[] => {
//   const { data } = imageData;
//   let r = 0, g = 0, b = 0;
//   let count = 0;

//   for (let y = startY; y < startY + height; y++) {
//     for (let x = startX; x < startX + width; x++) {
//       const index = (y * imageData.width + x) * 4;
//       r += data[index];
//       g += data[index + 1];
//       b += data[index + 2];
//       count++;
//     }
//   }

//   return [Math.floor(r / count), Math.floor(g / count), Math.floor(b / count)];
// };

const getMedianColor = (
  imageData: ImageData,
  startX: number,
  startY: number,
  width: number,
  height: number
) => {
  const { data } = imageData;
  const pixels = [];

  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      const index = (y * imageData.width + x) * 4;
      const color = [data[index], data[index + 1], data[index + 2]];
      pixels.push(color);
    }
  }

  const medianIndex = Math.floor(pixels.length / 2);
  const rValues = pixels.map((color) => color[0]);
  const gValues = pixels.map((color) => color[1]);
  const bValues = pixels.map((color) => color[2]);

  rValues.sort((a, b) => a - b);
  gValues.sort((a, b) => a - b);
  bValues.sort((a, b) => a - b);

  const medianColor = [
    rValues[medianIndex],
    gValues[medianIndex],
    bValues[medianIndex],
  ] as const;

  return medianColor;
};

const rgbToHsv = (r: number, g: number, b: number) => {
  let v = Math.max(r, g, b),
    c = v - Math.min(r, g, b);
  let h = c && (v == r ? (g - b) / c : v == g ? 2 + (b - r) / c : 4 + (r - g) / c);
  return [60 * (h < 0 ? h + 6 : h), v && c / v, v] as const;
};

const nearestColor = (h: number, s: number, v: number): Color => {
  const r = (a: number, b: number, c: number) => {
    return a >= b && a <= c;
  };

  if (r(s, 0, 1) && (r(v, 133, 135) || r(v, 63, 88))) return "G"; // attempted manual override specifically for four.lol idk
  if (r(h, 220, 225) && r(s, 0, 0.2) && v == 65) return null;

  if (s <= 0.2 && v / 2.55 >= 55) return "G";
  if (v / 2.55 <= 55) return null;

  if (r(h, 0, 16) || r(h, 325, 360)) return "Z";
  else if (r(h, 16, 39)) return "L";
  else if (r(h, 39, 70)) return "O";
  else if (r(h, 70, 149)) return "S";
  else if (r(h, 149, 200)) return "I";
  else if (r(h, 200, 266)) return "J";
  else if (r(h, 266, 325)) return "T";
  return null;
};

export const getColorGrid = (imageData: ImageData, cols: number): Color[][] => {
  const colSize = imageData.width / cols;
  const rows = Math.round(imageData.height / colSize);
  const squareWidth = imageData.width / cols;
  const squareHeight = imageData.height / rows;

  const colorGrid: Color[][] = [];

  for (let row = 0; row < rows; row++) {
    const rowColors: Color[] = [];
    for (let col = 0; col < cols; col++) {
      const medianColor = getMedianColor(
        imageData,
        Math.floor(col * squareWidth),
        Math.floor(row * squareHeight),
        Math.floor(squareWidth),
        Math.floor(squareHeight)
      );
      const hsv = rgbToHsv(...medianColor);
      const color = nearestColor(...hsv);
      rowColors.push(color);
    }
    colorGrid.push(rowColors);
  }

  return colorGrid;
};
