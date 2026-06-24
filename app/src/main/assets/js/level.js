/**
 * Level — tilemap and game objects (enemies, coins, power-ups).
 */
class Level {
    constructor() {
        this.tileW = 32;
        this.tileH = 32;
        this.cols = 100;  // wide scrolling level
        this.rows = 15;
        this.tiles = [];
        this.enemies = [];
        this.coins = [];
        this.powerUps = [];
        this.flagY = 0; // flag position

        this._build();
    }

    get width()  { return this.cols * this.tileW; }
    get height() { return this.rows * this.tileH; }

    _build() {
        // Build empty level
        for (let r = 0; r < this.rows; r++) {
            this.tiles[r] = [];
            for (let c = 0; c < this.cols; c++) {
                this.tiles[r][c] = 0;
            }
        }

        // Ground (row 13-14)
        for (let c = 0; c < this.cols; c++) {
            this.tiles[13][c] = 1;
            this.tiles[14][c] = 1;
        }

        // Some elevated platforms (brick = 2)
        this._placeRow(2, 9, 10, 12);  // row 9, cols 10-12
        this._placeRow(2, 9, 18, 20);
        this._placeRow(2, 9, 42, 45);
        this._placeRow(2, 9, 50, 52);
        this._placeRow(2, 9, 70, 73);

        // Question blocks (3) with coins
        this._setTile(3, 9, 14);  // row 9, col 14
        this._setTile(3, 7, 22);
        this._setTile(3, 9, 46);
        this._setTile(3, 9, 71);
        this._setTile(3, 5, 76);

        // Pipes (4) — vertical pipe segments
        // Pipe 1 at col 16
        this._setTile(4, 11, 16);
        this._setTile(4, 10, 16);
        // Pipe 2 at col 37
        this._setTile(4, 11, 37);
        this._setTile(4, 10, 37);
        this._setTile(4, 9, 37);

        // Flag pole at col 92
        this._setTile(5, 10, 92);
        this._setTile(5, 9, 92);
        this._setTile(5, 8, 92);
        this._setTile(5, 7, 92);
        this._setTile(5, 6, 92);
        this.flagY = 10 * this.tileH;

        // --- Enemies ---
        this.enemies.push(new Enemy(20 * this.tileW, 12 * this.tileH, 1));  // Goomba
        this.enemies.push(new Enemy(24 * this.tileW, 12 * this.tileH, 1));
        this.enemies.push(new Enemy(44 * this.tileW, 12 * this.tileH, 1));
        this.enemies.push(new Enemy(52 * this.tileW, 12 * this.tileH, 1));
        this.enemies.push(new Enemy(72 * this.tileW, 12 * this.tileH, 1));

        // --- Coins (free-standing, in the air) ---
        this.coins.push({ x: 14 * this.tileW + 8, y: 8 * this.tileH, collected: false });
        this.coins.push({ x: 22 * this.tileW + 8, y: 5 * this.tileH, collected: false });
        this.coins.push({ x: 44 * this.tileW + 8, y: 8 * this.tileH, collected: false });
        this.coins.push({ x: 60 * this.tileW + 8, y: 8 * this.tileH, collected: false });
        this.coins.push({ x: 76 * this.tileW + 8, y: 8 * this.tileH, collected: false });
    }

