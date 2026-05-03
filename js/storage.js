// storage.js - localStorage読み書き（ベスト記録の保存）

const Storage = {
  SAVE_KEY: 'maze_adventure_save',

  // セーブデータを読み込む
  load() {
    try {
      const data = localStorage.getItem(this.SAVE_KEY);
      return data ? JSON.parse(data) : this._createDefault();
    } catch {
      return this._createDefault();
    }
  },

  // セーブデータを書き込む
  save(data) {
    try {
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
    } catch {
      // localStorageが使えない環境では何もしない
    }
  },

  // デフォルトのセーブデータ
  _createDefault() {
    return {
      bestTimes: {},    // ステージID → ベストタイム（秒）
      bestRanks: {},    // ステージID → ベストランク
      starsCollected: {},// ステージID → 最大☆獲得数
      unlockedStages: [1], // 解放済みステージ
      hiddenUnlocked: false
    };
  }
};
