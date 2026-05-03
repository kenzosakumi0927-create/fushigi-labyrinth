// stage.js - ステージ管理・壁判定

const TILE_SIZE = 24;
const COLS = 20; // 480 / 24
const ROWS = 15; // 360 / 24

class Stage {
  constructor() {
    this.layout = [];
    this.playerStart = { x: 0, y: 0 };
    this.goalPos = { x: 0, y: 0 };
    this.starPositions = [];
    this.enemyData = [];
    this.keyPos = null;
    this.doorPos = null;
    this.keyCollected = false;
    this.timeLimit = 60;
    this.name = '';
    this.id = 0;
  }

  // ステージデータを読み込む
  load(stageData) {
    this.id = stageData.id;
    this.name = stageData.name;
    this.timeLimit = stageData.timeLimit;
    this.enemyData = stageData.enemies || [];
    this.keyCollected = false;
    this.keyPos = null;
    this.doorPos = null;
    this.starPositions = [];
    this.layout = [];

    // レイアウト文字列を解析
    for (let row = 0; row < stageData.layout.length; row++) {
      const line = stageData.layout[row];
      const tileRow = [];
      for (let col = 0; col < line.length; col++) {
        const ch = line[col];
        tileRow.push(ch);

        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;

        if (ch === 'P') this.playerStart = { x, y };
        if (ch === 'G') this.goalPos = { x, y };
        if (ch === 'S') this.starPositions.push({ x, y });
        if (ch === 'K') this.keyPos = { x, y };
        if (ch === 'D') this.doorPos = { x, y };
      }
      this.layout.push(tileRow);
    }
  }

  // 壁との衝突判定（プレイヤーの矩形が壁に重なっているか）
  isWallCollision(obj) {
    const halfSize = 10; // プレイヤーの当たり判定の半径
    const left = Math.floor((obj.x - halfSize) / TILE_SIZE);
    const right = Math.floor((obj.x + halfSize) / TILE_SIZE);
    const top = Math.floor((obj.y - halfSize) / TILE_SIZE);
    const bottom = Math.floor((obj.y + halfSize) / TILE_SIZE);

    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        if (row < 0 || row >= this.layout.length || col < 0 || col >= (this.layout[0] || []).length) {
          return true; // 画面外は壁扱い
        }
        const tile = this.layout[row][col];
        if (tile === 'W') return true;
        // 扉はカギ未取得なら壁扱い
        if (tile === 'D' && !this.keyCollected) return true;
      }
    }
    return false;
  }

  // ステージを描画
  render(ctx) {
    for (let row = 0; row < this.layout.length; row++) {
      for (let col = 0; col < this.layout[row].length; col++) {
        const tile = this.layout[row][col];
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;

        if (tile === 'W') {
          // 壁
          ctx.fillStyle = '#16213e';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          // 壁の枠線で立体感
          ctx.strokeStyle = '#0f3460';
          ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        } else {
          // 通路
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        }

        // ゴール
        if (tile === 'G') {
          ctx.fillStyle = '#00f593';
          ctx.shadowColor = '#00f593';
          ctx.shadowBlur = 8;
          ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
          ctx.shadowBlur = 0;
        }

        // カギ
        if (tile === 'K' && !this.keyCollected) {
          ctx.fillStyle = '#ff9f43';
          ctx.font = '16px serif';
          ctx.textAlign = 'center';
          ctx.fillText('🔑', x + TILE_SIZE / 2, y + TILE_SIZE / 2 + 5);
        }

        // 扉
        if (tile === 'D') {
          if (this.keyCollected) {
            // 開いた扉 → 通路として表示
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          } else {
            // 閉じた扉
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          }
        }
      }
    }
  }
}
