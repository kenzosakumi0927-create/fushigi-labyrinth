// input.js - キーボード・タッチ入力管理

const Input = {
  // 現在押されているキーの状態
  keys: {},

  // 初期化
  init() {
    // キーボードイベント
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // タッチコントロール（方向キー）
    this._setupTouchButton('btn-up', 'ArrowUp');
    this._setupTouchButton('btn-down', 'ArrowDown');
    this._setupTouchButton('btn-left', 'ArrowLeft');
    this._setupTouchButton('btn-right', 'ArrowRight');

    // アクションボタン
    this._setupTouchButton('btn-restart', 'KeyR');
    this._setupTouchButton('btn-enter', 'Enter');

    // ページ全体のタッチスクロール・ズームを防止
    document.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });

    // iOS Safari: ダブルタップズームを防止
    let lastTap = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTap < 300) {
        e.preventDefault();
      }
      lastTap = now;
    }, { passive: false });
  },

  // タッチボタンのイベント設定
  _setupTouchButton(buttonId, keyCode) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    // touchstart で押し始め
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.keys[keyCode] = true;
    }, { passive: false });

    // touchend で離す
    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.keys[keyCode] = false;
    }, { passive: false });

    // タッチがボタンから外れた場合
    btn.addEventListener('touchcancel', () => {
      this.keys[keyCode] = false;
    });

    // マウスクリックにも対応（PC でタッチUIが出た場合）
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.keys[keyCode] = true;
    });
    btn.addEventListener('mouseup', () => {
      this.keys[keyCode] = false;
    });
    btn.addEventListener('mouseleave', () => {
      this.keys[keyCode] = false;
    });
  },

  // キーが押されているか確認
  isPressed(code) {
    return this.keys[code] === true;
  }
};
