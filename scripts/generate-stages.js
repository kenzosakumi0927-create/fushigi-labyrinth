// generate-stages.js - 自動生成＆検証
// 到達可能性を保証した20x15のステージを生成
const fs = require('fs');
const path = require('path');

const COLS = 20;
const ROWS = 15;

// グリッドを壁で初期化
function createGrid() {
  return Array.from({length: ROWS}, () => Array(COLS).fill('W'));
}

// BFS到達確認
function bfs(grid, startR, startC, doorPassable) {
  const visited = new Set();
  const queue = [{r: startR, c: startC}];
  visited.add(`${startR},${startC}`);
  while (queue.length > 0) {
    const {r, c} = queue.shift();
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      const key = `${nr},${nc}`;
      if (visited.has(key)) continue;
      const t = grid[nr][nc];
      if (t === 'W') continue;
      if (t === 'D' && !doorPassable) continue;
      visited.add(key);
      queue.push({r: nr, c: nc});
    }
  }
  return visited;
}

// ランダムシャッフル
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// DFSで迷路を掘る（ランダム化Prim風）
function carveMaze(grid, startR, startC) {
  grid[startR][startC] = '.';
  const walls = [];

  function addWalls(r, c) {
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = r + dr * 2, nc = c + dc * 2;
      if (nr > 0 && nr < ROWS - 1 && nc > 0 && nc < COLS - 1 && grid[nr][nc] === 'W') {
        walls.push({r: nr, c: nc, mr: r + dr, mc: c + dc});
      }
    }
  }

  addWalls(startR, startC);
  shuffle(walls);

  while (walls.length > 0) {
    const idx = Math.floor(Math.random() * walls.length);
    const {r, c, mr, mc} = walls.splice(idx, 1)[0];
    if (grid[r][c] === 'W') {
      grid[mr][mc] = '.';
      grid[r][c] = '.';
      addWalls(r, c);
      shuffle(walls);
    }
  }

  // 追加パスを開けて複数ルートを作る
  for (let i = 0; i < Math.floor(ROWS * COLS * 0.08); i++) {
    const r = 1 + Math.floor(Math.random() * (ROWS - 2));
    const c = 1 + Math.floor(Math.random() * (COLS - 2));
    if (grid[r][c] === 'W') {
      // 隣に通路が2つ以上あれば開ける
      let adj = 0;
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        if (grid[r+dr] && grid[r+dr][c+dc] !== 'W') adj++;
      }
      if (adj >= 2) grid[r][c] = '.';
    }
  }
}

// 通路のセルをランダムに選ぶ
function randomPassage(grid, exclude) {
  const cells = [];
  for (let r = 1; r < ROWS - 1; r++) {
    for (let c = 1; c < COLS - 1; c++) {
      if (grid[r][c] === '.' && !exclude.some(e => e.r === r && e.c === c)) {
        cells.push({r, c});
      }
    }
  }
  return cells[Math.floor(Math.random() * cells.length)];
}

// ステージ生成
function generateStage(config) {
  let attempts = 0;
  while (attempts < 100) {
    attempts++;
    const grid = createGrid();

    // 迷路を掘る（奇数セルから開始）
    const startR = config.playerR || 1;
    const startC = config.playerC || 1;
    carveMaze(grid, startR, startC);

    // プレイヤー配置
    grid[startR][startC] = 'P';
    const exclude = [{r: startR, c: startC}];

    // ゴール配置（できるだけ遠い位置）
    const goalR = config.goalR || (ROWS - 2);
    const goalC = config.goalC || (COLS - 2);
    if (grid[goalR][goalC] === 'W') {
      // ゴール付近を開ける
      grid[goalR][goalC] = '.';
      if (grid[goalR][goalC-1] === 'W' && goalC-1 > 0) grid[goalR][goalC-1] = '.';
    }
    grid[goalR][goalC] = 'G';
    exclude.push({r: goalR, c: goalC});

    // ☆配置
    for (let i = 0; i < config.stars; i++) {
      const pos = randomPassage(grid, exclude);
      if (!pos) continue;
      grid[pos.r][pos.c] = 'S';
      exclude.push(pos);
    }

    // カギ＆扉配置
    if (config.hasDoor) {
      const keyPos = randomPassage(grid, exclude);
      if (keyPos) {
        grid[keyPos.r][keyPos.c] = 'K';
        exclude.push(keyPos);
      }
      // 扉はゴール付近の通路に配置
      let doorPlaced = false;
      for (let r = ROWS - 4; r < ROWS - 1 && !doorPlaced; r++) {
        for (let c = COLS - 6; c < COLS - 1 && !doorPlaced; c++) {
          if (grid[r][c] === '.' && !exclude.some(e => e.r === r && e.c === c)) {
            grid[r][c] = 'D';
            exclude.push({r, c});
            doorPlaced = true;
          }
        }
      }
    }

    // 検証
    const layout = grid.map(row => row.join(''));
    const hasDoor = layout.some(r => r.includes('D'));
    const reach1 = bfs(grid, startR, startC, false);

    // カギ到達確認
    let keyOk = true;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c] === 'K' && !reach1.has(`${r},${c}`)) keyOk = false;
      }
    }
    if (!keyOk) continue;

    const reach = hasDoor ? bfs(grid, startR, startC, true) : reach1;

    // 全オブジェクト到達確認
    let valid = true;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = grid[r][c];
        if ((ch === 'G' || ch === 'S') && !reach.has(`${r},${c}`)) {
          valid = false;
          break;
        }
      }
      if (!valid) break;
    }

    if (valid) return layout;
  }
  throw new Error('Failed to generate valid stage');
}