    _setTile(id, row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.tiles[row][col] = id;
        }
    }

    _placeRow(id, row, colStart, colEnd) {
        for (let c = colStart; c <= colEnd; c++) {
            this._setTile(id, row, c);
        }
    }

    hitBlock(col, row, player) {
        const tile = this.tiles[row]?.[col];
        if (tile === 3) {
            // Question block → becomes empty
            this.tiles[row][col] = 8; // used block
            Game.coins++;
            Game.score += 200;

            // Some question blocks spawn a mushroom instead of a coin
            // Blocks at row 9 are coin blocks; others spawn mushroom
            if (row <= 7) {
                // Spawn mushroom
                this.powerUps.push(new PowerUp(
                    col * this.tileW,
                    (row - 1) * this.tileH
                ));
            } else {
                // Spawn coin popup
                this.coins.push({
                    x: col * this.tileW + 8,
                    y: (row - 1) * this.tileH,
                    collected: false,
                    animY: 0,
                    popup: true,
                    rising: true
                });
            }
        }
    }

    /**
     * Return the tile at a pixel position (or null if out of bounds).
     */
    tileAt(px, py) {
        const col = Math.floor(px / this.tileW);
        const row = Math.floor(py / this.tileH);
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
        return this.tiles[row][col];
    }

    getTile(row, col) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return 0;
        return this.tiles[row][col];
    }

    setTile(row, col, id) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.tiles[row][col] = id;
        }
    }

    /**
     * Update enemies and other dynamic objects.
     */
    update(player) {
        for (const e of this.enemies) {
            e.update(this);
        }

        // Coins animation — popup coins rise then fall back
        for (const c of this.coins) {
            if (c.popup && c.animY !== undefined) {
                if (c.rising) {
                    c.animY = (c.animY || 0) - 1;
                    if (c.animY <= -48) {
                        c.rising = false;  // reached peak, start falling
                    }
                } else {
                    c.animY += 1;
                    if (c.animY >= 0) {
                        c.collected = true;  // back to origin, disappear
                    }
                }
            }
        }

        // Power-ups update
        for (const p of this.powerUps) {
            p.update(this);
        }
        this.powerUps = this.powerUps.filter(p => !p.collected);

        this._checkPlayerCollisions(player);
    }

    _checkPlayerCollisions(player) {
        const pb = player.getBounds();

        // Coin collection (skip visual popup coins)
        for (const c of this.coins) {
            if (c.collected || c.popup) continue;
            if (pb.x < c.x + 16 && pb.x + pb.w > c.x &&
                pb.y < c.y + 24 && pb.y + pb.h > c.y) {
                c.collected = true;
                Game.score += 100;
                Game.coins++;
                if (Game.sfx) Game.sfx.coin();
            }
        }

        // Enemy collisions
        for (const e of this.enemies) {
            if (e.dead) continue;
            if (pb.x < e.x + e.w && pb.x + pb.w > e.x &&
                pb.y < e.y + e.h && pb.y + pb.h > e.y) {

                // Check if player is falling onto the enemy (stomp)
                if (player.vy > 0 && pb.y + pb.h - e.y < 16) {
                    e.stomped();
                    player.stomp();
                    Game.score += 200;
                    if (Game.sfx) Game.sfx.stomp();
                } else {
                    player.takeDamage();
                }
            }
        }

        // Flag reach — check horizontal overlap with flag pole area
        if (pb.x + pb.w > 92 * this.tileW && pb.x < 93 * this.tileW) {
            Game.win = true;
            if (Game.sfx) Game.sfx.win();
        }

        // Power-up collection
        for (const p of this.powerUps) {
            if (p.collected) continue;
            if (pb.x < p.x + p.w && pb.x + pb.w > p.x &&
                pb.y < p.y + p.h && pb.y + pb.h > p.y) {
                p.collected = true;
                player.big = true;
                player.h = 48;
                player.y -= 16;
                Game.score += 500;
                if (Game.sfx) Game.sfx.powerUp();
            }
        }

        // Fall into pit
        if (player.y > this.rows * this.tileH) {
            player.alive = false;
            if (Game.sfx) Game.sfx.death();
        }
    }

    reset() {
        this.tiles = [];
        this.enemies = [];
        this.coins = [];
        this._build();
    }
}

/**
 * Enemy — Goomba-like creature.
 */
class Enemy {
    constructor(x, y, type = 1) {
        this.x = x;
        this.y = y;
        this.w = 28;
        this.h = 28;
        this.vx = -1;
        this.vy = 0;
        this.type = type; // 1 = Goomba
        this.dead = false;
        this.deadTimer = 0;
        this.frame = 0;
        this.frameTimer = 0;
    }

    update(level) {
        if (this.dead) {
            this.deadTimer++;
            return;
        }

        const tw = level.tileW;
        const th = level.tileH;

        // Apply gravity
        this.vy += 0.4;
        if (this.vy > 8) this.vy = 8;

        // Horizontal
        this.x += this.vx;
        this._resolveCollisionX(level);

        // Vertical
        this.y += this.vy;
        this._resolveCollisionY(level);

        // Animation
        this.frameTimer++;
        if (this.frameTimer > 10) {
            this.frame = (this.frame + 1) % 2;
            this.frameTimer = 0;
        }
    }

