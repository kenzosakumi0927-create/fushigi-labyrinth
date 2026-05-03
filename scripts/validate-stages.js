// validate-stages.js - ステージの到達可能性を検証するスクリプト
// BFSで全☆・ゴールへの到達可能性をチェック

const fs = require('fs');
const path = require('path');

const stagesPath = path.join(__dirname, '..', 'data', 'stages.json');
const data = JSON.parse(fs.readFileSync(stagesPath, 'utf-8'));

const EXPECTED_COLS = 20;
const EXPECTED_ROWS = 15;

let hasError = false;

for (const stage of data.stages) {
  console.log(`\n--- Stage ${stage.id}: ${stage.name} ---`);

  const layout = stage.layout;

  // 行数チェック
  if (layout.length !== EXPECTED_ROWS) {
    console.log(`  ❌ 行数が${layout.length}行（期待値: ${EXPECTED_ROWS}行）`);
    hasError = true;
  }

  // 列数チェック
  for (let r = 0; r < layout.length; r++) {
    if (layout[r].length !== EXPECTED_COLS) {
      console.log(`  ❌ 行${r}の列数が${layout[r].length}（期待値: ${EXPECTED_COLS}）: "${layout[r]}"`);
      hasError = true;
    }
  }

  // マップ解析：特殊マスの位置を取得
  let playerStart = null;
  let goal = null;
  const stars = [];
  const keys = [];
  const doors = [];

  for (let r = 0; r < layout.length; r++) {
    for (let c = 0; c < layout[r].length; c++) {
      const ch = layout[r][c];
      if (ch === 'P') playerStart = { row: r, col: c };
      if (ch === 'G') goal = { row: r, col: c };
      if (ch === 'S') stars.push({ row: r, col: c });
      if (ch === 'K') keys.push({ row: r, col: c });
      if (ch === 'D') doors.push({ row: r, col: c });
    }
  }

  if (!playerStart) {
    console.log('  ❌ プレイヤースタート(P)が見つかりません');
    hasError = true;
    continue;
  }
  if (!goal) {
    console.log('  ❌ ゴール(G)が見つかりません');
    hasError = true;
    continue;
  }

  // BFS: 到達可能マスを探索
  // doorPassable=false: カギなしで到達可能な範囲
  // doorPassable=true: 扉を通過可能として探索（カギ取得後）
  function bfs(start, doorPassable) {
    const visited = new Set();
    const queue = [start];
    visited.add(`${start.row},${start.col}`);

    while (queue.length > 0) {
      const { row, col } = queue.shift();
      const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

      for (const [dr, dc] of directions) {
        const nr = row + dr;
        const nc = col + dc;
        const key = `${nr},${nc}`;

        if (nr < 0 || nr >= layout.length || nc < 0 || nc >= (layout[nr] || '').length) continue;
        if (visited.has(key)) continue;

        const tile = layout[nr][nc];
        if (tile === 'W') continue;
        if (tile === 'D' && !doorPassable) continue;

        visited.add(key);
        queue.push({ row: nr, col: nc });
      }
    }

    return visited;
  }

  // まずカギなしで探索
  const reachableWithoutDoor = bfs(playerStart, false);

  // カギに到達可能か確認
  let canGetKey = true;
  for (const k of keys) {
    if (!reachableWithoutDoor.has(`${k.row},${k.col}`)) {
      console.log(`  ❌ カギ(K) at (${k.col},${k.row}) に到達不能（扉なし経路）`);
      hasError = true;
      canGetKey = false;
    }
  }

  // カギ取得後（扉通過可能）で最終的な到達可能性チェック
  const hasDoors = doors.length > 0;
  const reachable = (hasDoors && canGetKey) ? bfs(playerStart, true) : reachableWithoutDoor;

  // ゴール到達チェック
  if (!reachable.has(`${goal.row},${goal.col}`)) {
    console.log(`  ❌ ゴール(G) at (${goal.col},${goal.row}) に到達不能`);
    hasError = true;
  } else {
    console.log(`  ✅ ゴール(G) at (${goal.col},${goal.row}) 到達可能`);
  }

  // ☆到達チェック
  for (const star of stars) {
    if (!reachable.has(`${star.row},${star.col}`)) {
      console.log(`  ❌ スター(S) at (${star.col},${star.row}) に到達不能`);
      hasError = true;
    } else {
      console.log(`  ✅ スター(S) at (${star.col},${star.row}) 到達可能`);
    }
  }

  // 敵スポーン位置チェック（プレイヤー開始位置と重ならないか）
  const TILE_SIZE = 24;
  for (const enemy of stage.enemies) {
    const enemyCol = Math.floor(enemy.x / TILE_SIZE);
    const enemyRow = Math.floor(enemy.y / TILE_SIZE);
    if (enemyRow === playerStart.row && enemyCol === playerStart.col) {
      console.log(`  ❌ 敵がプレイヤー開始位置に重なっています: (${enemy.x},${enemy.y})`);
      hasError = true;
    }
    // 敵が壁の中にいないか
    if (enemyRow >= 0 && enemyRow < layout.length && enemyCol >= 0 && enemyCol < layout[0].length) {
      const tile = layout[enemyRow][enemyCol];
      if (tile === 'W') {
        console.log(`  ⚠️  敵が壁の中にいます: (${enemy.x},${enemy.y}) → tile[${enemyRow}][${enemyCol}]='W'`);
      }
    }
  }
}

console.log('\n' + '='.repeat(40));
if (hasError) {
  console.log('❌ 問題が見つかりました。修正が必要です。');
  process.exit(1);
} else {
  console.log('✅ 全ステージ検証OK！すべて到達可能です。');
  process.exit(0);
}
