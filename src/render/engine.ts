import { Engine, tetrominoes } from "@engine";
import { Application, applyMatrix, Container, Graphics } from "pixi.js";
import { createMino } from "./mino";
import { createBlank } from "./blank";

const queueSize = 5;
const queueGap = 24;
const borderSize = 2;
const boardBuffer = 4;
const droppedTint = 0xcccccc;

export class Player {
  container: Container;
  board: Container;
  blockSize: number;
  queue: Container;
  hold: Container;

  constructor(engine: Engine, blockSize: number, app: Application) {
    this.container = new Container();
    this.board = new Container();
    this.blockSize = blockSize;

    const borderGraphics = new Graphics();
    borderGraphics.rect(
      0,
      0,
      borderSize,
      engine.board.height * this.blockSize + borderSize * 2
    );
    borderGraphics.rect(
      0,
      engine.board.height * this.blockSize + borderSize,
      engine.board.width * this.blockSize + borderSize * 2,
      borderSize
    );
    borderGraphics.rect(
      engine.board.width * this.blockSize + borderSize,
      0,
      borderSize,
      engine.board.height * this.blockSize + borderSize * 2
    );
    borderGraphics.fill({ color: 0xffffff });
    borderGraphics.position.set(0, boardBuffer * this.blockSize);
    const boardWrapper = new Container();
    boardWrapper.addChild(this.board);
    boardWrapper.addChild(borderGraphics);
    boardWrapper.position.set(5 * this.blockSize + borderSize, 0);
    this.board.position.set(borderSize, borderSize);
    this.container.addChild(boardWrapper);

    this.queue = new Container();
    const queueWrapper = new Container();
    const queueGraphics = new Graphics();
    queueGraphics.rect(0, 0, 5 * this.blockSize + borderSize * 2, borderSize);
    queueGraphics.rect(
      0,
      0,
      borderSize,
      queueSize * (2 * this.blockSize) + (queueSize + 1) * queueGap + borderSize * 2
    );
    queueGraphics.rect(
      0,
      queueSize * (2 * this.blockSize) + (queueSize + 1) * queueGap + borderSize,
      5 * this.blockSize + borderSize * 2,
      borderSize
    );
    queueGraphics.rect(
      5 * this.blockSize + borderSize,
      0,
      borderSize,
      queueSize * (2 * this.blockSize) + (queueSize + 1) * queueGap + borderSize * 2
    );
    queueGraphics.fill({ color: 0xffffff });
    queueWrapper.addChild(this.queue);
    queueWrapper.addChild(queueGraphics);
    queueWrapper.position.set(
      5 * this.blockSize + borderSize + engine.board.width * this.blockSize + borderSize,
      boardBuffer * this.blockSize
    );
    this.queue.position.set(borderSize, borderSize);
    this.container.addChild(queueWrapper);

    this.hold = new Container();
    const holdWrapper = new Container();
    const holdGraphics = new Graphics();
    holdGraphics.rect(0, 0, 5 * this.blockSize + borderSize * 2, borderSize);
    holdGraphics.rect(
      0,
      0,
      borderSize,
      queueGap * 2 + 2 * this.blockSize + borderSize * 2
    );
    holdGraphics.rect(
      0,
      queueGap * 2 + 2 * this.blockSize + borderSize,
      5 * this.blockSize + borderSize * 2,
      borderSize
    );
    holdGraphics.rect(
      5 * this.blockSize + borderSize,
      0,
      borderSize,
      queueGap * 2 + 2 * this.blockSize + borderSize * 2
    );
    holdGraphics.fill({ color: 0xffffff });
    holdWrapper.addChild(holdGraphics);
    holdWrapper.addChild(this.hold);
    holdWrapper.position.set(0, boardBuffer * this.blockSize);
    this.hold.position.set(borderSize, borderSize);
    this.container.addChild(holdWrapper);

    // keep at end
    this.update(engine, app);
  }

  private updateBoard(engine: Engine) {
    this.board.removeChildren();
    const size = [
      engine.board.width * this.blockSize + borderSize * 2,
      (engine.board.height + boardBuffer) * this.blockSize + borderSize * 2,
    ] as const;

    this.board.addChild(createBlank(...size));

    // board
    for (let y = 0; y < engine.board.height; y++) {
      const row = engine.board.state[y];
      row.forEach((cell, x) => {
        if (cell) {
          const block = createMino(cell);
          block.tint = droppedTint;
          block.position.set(
            x * this.blockSize,
            (engine.board.height + boardBuffer - 1 - y) * this.blockSize
          );
          this.board.addChild(block);
        }
      });
    }

    // falling
    engine.falling.blocks.forEach((mino) => {
      const block = createMino(engine.falling.symbol);
      block.position.set(
        (engine.falling.location[0] + mino[0]) * this.blockSize,
        (engine.board.height + boardBuffer - 1 - engine.falling.location[1] + mino[1]) *
          this.blockSize
      );
      this.board.addChild(block);
    });

    // shadow
    const y = engine.falling.location[1];
    engine.softDrop();
    engine.falling.blocks.forEach((mino) => {
      const block = createMino("a");
      block.alpha = 0.4;
      block.position.set(
        (engine.falling.location[0] + mino[0]) * this.blockSize,
        (engine.board.height + boardBuffer - 1 - engine.falling.location[1] + mino[1]) *
          this.blockSize
      );
      this.board.addChild(block);
    });
    engine.falling.location[1] = y;
  }

  private updateQueue(engine: Engine) {
    this.queue.removeChildren();

    for (let i = 0; i < queueSize; i++) {
      const mino = engine.queue.value[i];
      const preview = tetrominoes[mino.toLowerCase()].preview;
      const container = new Container();
      preview.data.forEach((block) => {
        const m = createMino(mino);
        m.position.set(block[0] * this.blockSize, block[1] * this.blockSize);
        container.addChild(m);
      });
      container.position.set(
        (5 * this.blockSize) / 2 - (preview.w * this.blockSize) / 2,
        i * (2 * this.blockSize + queueGap) +
          queueGap +
          (preview.h === 1 ? this.blockSize / 2 : 0)
      );

      this.queue.addChild(container);
    }
  }

  private updateHold(engine: Engine) {
    this.hold.removeChildren();
    if (engine.held) {
      const preview = tetrominoes[engine.held.toLowerCase()].preview;
      const container = new Container();
      preview.data.forEach((block) => {
        const m = createMino(engine.held!);
        m.position.set(block[0] * this.blockSize, block[1] * this.blockSize);
        container.addChild(m);
      });
      container.position.set(
        (5 * this.blockSize) / 2 - (preview.w * this.blockSize) / 2,
        queueGap + (preview.h === 1 ? this.blockSize / 2 : 0)
      );

      this.hold.addChild(container);
    }
  }

  update(engine: Engine, app: Application) {
		app;
    this.updateBoard(engine);
    this.updateQueue(engine);
    this.updateHold(engine);
  }
}
