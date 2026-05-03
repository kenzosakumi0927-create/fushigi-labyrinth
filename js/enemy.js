// enemy.js - 敵スプライト

class Enemy {
  constructor(type, x, y, range) {
    this.type = type;       // 'patrol' or 'chase'
    this.x = x;
    this.y = y;
    this.speed = type === 'chase' ? 1.5 : 2;
    this.direction = 1;     // 1 = 右/下, -1 = 左/上
    this.startX = x;
    this.startY = y;
    this.range = range || 80;
    this.animFrame = 0;
  }

  // 毎フレーム更新
  update(player, stage) {
    this.animFrame++;

    if (this.type === 'patrol') {
      this._patrol();
    } else if (this.type === 'chase') {
      this._chase(player, stage);
    }
  }

  // 巡回型：左右に往復
  _patrol() {
    this.x += this.speed * this.direction;
    // 範囲の端で反転
    if (Math.abs(this.x - this.startX) > this.range) {
      this.direction *= -1;
    }
  }

  // 追跡型：プレイヤーに向かって移動
  _chase(player, stage) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 150) {
      // プレイヤーが近いと追跡
      const nx = dx / dist;
      const ny = dy / dist;
      const newX = this.x + nx * this.speed;
      const newY = this.y + ny * this.speed;

      // 壁判定付きで移動
      const testObj = { x: newX, y: this.y };
      if (!stage.isWallCollision(testObj)) this.x = newX;

      testObj.x = this.x;
      testObj.y = newY;
      if (!stage.isWallCollision(testObj)) this.y = newY;
    }
  }

  // プレイヤーとの衝突判定
  checkCollision(player) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < 16;
  }

  // 描画
  render(ctx) {
    // 敵本体（赤い丸＋目）
    ctx.save();
    ctx.fillStyle = '#ff3860';
    ctx.shadowColor = '#ff3860';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 目
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x - 3, this.y - 2, 3, 0, Math.PI * 2);
    ctx.arc(this.x + 3, this.y - 2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(this.x - 3, this.y - 2, 1.5, 0, Math.PI * 2);
    ctx.arc(this.x + 3, this.y - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
