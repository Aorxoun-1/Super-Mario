/**
 * Player — the main Mario character.
 * Handles movement, jumping, physics, and collision with the tilemap.
 */
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 24;
        this.h = 32;
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.facing = 1; // 1 = right, -1 = left
        this.state = 'idle'; // idle | running | jumping | falling
        this.frame = 0;
        this.frameTimer = 0;
        this.alive = true;
        this.big = false;
        this.invincible = 0; // invincibility timer (frames)
    }

    // Constants / tuning
    static get WALK_ACCEL()   { return 0.4; }
    static get MAX_WALK()     { return 4; }
    static get FRICTION()     { return 0.25; }
    static get GRAVITY()      { return 0.55; }
    static get JUMP_VEL()     { return -10; }
    static get JUMP_HOLD()    { return -0.4; } // gravity reduction while holding jump
    static get MAX_FALL()     { return 12; }

    update(input, level) {
        if (!this.alive) return;

        // --- Horizontal movement ---
        if (input.left) {
            this.vx -= Player.WALK_ACCEL;
            this.facing = -1;
        } else if (input.right) {
            this.vx += Player.WALK_ACCEL;
            this.facing = 1;
        } else {
            // Friction
            if (this.vx > 0) this.vx = Math.max(0, this.vx - Player.FRICTION);
            else if (this.vx < 0) this.vx = Math.min(0, this.vx + Player.FRICTION);
        }
        this.vx = Math.max(-Player.MAX_WALK, Math.min(Player.MAX_WALK, this.vx));

        // --- Jumping ---
        if (input.jump && this.onGround) {
            this.vy = Player.JUMP_VEL;
            this.onGround = false;
            if (Game.sfx) Game.sfx.jump();
        }
        // Variable jump height: holding jump reduces gravity
        if (input.jump && !this.onGround && this.vy < 0) {
            this.vy += Player.JUMP_HOLD;
        }

        // --- Gravity ---
        this.vy += Player.GRAVITY;
        if (this.vy > Player.MAX_FALL) this.vy = Player.MAX_FALL;

        // --- Move and collide ---
        this._moveAndCollide(level);

        // --- State & animation ---
        if (!this.onGround) {
            this.state = this.vy < 0 ? 'jumping' : 'falling';
        } else if (Math.abs(this.vx) > 0.5) {
            this.state = 'running';
            this.frameTimer++;
            if (this.frameTimer > 6) {
                this.frame = (this.frame + 1) % 4;
                this.frameTimer = 0;
            }
        } else {
            this.state = 'idle';
            this.frame = 0;
            this.frameTimer = 0;
        }

        // Invincibility countdown
        if (this.invincible > 0) this.invincible--;
    }

    _moveAndCollide(level) {
        const tiles = level.tiles;
        const tw = level.tileW;
        const th = level.tileH;
        const cols = level.cols;

        // --- Vertical FIRST (so X resolution sees corrected Y) ---
        this.y += this.vy;
        this.onGround = false;
        this._resolveCollisionY(tiles, tw, th, cols, level);

        // --- Horizontal SECOND (uses post-Y-correction Y) ---
        this.x += this.vx;
        this._resolveCollisionX(tiles, tw, th, cols);
    }

    _resolveCollisionX(tiles, tw, th, cols) {
        const top = Math.floor(this.y / th);
        const bottom = Math.floor((this.y + this.h - 1) / th);

        if (this.vx > 0) {
            const right = Math.floor((this.x + this.w) / tw);
            for (let row = top; row <= bottom; row++) {
                if (this._isSolid(tiles, cols, right, row)) {
                    this.x = right * tw - this.w;
                    this.vx = 0;
                    break;
                }
            }
        } else if (this.vx < 0) {
            const left = Math.floor(this.x / tw);
            for (let row = top; row <= bottom; row++) {
                if (this._isSolid(tiles, cols, left, row)) {
                    this.x = (left + 1) * tw;
                    this.vx = 0;
                    break;
                }
            }
        }
    }

    _resolveCollisionY(tiles, tw, th, cols, level) {
        const left = Math.floor(this.x / tw);
        const right = Math.floor((this.x + this.w - 1) / tw);

        if (this.vy > 0) {
            // Falling
            const bottom = Math.floor((this.y + this.h) / th);
            for (let col = left; col <= right; col++) {
                if (this._isSolid(tiles, cols, col, bottom)) {
                    this.y = bottom * th - this.h;
                    this.vy = 0;
                    this.onGround = true;
                    break;
                }
            }
        } else if (this.vy < 0) {
            // Jumping up — head bump
            const top = Math.floor(this.y / th);
            for (let col = left; col <= right; col++) {
                if (this._isSolid(tiles, cols, col, top)) {
                    this.y = (top + 1) * th;
                    this.vy = 1; // bump down
                    // Hit block from below
                    if (Game.sfx) Game.sfx.bump();
                    level.hitBlock(col, top, this);
                    break;
                }
            }
        }
    }

    _isSolid(tiles, cols, col, row) {
        if (row < 0 || row >= tiles.length) return false;
        if (col < 0 || col >= cols) return false;
        const tile = tiles[row][col];
        return (tile >= 1 && tile <= 5) || tile === 8; // ground, brick, question, pipe, flag, or used
    }

    takeDamage() {
        if (this.invincible > 0) return;
        if (this.big) {
            this.big = false;
            this.h = 32;
            this.y += 16;
            this.invincible = 90; // ~1.5 seconds
            if (Game.sfx) Game.sfx.bump();
        } else {
            this.alive = false;
            if (Game.sfx) Game.sfx.death();
        }
    }

    stomp() {
        this.vy = Player.JUMP_VEL * 0.7;
        this.onGround = false;
    }

    getCenterX() { return this.x + this.w / 2; }
    getCenterY() { return this.y + this.h / 2; }
    getBounds() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
}
