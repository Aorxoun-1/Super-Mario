class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.camera = { x: 0, y: 0 };
    }

    resize() {
        const sa = window.__safeArea || { top: 0, bottom: 0, left: 0, right: 0 };
        this.canvas.width  = window.innerWidth - sa.left - sa.right;
        this.canvas.height = window.innerHeight - sa.top - sa.bottom;
    }

    render(level, player, paused) {
        this.paused = paused;
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;

        // === 死锁 scale=2（游戏原生分辨率） ===
        const s = 2;

        // === 水平相机 ===
        this.camera.x = player.getCenterX() - W / 2;
        if (this.camera.x < 0) this.camera.x = 0;
        if (this.camera.x > level.width - W) this.camera.x = level.width - W;

        // === 垂直相机：Mario 在屏幕上 1/4 处 ===
        this.camera.y = player.y - H * 0.25;
        if (this.camera.y < 0) this.camera.y = 0;
        const maxY = level.height - H;
        if (this.camera.y > maxY) this.camera.y = maxY;

        // === 绘制 ===
        this._bg(ctx, W, H);
        this._tiles(ctx, level);
        this._coins(ctx, level);
        this._powerUps(ctx, level);
        this._enemies(ctx, level);
        this._mario(ctx, player);
        this._hud(ctx);
        // v6 标记
        ctx.fillStyle = 'rgba(0,255,0,0.35)';
        ctx.font = '9px monospace';
        const sa = window.__safeArea || {top:0,bottom:0,left:0,right:0};
        ctx.fillText('v7 H=' + H + ' cy=' + this.camera.y.toFixed(0) + ' saB=' + sa.bottom, 4, H - 4);
        if (!player.alive && Game.lives > 0) this._overlay(ctx, W, H, 'GAME OVER', '#c00');
        if (Game.lives <= 0) this._overlay(ctx, W, H, 'GAME OVER', '#c00');
        if (Game.win) this._overlay(ctx, W, H, 'YOU WIN!', '#0c0');
        if (this.paused) this._overlay(ctx, W, H, 'PAUSED', '#ff0');
    }

    _bg(ctx, W, H) {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#5c94fc'); g.addColorStop(1, '#a0c0ff');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        [{x:100,y:60},{x:400,y:80},{x:800,y:50},{x:1300,y:70},{x:1800,y:55},{x:2400,y:90}].forEach(c => {
            const sx = c.x - this.camera.x * 0.3;
            if (sx > -200 && sx < W + 200) this._cloud(ctx, sx, c.y);
        });
        ctx.fillStyle = '#5a8f3c';
        [{x:0,w:200},{x:600,w:180},{x:1400,w:220},{x:2200,w:160}].forEach(h => {
            const sx = h.x - this.camera.x * 0.5;
            if (sx > -h.w - 20 && sx < W + 20) {
                ctx.beginPath(); ctx.ellipse(sx + h.w / 2, H - 32, h.w / 2, 30, 0, Math.PI, 0); ctx.fill();
            }
        });
    }

    _cloud(ctx, x, y) {
        if (Game.sprites && Game.sprites.loaded) Game.sprites.drawTile(ctx, 0, 21, x, y, 2);
        else {
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.ellipse(x, y, 25, 12, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(x - 16, y + 3, 16, 10, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(x + 16, y + 3, 16, 10, 0, 0, Math.PI * 2); ctx.fill();
        }
    }

    _tiles(ctx, level) {
        const tw = 32;
        const sc = Math.max(0, Math.floor(this.camera.x / tw) - 1);
        const ec = Math.min(level.cols - 1, Math.ceil((this.camera.x + this.canvas.width) / tw) + 1);
        const sr = Math.max(0, Math.floor(this.camera.y / tw) - 1);
        const er = Math.min(level.rows - 1, Math.ceil((this.camera.y + this.canvas.height) / tw) + 1);
        for (let r = sr; r <= er; r++)
            for (let c = sc; c <= ec; c++) {
                const t = level.getTile(r, c);
                if (!t) continue;
                const sx = c * tw - this.camera.x;
                const sy = r * tw - this.camera.y;
                this._oneTile(ctx, t, sx, sy);
            }
    }

    _oneTile(ctx, id, x, y) {
        const S = Game.sprites, T = Sprites.TILE;
        if (S && S.loaded) {
            const m = {1:[0,0],2:[2,0],3:[24,0],4:[0,2],5:[24,4],8:[25,4]};
            if (m[id]) S.drawTile(ctx, m[id][0], m[id][1], x, y, 2);
        } else {
            ctx.fillStyle = {1:'#8B4513',2:'#C67B30',3:'#FFD700',4:'#2E8B2E',5:'#888',8:'#8B7355'}[id] || '#888';
            ctx.fillRect(x, y, 32, 32);
        }
    }

    _coins(ctx, level) {
        level.coins.forEach(c => {
            if (c.collected) return;
            const sx = c.x - this.camera.x, sy = (c.y + (c.animY || 0)) - this.camera.y;
            if (sx < -40 || sx > this.canvas.width + 40) return;
            if (Game.sprites && Game.sprites.loaded) Game.sprites.drawTile(ctx, 24, 1, sx, sy, 2);
        });
    }

    _powerUps(ctx, level) {
        level.powerUps.forEach(p => {
            if (p.collected) return;
            const sx = p.x - this.camera.x, sy = p.y - this.camera.y;
            if (sx < -40 || sx > this.canvas.width + 40) return;
            if (Game.sprites && Game.sprites.loaded) Game.sprites.drawTile(ctx, 24, 2, sx, sy, 2);
        });
    }

    _enemies(ctx, level) {
        const G = Sprites.GOOMBA;
        level.enemies.forEach(e => {
            if (e.dead && e.deadTimer > 30) return;
            const sx = e.x - this.camera.x, sy = e.y - this.camera.y;
            if (sx < -40 || sx > this.canvas.width + 40) return;
            if (Game.sprites && Game.sprites.loaded) {
                if (e.dead) Game.sprites.drawChar(ctx, G.SQUISH.x, G.SQUISH.y, G.SQUISH.w, G.SQUISH.h, sx, sy + 40, 2);
                else {
                    const f = e.frame % 2 ? G.WALK_2 : G.WALK_1;
                    Game.sprites.drawChar(ctx, f.x, f.y, f.w, f.h, sx, sy, 2);
                }
            }
        });
    }

    _mario(ctx, player) {
        if (player.invincible > 0 && Math.floor(player.invincible / 4) % 2 === 0) return;
        const S = Game.sprites, M = Sprites.MARIO_SMALL;
        const sx = player.x - this.camera.x, sy = player.y - this.camera.y, fd = player.facing > 0 ? 1 : -1;
        if (S && S.loaded) {
            let f;
            if (player.state === 'jumping' || player.state === 'falling') f = fd > 0 ? M.JUMP_R : M.JUMP_L;
            else if (player.state === 'running') f = (fd > 0 ? [M.RIGHT_1, M.RIGHT_2, M.RIGHT_3] : [M.LEFT_1, M.LEFT_2, M.LEFT_3])[player.frame % 3];
            else f = fd > 0 ? M.RIGHT_1 : M.LEFT_1;
            S.drawChar(ctx, f.x, f.y, f.w, f.h, sx + (player.w - 36) / 2, sy - 36, 2);
        }
    }

    _hud(ctx) {
        ctx.save();
        ctx.fillStyle = '#000'; ctx.font = 'bold 14px monospace';
        ctx.fillText('MARIO', 4, 12);
        ctx.font = 'bold 18px monospace';
        ctx.fillText(String(Game.score).padStart(6, '0'), 4, 34);
        ctx.fillText('x' + Game.coins, 160, 34);
        ctx.fillText('x' + Game.lives, 320, 34);
        ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.ellipse(148, 26, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    _overlay(ctx, W, H, text, color) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = color; ctx.font = 'bold ' + Math.min(36, W / 12) + 'px monospace'; ctx.textAlign = 'center';
        ctx.fillText(text, W / 2, H / 2 - 4);
        ctx.textAlign = 'left';
    }

    clear() { this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }
}
