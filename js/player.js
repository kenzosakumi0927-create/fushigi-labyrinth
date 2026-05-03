// player.js - プレイヤースプライト

const PLAYER_SPEED = 3;

class Player {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.speed = PLAYER_SPEED;
    this.direction = 'down';
    this.lives = 3;
    this.animFrame = 0;
  }

  // スタート位置に配置
  spawn(startPos) {
    this.x = startPos.x;
    this.y = startPos.y;
  }

  // 毎フレーム更新（入力を読んで移動）
  update(stage) {
    let dx = 0;
    let dy = 0;

    if (Input.isPressed('ArrowUp')) { dy = -this.speed; this.direction = 'up'; }
    if (Input.isPressed('ArrowDown')) { dy = this.speed; this.direction = 'down'; }
    if (Input.isPressed('ArrowLeft')) { dx = -this.speed; this.direction = 'left'; }
    if (Input.isPressed('ArrowRight')) { dx = this.speed; this.direction = 'right'; }

    // 斜め移動の速度補正
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }

    // 壁判定付きで移動（X軸とY軸を別々に処理）
    if (dx !== 0) {
      this.x += dx;
      if (stage.isWallCollision(this)) {
        this.x -= dx;
      }
    }
    if (dy !== 0) {
      this.y += dy;
      if (stage.isWallCollision(this)) {
        this.y -= dy;
      }
    }

    if (dx !== 0 || dy !== 0) this.animFrame++;
  }

  // リスポーン（ミス時）
  respawn(startPos) {
    this.x = startPos.x;
    this.y = startPos.y;
    this.lives--;
  }

  // 描画
  render(ctx) {
    ctx.save();

    // プレイヤー本体（シアンの丸）
    ctx.fillStyle = '#00d9ff';
    ctx.shadowColor = '#00d9ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 歩行アニメーション（方向に応じた目の位置）
    const eyeOffset = { up: [0, -3], down: [0, 3], left: [-3, 0], right: [3, 0] };
    const [ox, oy] = eyeOffset[this.direction];

    // 目
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(this.x + ox, this.y + oy, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
