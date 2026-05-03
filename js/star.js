// star.js - ☆スター管理

class Star {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.collected = false;
    this.animFrame = 0;
  }

  // プレイヤーとの当たり判定
  update(player) {
    if (this.collected) return;
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 14) {
      this.collected = true;
      return true; // 取得した
    }
    return false;
  }

  // きらめきアニメーション付きで描画
  render(ctx, frameCount) {
    if (this.collected) return;

    // きらめきエフェクト（サイズが少し変わる）
    const pulse = Math.sin(frameCount * 0.1) * 2;
    const size = 8 + pulse;

    ctx.save();
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 6 + pulse;

    // ☆を描画（5角形）
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const x = this.x + Math.cos(angle) * size;
      const y = this.y + Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
