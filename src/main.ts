import { getColorGrid, deepCopy } from "@lib";
import "./style.css";

import { createApp, Player } from "./render";
import { config, loadSkin, selectScreenshot } from "@lib";
import { Engine, Frame, KeyPress, randomSeed } from "@engine";
import { Container, TextStyle, Text } from "pixi.js";

(async () => {
  const app = await createApp();
  config.texture = await loadSkin("default.png");

  const engine = new Engine({
    board: { width: 10, height: 20, buffer: 20 },
    kickTable: "SRS+",
    options: {
      b2bChaining: true,
      comboTable: "multiplier",
      garbageBlocking: "combo blocking",
      garbageMultiplier: { value: 1, increase: 0.008, marginTime: 10800 },
      garbageTargetBonus: "none",
      spinBonuses: "T-spins",
      garbageAttackCap: Infinity,
    },
    queue: { minLength: 31, seed: randomSeed(), type: "7-bag" },
    garbage: {
      cap: { absolute: Infinity, increase: 0, max: 40, value: 8 },
      boardWidth: 10,
      garbage: { speed: 20, holeSize: 1 },
      messiness: { change: 1, nosame: false, timeout: 0, within: 0 },
      seed: 1700476517,
    },
    gravity: { value: 0.02, increase: 0.0025, marginTime: 3600 },
    handling: {
      arr: 0,
      das: 6,
      dcd: 0,
      sdf: 41,
      safelock: true,
      cancel: false,
      may20g: true,
    },
  });

  const wrapper = new Container();
  const player = new Player(engine, 28, app);
  wrapper.addChild(player.container);
  wrapper.scale.set(0.9, 0.9);

  const resize = () => {
    wrapper.position.set(
      window.innerWidth / 2 - wrapper.width / 2,
      window.innerHeight / 2 - wrapper.height / 2
    );
  };
  resize();
  window.addEventListener("resize", resize);

  app.stage.addChild(wrapper);

  const statsStyle = new TextStyle({ fill: 0xffffff, fontSize: 20, fontFamily: "Arial" });
  const fpsText = new Text({ text: "FPS: 0", style: statsStyle });
  fpsText.position.set(10, 10);
  app.stage.addChild(fpsText);
  const engineFpsText = new Text({ text: "Engine FPS: 0", style: statsStyle });
  engineFpsText.position.set(10, 40);
  app.stage.addChild(engineFpsText);

  const keybinds = {
    rotateCW: ["KeyX", "ArrowUp"],
    rotateCCW: ["KeyZ"],
    rotate180: ["ShiftLeft", "KeyA"],
    moveRight: ["ArrowRight"],
    moveLeft: ["ArrowLeft"],
    softDrop: ["ArrowDown"],
    hardDrop: ["Space"],
    hold: ["KeyC"],
    reset: ["KeyR"],
  };

  const frames: { last: number; queue: Frame[] } = { last: 0, queue: [] };

  const listeners: ["keydown" | "keyup", keyof typeof keybinds, () => void][] = [
    [
      "keydown",
      "reset",
      () => {
        engine.initializer.queue.seed = randomSeed();
        engine.reset();
      },
    ],
  ];

  const keydown = (e: KeyboardEvent) => {
    if (e.repeat) return;
    listeners.forEach(([type, key, cb]) => {
      if (type === "keydown" && keybinds[key].includes(e.code)) cb();
    });
    Object.keys(keybinds).forEach((key) => {
      if (keybinds[key as keyof typeof keybinds].includes(e.code))
        frames.queue.push({
          type: "keydown",
          frame: engine.frame + 1,
          data: {
            key: key as KeyPress,
            subframe:
              Math.round(
                Math.min((performance.now() - frames.last) / (1000 / 60), 0.9) * 10
              ) / 10,
          },
        });
    });
  };
  const keyup = (e: KeyboardEvent) => {
    listeners.forEach(([type, key, cb]) => {
      if (type === "keyup" && keybinds[key].includes(e.code)) cb();
    });
    Object.keys(keybinds).forEach((key) => {
      if (keybinds[key as keyof typeof keybinds].includes(e.code))
        frames.queue.push({
          type: "keyup",
          frame: engine.frame + 1,
          data: {
            key: key as KeyPress,
            subframe:
              Math.round(
                Math.min((performance.now() - frames.last) / (1000 / 60), 0.9) * 10
              ) / 10,
          },
        });
    });
  };

  window.addEventListener("keydown", keydown);
  window.addEventListener("keyup", keyup);

  const start = performance.now();

  app.ticker.add(() => {
    const targetFrame = Math.floor((performance.now() - start) / (1000 / 60));
    const needsTick = targetFrame > engine.frame;
    while (engine.frame < targetFrame)
      engine.tick(frames.queue.filter((frame) => frame.frame === engine.frame + 1));
    if (needsTick) frames.queue.splice(0, frames.queue.length);
    frames.queue.splice(0, frames.queue.length);
    frames.last = performance.now();
    fpsText.text = `FPS: ${Math.round(app.ticker.FPS)}`;
    player.update(engine, app);
  });

  document.addEventListener("keydown", async (e) => {
    if (e.code === "KeyI" && e.ctrlKey) {
      const grid = deepCopy(getColorGrid(await selectScreenshot(), 10)).reverse();
      while (grid.length < engine.board.fullHeight)
        grid.push(Array(engine.board.width).fill(0));
      engine.board.state = grid;
    }
  });
})();