    _resolveCollisionX(level) {
        const tw = level.tileW;
        const th = level.tileH;
        const cols = level.cols;
        const tiles = level.tiles;
        const top = Math.floor(this.y / th);
        const bottom = Math.floor((this.y + this.h - 1) / th);

        if (this.vx > 0) {
            const right = Math.floor((this.x + this.w) / tw);
            for (let r = top; r <= bottom; r++) {
                if (Enemy._isSolid(tiles, cols, right, r)) {
                    this.vx = -Math.abs(this.vx);
                    break;
                }
            }
        } else {
            const left = Math.floor(this.x / tw);
            for (let r = top; r <= bottom; r++) {
                if (Enemy._isSolid(tiles, cols, left, r)) {
                    this.vx = Math.abs(this.vx);
                    break;
                }
            }
        }
    }

    _resolveCollisionY(level) {
        const tw = level.tileW;
        const th = level.tileH;
        const cols = level.cols;
        const tiles = level.tiles;
        const left = Math.floor(this.x / tw);
        const right = Math.floor((this.x + this.w - 1) / tw);

        if (this.vy > 0) {
            const bottom = Math.floor((this.y + this.h) / th);
            for (let c = left; c <= right; c++) {
                if (Enemy._isSolid(tiles, cols, c, bottom)) {
                    this.y = bottom * th - this.h;
                    this.vy = 0;
                    break;
                }
            }
        }
    }

    static _isSolid(tiles, cols, col, row) {
        if (row < 0 || row >= tiles.length) return false;
        if (col < 0 || col >= cols) return false;
        const t = tiles[row][col];
        return (t >= 1 && t <= 5) || t === 8;
    }

    stomped() {
        this.dead = true;
        this.deadTimer = 0;
    }
}

/**
 * PowerUp — Mushroom that makes Mario big.
 */
class PowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 28;
        this.h = 28;
        this.vx = 1.5;
        this.vy = -4; // pop up
        this.collected = false;
        this.emerging = true; // rising from block
        this.emergeY = y - 28;
    }

    update(level) {
        if (this.collected) return;

        if (this.emerging) {
            this.y -= 1.5;
            if (this.y <= this.emergeY) {
                this.emerging = false;
                this.y = this.emergeY;
            }
            return;
        }

        // Gravity
        this.vy += 0.3;
        if (this.vy > 6) this.vy = 6;

        // Horizontal
        this.x += this.vx;
        this._resolveCollisionX(level);

        // Vertical
        this.y += this.vy;
        this._resolveCollisionY(level);
    }

    _resolveCollisionX(level) {
        const tw = level.tileW;
        const th = level.tileH;
        const cols = level.cols;
        const tiles = level.tiles;
        const top = Math.floor(this.y / th);
        const bottom = Math.floor((this.y + this.h - 1) / th);

        if (this.vx > 0) {
            const right = Math.floor((this.x + this.w) / tw);
            for (let r = top; r <= bottom; r++) {
                if (Enemy._isSolid(tiles, cols, right, r)) {
                    this.vx = -Math.abs(this.vx);
                    break;
                }
            }
        } else {
            const left = Math.floor(this.x / tw);
            for (let r = top; r <= bottom; r++) {
                if (Enemy._isSolid(tiles, cols, left, r)) {
                    this.vx = Math.abs(this.vx);
                    break;
                }
            }
        }
    }

    _resolveCollisionY(level) {
        const tw = level.tileW;
        const th = level.tileH;
        const cols = level.cols;
        const tiles = level.tiles;
        const left = Math.floor(this.x / tw);
        const right = Math.floor((this.x + this.w - 1) / tw);

        if (this.vy > 0) {
            const bottom = Math.floor((this.y + this.h) / th);
            for (let c = left; c <= right; c++) {
                if (Enemy._isSolid(tiles, cols, c, bottom)) {
                    this.y = bottom * th - this.h;
                    this.vy = 0;
                    break;
                }
            }
        }
    }
}
