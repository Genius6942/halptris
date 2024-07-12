import { $ } from "./dom";

export const screenshot = async () => {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    audio: false,
    video: {
      width: screen.width * (window.devicePixelRatio || 1),
      height: screen.height * (window.devicePixelRatio || 1),
      frameRate: 1,
    },
  });
  const video = document.createElement("video");
  const canvas = await new Promise<HTMLCanvasElement>((res) => {
    video.onloadedmetadata = () => {
      video.play();
      video.pause();
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      res(canvas);
    };
    video.srcObject = stream;
  });
  stream.getTracks().forEach((track) => track.stop());
  const blob = await new Promise<Blob>((res) =>
    canvas.toBlob((blob) => res(blob!), "image/jpeg", 0.95)
  );

  const maxWidth = window.innerWidth;
  const maxHeight = window.innerHeight;

  return await new Promise<{
    width: number;
    height: number;
    draw: Parameters<CanvasRenderingContext2D["drawImage"]>;
  }>((resolve, reject) => {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement("canvas");
      const scale = Math.min(
        1,
        maxWidth ? maxWidth / img.width : 1,
        maxHeight ? maxHeight / img.height : 1
      );
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      resolve({
        width: canvas.width,
        height: canvas.height,
        draw: [
          img,
          0,
          0,
          img.width,
          img.height,
          0,
          0,
          canvas.width,
          canvas.height,
        ] as const,
      });
    };
    img.onerror = () => {
      reject(new Error("Error load blob to Image"));
    };
    img.src = URL.createObjectURL(blob);
  });
};

export const selectScreenshot = async () => {
  const { width, height, draw } = await screenshot();
  const container = $("#screenshot");
  container.classList.remove("hidden");
  container.classList.add("flex");
  const canvas = document.createElement("canvas");
  container.appendChild(canvas);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(...draw);

  const coverOpacity = 0.7;

  let cover: null | [[number, number], [number, number]] = null;

  const mousedown = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < 0 || y < 0 || x > width || y > height) return;
    cover = [
      [x, y],
      [x, y],
    ];
  };

  const mousemove = (e: MouseEvent) => {
    if (cover === null) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(height, e.clientY - rect.top));
    cover = [cover[0], [x, y]];
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(...draw);
    ctx.fillStyle = "black";
    ctx.globalAlpha = coverOpacity;
    ctx.fillRect(0, 0, width, cover[0][1]);
    ctx.fillRect(0, cover[1][1], width, height);
    ctx.fillRect(0, cover[0][1], cover[0][0], cover[1][1] - cover[0][1]);
    ctx.fillRect(
      cover[1][0],
      cover[0][1],
      width - cover[1][0],
      cover[1][1] - cover[0][1]
    );

    ctx.globalAlpha = 1;

    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      cover[0][0],
      cover[0][1],
      cover[1][0] - cover[0][0],
      cover[1][1] - cover[0][1]
    );
  };

  return await new Promise<ImageData>((resolve) => {
    const mouseup = () => {
      if (cover === null) return;
      const [start, end] = cover;
      const x = Math.min(start[0], end[0]);
      const y = Math.min(start[1], end[1]);
      const width = Math.abs(start[0] - end[0]);
      const height = Math.abs(start[1] - end[1]);

      container.innerHTML = "";
      container.classList.remove("flex");
      container.classList.add("hidden");

      canvas.removeEventListener("mousedown", mousedown);
      document.removeEventListener("mousemove", mousemove);
      document.removeEventListener("mouseup", mouseup);

      resolve(ctx.getImageData(x, y, width, height));
    };

    canvas.addEventListener("mousedown", mousedown);
    document.addEventListener("mousemove", mousemove);
    document.addEventListener("mouseup", mouseup);
  });
};