// 固定シード用の擬似乱数（再現性のため）
let seed = 42;
const origRandom = Math.random;
Math.random = function() {
  seed = (seed * 1664525 + 1013904223) & 0xFFFFFFFF;
  return (seed >>> 0) / 0xFFFFFFFF;
};

// ステージ設定
const configs = [
  { stars: 3, hasDoor: false, playerR: 1, playerC: 1, goalR: 13, goalC: 18 },
  { stars: 3, hasDoor: false, playerR: 1, playerC: 1, goalR: 13, goalC: 18 },
  { stars: 3, hasDoor: true,  playerR: 1, playerC: 1, goalR: 13, goalC: 18 },
  { stars: 3, hasDoor: false, playerR: 1, playerC: 1, goalR: 13, goalC: 18 },
  { stars: 4, hasDoor: true,  playerR: 1, playerC: 1, goalR: 13, goalC: 18 },
];

const stageNames = ['森の入り口', '古代遺跡', '氷の洞窟', '火山', '闇の城'];
const timeLimits = [60, 90, 120, 120, 150];

const enemyConfigs = [
  [],
  [
    { type: "patrol", x: 204, y: 156, range: 72 },
    { type: "patrol", x: 324, y: 252, range: 48 }
  ],
  [
    { type: "patrol", x: 156, y: 180, range: 48 },
    { type: "chase", x: 300, y: 84, range: 0 }
  ],
  [
    { type: "patrol", x: 204, y: 180, range: 72 },
    { type: "patrol", x: 276, y: 252, range: 48 },
    { type: "chase", x: 108, y: 228, range: 0 },
    { type: "chase", x: 324, y: 108, range: 0 }
  ],
  [
    { type: "patrol", x: 132, y: 180, range: 48 },
    { type: "patrol", x: 276, y: 252, range: 60 },
    { type: "chase", x: 108, y: 300, range: 0 },
    { type: "chase", x: 300, y: 84, range: 0 },
    { type: "chase", x: 372, y: 180, range: 0 }
  ]
];

console.log('Generating stages...\n');

const generatedStages = [];
for (let i = 0; i < configs.length; i++) {
  seed = 42 + i * 1000; // 各ステージで異なるシード
  const layout = generateStage(configs[i]);

  // サイズ確認
  let sizeOk = true;
  for (let r = 0; r < layout.length; r++) {
    if (layout[r].length !== COLS) {
      console.error(`Stage ${i+1} Row ${r}: ${layout[r].length} chars`);
      sizeOk = false;
    }
  }

  if (!sizeOk) {
    console.error(`Stage ${i+1}: Size error`);
    process.exit(1);
  }

  // 敵位置を通路に調整
  const adjustedEnemies = enemyConfigs[i].map(e => {
    let er = Math.floor(e.y / 24);
    let ec = Math.floor(e.x / 24);
    // 壁にいる場合、近くの通路に移動
    if (layout[er][ec] === 'W' || layout[er][ec] === 'P') {
      let found = false;
      for (let dr = -2; dr <= 2 && !found; dr++) {
        for (let dc = -2; dc <= 2 && !found; dc++) {
          const nr = er + dr, nc = ec + dc;
          if (nr > 0 && nr < ROWS-1 && nc > 0 && nc < COLS-1) {
            if (layout[nr][nc] === '.') {
              er = nr; ec = nc;
              found = true;
            }
          }
        }
      }
    }
    return { ...e, x: ec * 24 + 12, y: er * 24 + 12 };
  });

  generatedStages.push({
    id: i + 1,
    name: stageNames[i],
    timeLimit: timeLimits[i],
    layout: layout,
    enemies: adjustedEnemies
  });

  console.log(`✅ Stage ${i+1} (${stageNames[i]}): Generated & validated`);
}

// 最終検証
Math.random = origRandom;
console.log('\nFinal validation...');
let allOk = true;
for (const stage of generatedStages) {
  const grid = stage.layout.map(r => r.split(''));
  const hasDoor = stage.layout.some(r => r.includes('D'));

  let pR, pC;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (grid[r][c] === 'P') { pR = r; pC = c; }
  }

  const reach1 = bfs(grid, pR, pC, false);
  // カギ確認
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (grid[r][c] === 'K' && !reach1.has(`${r},${c}`)) {
      console.error(`  Stage ${stage.id}: Key unreachable`);
      allOk = false;
    }
  }
  const reach = hasDoor ? bfs(grid, pR, pC, true) : reach1;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if ((grid[r][c] === 'G' || grid[r][c] === 'S') && !reach.has(`${r},${c}`)) {
      console.error(`  Stage ${stage.id}: ${grid[r][c]} at (${c},${r}) unreachable`);
      allOk = false;
    }
  }

  // 敵位置確認
  for (const e of stage.enemies) {
    const er = Math.floor(e.y / 24);
    const ec = Math.floor(e.x / 24);
    if (grid[er] && grid[er][ec] === 'W') {
      console.error(`  Stage ${stage.id}: Enemy in wall at (${e.x},${e.y})`);
      allOk = false;
    }
  }
}

if (!allOk) {
  console.error('\n❌ Final validation failed.');
  process.exit(1);
}

const outPath = path.join(__dirname, '..', 'data', 'stages.json');
fs.writeFileSync(outPath, JSON.stringify({stages: generatedStages}, null, 2));
console.log(`\n✅ All 5 stages valid! Written to data/stages.json`);
