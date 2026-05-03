// ui.js - UI表示（ステータスバー・メニュー・ランク判定）

const UI = {
  // ゲーム中のステータスバーを描画
  renderStatusBar(ctx, game) {
    ctx.save();

    // 半透明の背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, 480, 28);

    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';

    // ステージ名
    ctx.fillText(`STAGE ${game.currentStageId}`, 8, 18);

    // タイマー
    const timeLeft = Math.max(0, Math.ceil(game.timeLeft));
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    const timeStr = `${min}:${sec.toString().padStart(2, '0')}`;
    ctx.fillStyle = timeLeft < 10 ? '#ff3860' : '#fff';
    ctx.fillText(`⏱${timeStr}`, 160, 18);

    // ☆カウント
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`⭐${game.starsCollected}/${game.totalStars}`, 270, 18);

    // ライフ
    ctx.fillStyle = '#ff3860';
    const hearts = '❤'.repeat(game.player.lives);
    ctx.fillText(hearts, 380, 18);

    ctx.restore();
  },

  // タイトル画面を描画
  renderTitle(ctx) {
    ctx.save();

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 480, 360);

    // タイトル
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.fillStyle = '#00d9ff';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00d9ff';
    ctx.shadowBlur = 10;
    ctx.fillText('ふしぎ迷宮', 240, 100);
    ctx.fillText('アドベンチャー', 240, 130);
    ctx.shadowBlur = 0;

    // 「スタート」ボタン（ホバーで光る）
    ctx.font = '11px "Press Start 2P", monospace';
    const hover = Game.hoverPos;
    const startHover = hover && hover.y >= 185 && hover.y <= 215 && hover.x >= 120 && hover.x <= 360;
    if (startHover) {
      ctx.fillStyle = '#00d9ff';
      ctx.shadowColor = '#00d9ff';
      ctx.shadowBlur = 8;
    } else {
      ctx.fillStyle = '#fff';
    }
    ctx.fillText('▶ スタート', 240, 200);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#aaa';
    ctx.fillText('記録を見る', 240, 240);
    ctx.fillText('あそびかた', 240, 270);

    // 操作案内
    ctx.font = '9px "DotGothic16", monospace';
    ctx.fillStyle = '#666';
    ctx.fillText('タップ or Enter でスタート', 240, 330);

    ctx.restore();
  },

  // ステージセレクト画面
  renderStageSelect(ctx, unlockedStages, bestRanks) {
    ctx.save();

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 480, 360);

    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = '#00d9ff';
    ctx.textAlign = 'center';
    ctx.fillText('ステージセレクト', 240, 40);

    ctx.font = '10px "Press Start 2P", monospace';
    const stageNames = ['森の入り口', '古代遺跡', '氷の洞窟', '火山', '闇の城'];
    const hover = Game.hoverPos;

    for (let i = 0; i < 5; i++) {
      const y = 80 + i * 50;
      const unlocked = unlockedStages.includes(i + 1);
      const isHover = hover && hover.y >= y - 20 && hover.y <= y + 10 && hover.x >= 60 && hover.x <= 420;

      if (unlocked) {
        // ホバー時：シアンに光る
        if (isHover) {
          ctx.fillStyle = '#00d9ff';
          ctx.shadowColor = '#00d9ff';
          ctx.shadowBlur = 10;
          // 背景ハイライト
          ctx.fillRect(60, y - 18, 360, 28);
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#1a1a2e';
        } else {
          ctx.fillStyle = '#fff';
        }
        ctx.fillText(`${i + 1}. ${stageNames[i]}`, 200, y);

        // ベストランク表示
        const rank = bestRanks[i + 1];
        if (rank) {
          if (!isHover) {
            ctx.fillStyle = rank === 'S' ? '#ffd700' : rank === 'A' ? '#00d9ff' : '#aaa';
          }
          ctx.fillText(rank, 380, y);
        }
      } else {
        // 未解放ステージ（ホバーしても選べない表示）
        if (isHover) {
          ctx.fillStyle = '#555';
        } else {
          ctx.fillStyle = '#444';
        }
        ctx.fillText(`${i + 1}. ？？？`, 200, y);
        if (isHover) {
          ctx.font = '8px "DotGothic16", monospace';
          ctx.fillStyle = '#666';
          ctx.fillText('🔒 前のステージをクリアすると解放', 240, y + 18);
          ctx.font = '10px "Press Start 2P", monospace';
        }
      }
    }

    ctx.font = '9px "DotGothic16", monospace';
    ctx.fillStyle = '#666';
    ctx.fillText('ステージをタップして選択 / 数字キー(1-5)も使えます', 240, 340);

    ctx.restore();
  },

  // クリア画面
  renderClear(ctx, rank, time, starsCollected, totalStars, isBest) {
    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, 480, 360);

    ctx.textAlign = 'center';

    // CLEAR!
    ctx.font = '18px "Press Start 2P", monospace';
    ctx.fillStyle = '#00f593';
    ctx.shadowColor = '#00f593';
    ctx.shadowBlur = 15;
    ctx.fillText('CLEAR!', 240, 80);
    ctx.shadowBlur = 0;

    // ランク
    ctx.font = '40px "Press Start 2P", monospace';
    ctx.fillStyle = rank === 'S' ? '#ffd700' : rank === 'A' ? '#00d9ff' : '#aaa';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 20;
    ctx.fillText(rank, 240, 150);
    ctx.shadowBlur = 0;

    // 詳細
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#fff';
    const timeStr = time.toFixed(1) + 's';
    ctx.fillText(`TIME: ${timeStr}`, 240, 200);
    ctx.fillText(`STAR: ${starsCollected}/${totalStars}`, 240, 225);

    if (isBest) {
      ctx.fillStyle = '#ffd700';
      ctx.fillText('★ NEW BEST! ★', 240, 260);
    }

    // 操作案内
    ctx.font = '9px "DotGothic16", monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('タップで次へ / R: リトライ / ESC: セレクト', 240, 320);

    ctx.restore();
  },

  // ゲームオーバー画面
  renderGameOver(ctx) {
    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, 480, 360);

    ctx.textAlign = 'center';
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.fillStyle = '#ff3860';
    ctx.fillText('GAME OVER', 240, 160);

    ctx.font = '9px "DotGothic16", monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('タップ or R でリトライ / ESC: セレクト', 240, 220);

    ctx.restore();
  },

  // ランク判定
  calculateRank(timeLeft, timeLimit, starsCollected, totalStars) {
    const timeRatio = timeLeft / timeLimit;
    const allStars = starsCollected === totalStars;

    if (allStars && timeRatio >= 0.5) return 'S';
    if (allStars && timeRatio >= 0.2) return 'A';
    return 'B';
  }
};
