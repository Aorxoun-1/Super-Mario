/**
 * Game — main loop, state management, and global score.
 */
class Game {
    static score = 0;
    static coins = 0;
    static lives = 3;
    static win = false;
    static sfx = null; // AudioManager instance

    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.input = new InputManager();
        this.renderer = new Renderer(this.canvas);
        this.level = new Level();
        this.player = new Player(3 * 32, 12 * 32); // start near left side
        this.running = false;
        this.paused = false;
        this.lastTime = 0;
        this.accumulator = 0;
        this.step = 1 / 60; // fixed 60 FPS
        this._deathHandled = false;

        this._onResize = () => this.renderer.resize();
        window.addEventListener('resize', this._onResize);
        this.renderer.resize();
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        this._loop(performance.now());
    }

    _loop = (now) => {
        if (!this.running) return;

        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;
        this.accumulator += dt;

        // Handle pause toggle
        if (this.input.pause) {
            // Edge-triggered via a one-shot flag
            if (!this._pausePrev) {
                this.paused = !this.paused;
            }
            this._pausePrev = true;
        } else {
            this._pausePrev = false;
        }

        // Fixed-step update
        while (this.accumulator >= this.step) {
            if (!this.paused && !Game.win) {
                if (this.player.alive) {
                    this._update();
                } else {
                    // Player just died — handle death after a brief pause
                    if (!this._deathHandled) {
                        this._handleDeath();
                        this._deathHandled = true;
                    }
                }
            }
            this.accumulator -= this.step;
        }

        // Render
        this.renderer.clear();
        this.renderer.render(this.level, this.player, this.paused);

        // Restart / next life check
        if (this._deathHandled && this.input.enter && !this.player.alive && Game.lives > 0) {
            this._respawn();
        }
        if ((Game.lives <= 0 || Game.win) && this.input.enter) {
            this._restart();
        }

        requestAnimationFrame(this._loop);
    }

    _update() {
        this.player.update(this.input, this.level);
        this.level.update(this.player);
    }

    _handleDeath() {
        Game.lives--;
        if (Game.lives < 0) Game.lives = 0;
    }

    _respawn() {
        this.level = new Level();
        this.player = new Player(3 * 32, 12 * 32);
        this.paused = false;
        this.accumulator = 0;
        this._deathHandled = false;
    }

    _restart() {
        Game.score = 0;
        Game.coins = 0;
        Game.lives = 3;
        Game.win = false;
        this.level = new Level();
        this.player = new Player(3 * 32, 12 * 32);
        this.paused = false;
        this.accumulator = 0;
        this._deathHandled = false;
    }

    /** 释放资源，停止循环 */
    stop() {
        this.running = false;
        window.removeEventListener('resize', this._onResize);
    }
}
