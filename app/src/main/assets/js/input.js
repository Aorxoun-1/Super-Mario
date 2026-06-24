/**
 * Input Manager — 极简版。
 * 键盘: A/D 左右, 空格跳跃, P/Esc暂停, Enter重新开始
 * 触控: 通过 window.__keys 桥接
 */
class InputManager {
    constructor() {
        // 全局状态对象，方便 Java dispatchKeyEvent 直接写入
        const keys = {};
        window.__keys = keys;
        this._keys = keys;

        const onDown = (e) => {
            keys[e.code] = true;
            // 阻止方向键/空格使页面滚动
            if (['ArrowLeft','ArrowRight','Space'].includes(e.code)) {
                e.preventDefault();
            }
        };
        const onUp = (e) => { keys[e.code] = false; };

        document.addEventListener('keydown', onDown);
        document.addEventListener('keyup', onUp);
        this._onDown = onDown;
        this._onUp = onUp;

        this._bindTouch();
    }

    get left()   { return !!(this._keys['ArrowLeft']  || this._keys['KeyA']); }
    get right()  { return !!(this._keys['ArrowRight'] || this._keys['KeyD']); }
    get jump()   { return !!this._keys['Space']; }
    get pause()  { return !!(this._keys['Escape'] || this._keys['KeyP']); }
    get enter()  { return !!this._keys['Enter']; }

    _bindTouch() {
        const map = {
            'btn-left':   'ArrowLeft',
            'btn-right':  'ArrowRight',
            'btn-jump':   'Space',
            'btn-pause':  'Escape',
            'btn-restart':'Enter',
        };
        for (const [id, code] of Object.entries(map)) {
            const el = document.getElementById(id);
            if (!el) continue;
            const on = (e) => { e.preventDefault(); this._keys[code] = true;  el.classList.add('pressed'); };
            const off= (e) => { e.preventDefault(); this._keys[code] = false; el.classList.remove('pressed'); };
            el.addEventListener('touchstart', on, {passive:false});
            el.addEventListener('touchend', off, {passive:false});
            el.addEventListener('touchcancel', off, {passive:false});
            el.addEventListener('mousedown', on);
            el.addEventListener('mouseup', off);
            el.addEventListener('mouseleave', off);
        }
    }

    /** 释放资源，移除事件监听 */
    destroy() {
        document.removeEventListener('keydown', this._onDown);
        document.removeEventListener('keyup', this._onUp);
        delete window.__keys;
    }
}
