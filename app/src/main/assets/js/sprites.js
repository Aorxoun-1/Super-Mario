/**
 * Sprite Manager — loads sprite sheets and provides tile/entity sprite coordinates.
 * All coordinates are in source-pixel units (16×16 tiles, 18×34 character frames).
 */
class Sprites {
    constructor() {
        this.tilesImg = new Image();
        this.charImg = new Image();
        this.loaded = false;
        this.loading = false;
        this._load();
    }

    _load() {
        this.loading = true;
        this.tilesImg.onload = () => this._checkReady();
        this.charImg.onload = () => this._checkReady();
        this.tilesImg.src = 'img/tiles.png';
        this.charImg.src = 'img/characters.gif';
    }

    _checkReady() {
        if (this.tilesImg.complete && this.charImg.complete) {
            this.loaded = true;
        }
    }

    /**
     * Draw a 16×16 tile from tiles.png at (dstX, dstY) scaled by scale.
     */
    drawTile(ctx, tileCol, tileRow, dstX, dstY, scale = 2) {
        if (!this.loaded) return;
        ctx.drawImage(
            this.tilesImg,
            tileCol * 16, tileRow * 16, 16, 16,
            dstX, dstY, 16 * scale, 16 * scale
        );
    }

    /**
     * Draw a character frame from characters.gif.
     * frameX, frameY = source pixel coords; w, h = frame size.
     */
    drawChar(ctx, frameX, frameY, w, h, dstX, dstY, scale = 2) {
        if (!this.loaded) return;
        ctx.drawImage(
            this.charImg,
            frameX, frameY, w, h,
            dstX, dstY, w * scale, h * scale
        );
    }

    // === TILE COORDINATES (col, row in 16×16 grid) ===
    static TILE = {
        GROUND_TOP:     { col: 0, row: 0 },  // brown top ground
        GROUND_SUB:     { col: 1, row: 0 },  // lighter sub-ground
        GROUND_BOTTOM:  { col: 0, row: 1 },  // darker bottom ground
        BRICK:          { col: 2, row: 0 },  // orange brick
        QUESTION:       { col: 24, row: 0 }, // golden ? block
        USED_BLOCK:     { col: 25, row: 4 }, // dark used block
        PIPE_TOP_L:     { col: 0, row: 2 },  // pipe top-left
        PIPE_TOP_R:     { col: 4, row: 2 },  // pipe top-right
        PIPE_BODY_L:    { col: 0, row: 3 },  // pipe body-left
        PIPE_BODY_R:    { col: 4, row: 3 },  // pipe body-right
        FLAG_POLE:      { col: 24, row: 4 }, // flag pole
        FLAG_TOP:       { col: 25, row: 4 }, // flag at top
        COIN:           { col: 24, row: 1 }, // spinning coin
        MUSHROOM:       { col: 24, row: 2 }, // red mushroom
    };

    // === CHARACTER FRAME COORDINATES (pixel coords in characters.gif) ===
    // Mario small: 18×34 frames
    static MARIO_SMALL = {
        RIGHT_1:  { x: 256, y: 0, w: 18, h: 34 },
        RIGHT_2:  { x: 274, y: 0, w: 18, h: 34 },
        RIGHT_3:  { x: 292, y: 0, w: 18, h: 34 },
        LEFT_1:   { x: 238, y: 0, w: 18, h: 34 },
        LEFT_2:   { x: 220, y: 0, w: 18, h: 34 },
        LEFT_3:   { x: 202, y: 0, w: 18, h: 34 },
        JUMP_R:   { x: 368, y: 0, w: 18, h: 34 },
        JUMP_L:   { x: 128, y: 0, w: 18, h: 34 },
    };

    // Goomba: 18×18 frames in characters.gif
    static GOOMBA = {
        WALK_1: { x: 0, y: 0, w: 18, h: 18 },
        WALK_2: { x: 18, y: 0, w: 18, h: 18 },
        SQUISH: { x: 36, y: 0, w: 18, h: 10 },
    };
}
