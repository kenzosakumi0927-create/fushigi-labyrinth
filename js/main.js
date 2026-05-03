// main.js - ゲームループ・初期化・状態管理

const Game = {
  // ゲーム状態
  state: 'title', // 'title', 'select', 'playing', 'clear', 'gameover'
  canvas: null,
  ctx: null,
  frameCount: 0,

  // ゲーム内オブジェクト
  player: null,
  stage: null,
  stars: [],
  enemies: [],

  // ゲーム進行データ
  currentStageId: 1,
  starsCollected: 0,
  totalStars: 0,
  timeLeft: 0,
  timeLimit: 0,
  lastTime: 0,
  clearRank: '',
  clearTime: 0,
  isBestRecord: false,

  // ステージデータ（JSON読み込み後に格納）
  stagesData: null,
  saveData: null,

  // 初期化
  async init() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    Input.init();
    this.saveData = Storage.load();

    // ステージデータ読み込み
    try {
      const res = await fetch('data/stages.json');
      this.stagesData = await res.json();
    } catch {
      console.error('ステージデータの読み込みに失敗しました');
      this.stagesData = { stages: [] };
    }

    this.player = new Player();
    this.stage = new Stage();

    // ゲームループ開始
    this.lastTime = performance.now();
    this._loop();
  },

  // メインループ
  _loop() {
    const now = performance.now();
    const delta = (now - this.lastTime) / 1000; // 秒に変換
    this.lastTime = now;
    this.frameCount++;

    this._update(delta);
    this._render();

    requestAnimationFrame(() => this._loop());
  },

  // 更新処理
  _update(delta) {
    switch (this.state) {
      case 'title':
        this._updateTitle();
        break;
      case 'select':
        this._updateSelect();
        break;
      case 'playing':
        this._updatePlaying(delta);
        break;
      case 'clear':
        this._updateClear();
        break;
      case 'gameover':
        this._updateGameOver();
        break;
    }
  },

  // 描画処理
  _render() {
    const ctx = this.ctx;
    // 画面クリア
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 480, 360);

    switch (this.state) {
      case 'title':
        UI.renderTitle(ctx);
        break;
      case 'select':
        UI.renderStageSelect(ctx, this.saveData.unlockedStages, this.saveData.bestRanks);
        break;
      case 'playing':
        this.stage.render(ctx);
        this.stars.forEach(s => s.render(ctx, this.frameCount));
        this.enemies.forEach(e => e.render(ctx));
        this.player.render(ctx);
        UI.renderStatusBar(ctx, this);
        break;
      case 'clear':
        this.stage.render(ctx);
        this.stars.forEach(s => s.render(ctx, this.frameCount));
        this.player.render(ctx);
        UI.renderClear(ctx, this.clearRank, this.clearTime, this.starsCollected, this.totalStars, this.isBestRecord);
        break;
      case 'gameover':
        this.stage.render(ctx);
        this.player.render(ctx);
        UI.renderGameOver(ctx);
        break;
    }
  },

  // --- 各画面の更新ロジック ---

  _updateTitle() {
    // Enterまたはスペースでスタート
    if (Input.isPressed('Enter') || Input.isPressed('Space')) {
      Input.keys['Enter'] = false;
      Input.keys['Space'] = false;
      this.state = 'select';
    }
  },

  _updateSelect() {
    // 数字キーでステージ選択
    for (let i = 1; i <= 5; i++) {
      if (Input.isPressed(`Digit${i}`)) {
        Input.keys[`Digit${i}`] = false;
        if (this.saveData.unlockedStages.includes(i)) {
          this._startStage(i);
        }
      }
    }
    // ESCでタイトルに戻る
    if (Input.isPressed('Escape')) {
      Input.keys['Escape'] = false;
      this.state = 'title';
    }
  },

  _updatePlaying(delta) {
    // ポーズ
    if (Input.isPressed('Space')) {
      Input.keys['Space'] = false;
      // シンプルにタイマー停止（将来ポーズ画面追加可能）
      return;
    }

    // リスタート
    if (Input.isPressed('KeyR')) {
      Input.keys['KeyR'] = false;
      this._startStage(this.currentStageId);
      return;
    }

    // タイマー更新
    this.timeLeft -= delta;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.state = 'gameover';
      return;
    }

    // プレイヤー移動
    this.player.update(this.stage);

    // ☆との当たり判定
    for (const star of this.stars) {
      if (star.update(this.player)) {
        this.starsCollected++;
      }
    }

    // カギとの判定
    if (this.stage.keyPos && !this.stage.keyCollected) {
      const dx = this.stage.keyPos.x - this.player.x;
      const dy = this.stage.keyPos.y - this.player.y;
      if (Math.sqrt(dx * dx + dy * dy) < 14) {
        this.stage.keyCollected = true;
      }
    }

    // 敵の更新＆衝突判定
    for (const enemy of this.enemies) {
      enemy.update(this.player, this.stage);
      if (enemy.checkCollision(this.player)) {
        this.player.respawn(this.stage.playerStart);
        if (this.player.lives <= 0) {
          this.state = 'gameover';
          return;
        }
      }
    }

    // ゴール判定
    const gx = this.stage.goalPos.x - this.player.x;
    const gy = this.stage.goalPos.y - this.player.y;
    if (Math.sqrt(gx * gx + gy * gy) < 14) {
      this._stageClear();
    }
  },

  _updateClear() {
    // Enter: 次のステージ
    if (Input.isPressed('Enter')) {
      Input.keys['Enter'] = false;
      const nextId = this.currentStageId + 1;
      if (nextId <= 5 && this.saveData.unlockedStages.includes(nextId)) {
        this._startStage(nextId);
      } else {
        this.state = 'select';
      }
    }
    // R: リトライ
    if (Input.isPressed('KeyR')) {
      Input.keys['KeyR'] = false;
      this._startStage(this.currentStageId);
    }
    // ESC: セレクトへ
    if (Input.isPressed('Escape')) {
      Input.keys['Escape'] = false;
      this.state = 'select';
    }
  },

  _updateGameOver() {
    if (Input.isPressed('KeyR')) {
      Input.keys['KeyR'] = false;
      this._startStage(this.currentStageId);
    }
    if (Input.isPressed('Escape')) {
      Input.keys['Escape'] = false;
      this.state = 'select';
    }
  },

  // --- ゲーム制御 ---

  // ステージ開始
  _startStage(stageId) {
    const stageData = this.stagesData.stages.find(s => s.id === stageId);
    if (!stageData) {
      console.error(`ステージ${stageId}が見つかりません`);
      this.state = 'select';
      return;
    }

    this.currentStageId = stageId;
    this.stage.load(stageData);

    // プレイヤー初期化
    this.player.lives = 3;
    this.player.spawn(this.stage.playerStart);

    // ☆を配置
    this.stars = this.stage.starPositions.map(pos => new Star(pos.x, pos.y));
    this.totalStars = this.stars.length;
    this.starsCollected = 0;

    // 敵を配置
    this.enemies = this.stage.enemyData.map(e => new Enemy(e.type, e.x, e.y, e.range));

    // タイマー
    this.timeLimit = this.stage.timeLimit;
    this.timeLeft = this.stage.timeLimit;

    this.state = 'playing';
  },

  // ステージクリア処理
  _stageClear() {
    this.clearTime = this.timeLimit - this.timeLeft;
    this.clearRank = UI.calculateRank(this.timeLeft, this.timeLimit, this.starsCollected, this.totalStars);

    // ベスト記録チェック＆更新
    this.isBestRecord = false;
    const prevBest = this.saveData.bestTimes[this.currentStageId];
    if (!prevBest || this.clearTime < prevBest) {
      this.saveData.bestTimes[this.currentStageId] = this.clearTime;
      this.isBestRecord = true;
    }

    // ランク更新（S > A > B）
    const rankOrder = { S: 3, A: 2, B: 1 };
    const prevRank = this.saveData.bestRanks[this.currentStageId];
    if (!prevRank || rankOrder[this.clearRank] > rankOrder[prevRank]) {
      this.saveData.bestRanks[this.currentStageId] = this.clearRank;
    }

    // ☆記録更新
    const prevStars = this.saveData.starsCollected[this.currentStageId] || 0;
    if (this.starsCollected > prevStars) {
      this.saveData.starsCollected[this.currentStageId] = this.starsCollected;
    }

    // 次ステージ解放
    const nextId = this.currentStageId + 1;
    if (nextId <= 5 && !this.saveData.unlockedStages.includes(nextId)) {
      this.saveData.unlockedStages.push(nextId);
    }

    // 隠しステージ解放チェック（全5ステージSランク）
    const allS = [1, 2, 3, 4, 5].every(id => this.saveData.bestRanks[id] === 'S');
    if (allS) this.saveData.hiddenUnlocked = true;

    Storage.save(this.saveData);
    this.state = 'clear';
  }
};

// ページ読み込み完了後にゲーム開始
window.addEventListener('DOMContentLoaded', () => {
  Game.init();
});
