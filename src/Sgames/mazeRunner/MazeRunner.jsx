import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Phaser from "phaser";

import brick from "../../assets/BrickTileset/brick.png"; // 16x16
import brickBlack from "../../assets/BrickTileset/brickBlack.png"; // 16x16
import womenMc from "../../assets/Characters/womenMc.png"; // Sprite sheet: 528x328, 8 frames per direction, 4 directions (down, left, right, up)
import enemy from "../../assets/Characters/enemy.png"; // Sprite sheet: 528x328, 8 frames per direction, 4 directions (down, left, right, up)

const MazeRunner = () => {
    const gameParentRef = useRef(null);
    const navigate = useNavigate();

    const playerConfig = {
        speed: 100, // Movement speed in pixels/sec the lower the slower
        frameRate: 10, // This controls speed of animation the lower the slower it animate
        keys: {
            left: "A",
            right: "D",
            up: "W",
            down: "S"
        }
    };

    useEffect(() => {
        let game = null;

        const GAME_WIDTH = 960;
        const GAME_HEIGHT = 640;
        const UI_PANEL_WIDTH = 200;
        const MAZE_WIDTH = GAME_WIDTH - UI_PANEL_WIDTH;

        function readDarkMode() {
            try {
                const stored = localStorage.getItem("darkMode");
                if (stored !== null) return stored === "true";
            } catch { }
            return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        }

        function drawMenuBackground(scene, isDark) {
            const color = isDark ? 0x1f2937 : 0xbfbfbf;
            const TILE_BG = 40;
            for (let y = 0; y < scene.cameras.main.height; y += TILE_BG) {
                for (let x = 0; x < scene.cameras.main.width; x += TILE_BG) {
                    const alpha = Math.random() * 0.1 + 0.05;
                    scene.bgGraphics.fillStyle(color, alpha);
                    scene.bgGraphics.fillRect(x, y, TILE_BG - 2, TILE_BG - 2);
                }
            }
        }

        class MainMenu extends Phaser.Scene {
            constructor() { super({ key: "MainMenu" }); }
            create() {
                const isDark = readDarkMode();
                this.bgGraphics = this.add.graphics();
                drawMenuBackground(this, isDark);

                const textColor = isDark ? "#e5e7eb" : "#111111";
                const btnBg = isDark ? "#111827" : "#222222";
                const btnColor = isDark ? "#ff9d9d" : "#ff5555";

                const centerX = this.cameras.main.centerX;
                let startY = 200;
                const spacing = 70;

                this.add.text(centerX, 100, "Maze Runner", { font: "48px Arial", fill: textColor }).setOrigin(0.5);

                const addButton = (label, callback) => {
                    const btn = this.add.text(centerX, startY, label, {
                        font: "32px Arial",
                        fill: btnColor,
                        backgroundColor: btnBg,
                        padding: { x: 20, y: 10 },
                    })
                        .setOrigin(0.5)
                        .setInteractive({ useHandCursor: true })
                        .on("pointerdown", callback)
                        .on("pointerover", () => btn.setScale(1.1))
                        .on("pointerout", () => btn.setScale(1));
                    startY += spacing;
                };

                addButton("Start Game", () => this.scene.start("MazeRunnerScene", { level: 1 }));
                addButton("Instructions", () => alert(`Use keys ${Object.values(playerConfig.keys).join("/")} to move.`));
                addButton("Exit", () => navigate("/"));
            }

            update() {
                if (this.bgGraphics) {
                    this.bgGraphics.x -= 0.3;
                    if (this.bgGraphics.x < -50) this.bgGraphics.x = 0;
                }
            }
        }

        class MazeRunnerScene extends Phaser.Scene {
            constructor() { super({ key: "MazeRunnerScene" }); }

            init(data) {
                this.level = data && data.level ? data.level : 1;
            }

            preload() {
                this.load.image("brick", brick);
                this.load.image("brickBlack", brickBlack);
                this.load.spritesheet("womenMc", womenMc, { frameWidth: 66, frameHeight: 82 });
                this.load.spritesheet("enemy", enemy, { frameWidth: 66, frameHeight: 82 });
            }

            create() {
                this.win = false;
                this.gameOver = false;

                const FIXED_CELLS_X = 11;
                const FIXED_CELLS_Y = 9;

                const rows = FIXED_CELLS_Y * 2 + 1;
                const cols = FIXED_CELLS_X * 2 + 1;

                const maxTileW = Math.floor(MAZE_WIDTH / cols);
                const maxTileH = Math.floor(GAME_HEIGHT / rows);
                const TILE = Math.max(12, Math.min(36, Math.min(maxTileW, maxTileH)));
                this.TILE = TILE;

                this.timeLeft = Math.max(15, 60 - (this.level - 1) * 5);
                this.enemySpeed = 70 + (this.level - 1) * 8;
                this.enemySpawnDistance = TILE * 3;

                const maze = generateMazeGrid(FIXED_CELLS_X, FIXED_CELLS_Y);
                this.mazeGrid = maze;

                this.walls = [];
                const isDark = readDarkMode();
                this.cameras.main.setBackgroundColor(isDark ? 0x0f172a : 0xffffff);

                this.cameras.main.setBounds(0, 0, MAZE_WIDTH, GAME_HEIGHT);

                for (let r = 0; r < maze.length; r++) {
                    for (let c = 0; c < maze[0].length; c++) {
                        const x = c * TILE + TILE / 2;
                        const y = r * TILE + TILE / 2;

                        if (maze[r][c] === 1) {
                            const wall = this.add.image(x, y, "brickBlack").setDisplaySize(TILE, TILE).setOrigin(0.5);
                            this.physics.add.existing(wall, true);
                            this.walls.push(wall);
                        } else {
                            this.add.image(x, y, "brick").setDisplaySize(TILE, TILE).setOrigin(0.5);
                        }
                    }
                }

                const finishPos = findFinishPos(maze);
                this.finish = this.add.rectangle(finishPos.col * TILE + TILE / 2, finishPos.row * TILE + TILE / 2, TILE * 0.8, TILE * 0.8, isDark ? 0x16a34a : 0x37c84f).setOrigin(0.5);
                this.physics.add.existing(this.finish, true);

                this.anims.create({ key: "walk-down", frames: this.anims.generateFrameNumbers("womenMc", { start: 0, end: 7 }), frameRate: playerConfig.frameRate, repeat: -1 });
                this.anims.create({ key: "walk-left", frames: this.anims.generateFrameNumbers("womenMc", { start: 8, end: 15 }), frameRate: playerConfig.frameRate, repeat: -1 });
                this.anims.create({ key: "walk-right", frames: this.anims.generateFrameNumbers("womenMc", { start: 16, end: 23 }), frameRate: playerConfig.frameRate, repeat: -1 });
                this.anims.create({ key: "walk-up", frames: this.anims.generateFrameNumbers("womenMc", { start: 24, end: 31 }), frameRate: playerConfig.frameRate, repeat: -1 });

                this.anims.create({ key: "enemy-walk-down", frames: this.anims.generateFrameNumbers("enemy", { start: 0, end: 7 }), frameRate: playerConfig.frameRate, repeat: -1 });
                this.anims.create({ key: "enemy-walk-left", frames: this.anims.generateFrameNumbers("enemy", { start: 8, end: 15 }), frameRate: playerConfig.frameRate, repeat: -1 });
                this.anims.create({ key: "enemy-walk-right", frames: this.anims.generateFrameNumbers("enemy", { start: 16, end: 23 }), frameRate: playerConfig.frameRate, repeat: -1 });
                this.anims.create({ key: "enemy-walk-up", frames: this.anims.generateFrameNumbers("enemy", { start: 24, end: 31 }), frameRate: playerConfig.frameRate, repeat: -1 });

                const px = 1 * TILE + TILE / 2;
                const py = 1 * TILE + TILE / 2;
                this.playerStartX = px;
                this.playerStartY = py;

                this.player = this.physics.add.sprite(px, py, "womenMc", 0);
                this.player.setCollideWorldBounds(true);
                this.player.setDisplaySize(TILE * 0.9, TILE * 0.9);
                this.player.body.setSize(40, 50);
                this.player.body.setOffset(13, 25);

                this.walls.forEach(w => this.physics.add.collider(this.player, w));
                this.physics.add.overlap(this.player, this.finish, this.onWin, null, this);

                this.keys = this.input.keyboard.addKeys(playerConfig.keys);
                this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

                // --- RIGHT-SIDE UI PANEL ---
                const panelX = MAZE_WIDTH + 10;
                const panelY = 20;
                const panelWidth = UI_PANEL_WIDTH - 20;
                const panelHeight = GAME_HEIGHT - 40;

                const panelColor = isDark ? 0x071024 : 0xf2f4f7;
                const panelAlpha = isDark ? 0.35 : 0.8;
                const textPrimary = isDark ? "#e6f9ff" : "#06111a";

                this.uiPanel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, panelColor)
                    .setAlpha(panelAlpha)
                    .setOrigin(0, 0)
                    .setScrollFactor(0)
                    .setDepth(900);

                this.add.rectangle(panelX - 2, panelY, 2, panelHeight, isDark ? 0x2d3748 : 0xcccccc)
                    .setOrigin(0, 0)
                    .setScrollFactor(0)
                    .setDepth(899);

                this.instructionText = this.add.text(panelX + 10, panelY + 20,
                    `Move with\n${Object.values(playerConfig.keys).join(' / ')}\n\nPress [I] for debug`, {
                    font: '16px Arial',
                    fill: textPrimary,
                    align: 'left'
                })
                    .setScrollFactor(0)
                    .setDepth(910);

                this.levelText = this.add.text(panelX + 10, panelY + 120, `Level: ${this.level}`, {
                    font: '22px Arial',
                    fill: textPrimary,
                    fontWeight: 'bold'
                })
                    .setScrollFactor(0)
                    .setDepth(910);

                this.timerText = this.add.text(panelX + 10, panelY + 160, `Time: ${this.timeLeft}`, {
                    font: '22px Arial',
                    fill: isDark ? "#c6f6d5" : "#024b23",
                    fontWeight: 'bold'
                })
                    .setScrollFactor(0)
                    .setDepth(910);

                this.menuButton = this.add.text(panelX + panelWidth - 10, panelY + panelHeight - 10, "Menu", {
                    font: "18px Arial",
                    fill: isDark ? "#ff9d9d" : "#ff5555",
                    backgroundColor: isDark ? "#111827" : "#222222",
                    padding: { x: 12, y: 6 }
                })
                    .setOrigin(1, 1)
                    .setScrollFactor(0)
                    .setInteractive({ useHandCursor: true })
                    .on("pointerdown", () => {
                        this.scene.start("MainMenu");
                    });

                // Win / Defeat UI
                const centerX = GAME_WIDTH / 2;
                const centerY = GAME_HEIGHT / 2;

                this.winText = this.add.text(centerX, centerY, "You win!", { font: "48px Arial", fill: isDark ? "#fff59d" : "#ffff66" })
                    .setOrigin(0.5).setDepth(1000).setVisible(false);

                this.retryButton = this.add.text(centerX, centerY + 80, "Retry", {
                    font: "32px Arial",
                    fill: isDark ? "#ff9d9d" : "#ff5555",
                    backgroundColor: isDark ? "#111827" : "#222222",
                    padding: { x: 20, y: 10 },
                })
                    .setOrigin(0.5).setDepth(1000).setVisible(false)
                    .setInteractive({ useHandCursor: true })
                    .on("pointerdown", () => this.scene.restart({ level: this.level }));

                this.nextLevelButton = this.add.text(centerX, centerY + 140, "Next Level", {
                    font: "28px Arial",
                    fill: isDark ? "#a7f3d0" : "#00a86b",
                    backgroundColor: isDark ? "#0b1220" : "#e6ffe9",
                    padding: { x: 20, y: 10 },
                })
                    .setOrigin(0.5).setDepth(1000).setVisible(false)
                    .setInteractive({ useHandCursor: true })
                    .on("pointerdown", () => {
                        const next = this.level + 1;
                        this.scene.restart({ level: next });
                    });

                this.defeatText = this.add.text(centerX, centerY, "You were caught!", { font: "48px Arial", fill: isDark ? "#ff8b8b" : "#ff3333" })
                    .setOrigin(0.5).setDepth(1000).setVisible(false);

                this.timeUpText = this.add.text(centerX, centerY, "Time's Up!", { font: "48px Arial", fill: isDark ? "#ff8b8b" : "#ff3333" })
                    .setOrigin(0.5).setDepth(1000).setVisible(false);

                this.enemy = null;
                this.enemySpawned = false;

                this._onShutdownCleanup = [];
                this.timerEvent = this.time.addEvent({
                    delay: 1000,
                    loop: true,
                    callback: () => {
                        if (this.win || this.gameOver) return;
                        this.timeLeft -= 1;
                        this.timerText.setText(`Time: ${this.timeLeft}`);
                        if (this.timeLeft <= 5) this.startTimerWarning();
                        if (this.timeLeft <= 0) {
                            this.stopTimerWarning();
                            this.onTimeUp();
                        }
                    }
                });
                this._onShutdownCleanup.push(() => {
                    try { this.timerEvent.remove(false); } catch (e) { }
                });

                this.pathUpdateInterval = 300;
                this.pathTimer = this.time.addEvent({
                    delay: this.pathUpdateInterval,
                    loop: true,
                    callback: () => {
                        if (!this.enemySpawned || !this.enemy || this.win || this.gameOver) return;
                        this.updateEnemyPathAndMove();
                    }
                });
                this._onShutdownCleanup.push(() => {
                    try { this.pathTimer.remove(false); } catch (e) { }
                });

                this.events.on('shutdown', this._onShutdown, this);
                this.events.on('destroy', this._onDestroy, this);
            }

            startTimerWarning() {
                if (this.timerWarningTween) return;
                try {
                    this.timerText.setStyle({ fill: "#ffdddd", stroke: "#550000", strokeThickness: 4 });
                    this.timerWarningTween = this.tweens.add({
                        targets: this.timerText,
                        scaleX: 1.18,
                        scaleY: 1.18,
                        yoyo: true,
                        repeat: -1,
                        duration: 350,
                    });
                } catch (e) { }
            }

            stopTimerWarning() {
                try {
                    if (this.timerWarningTween) {
                        this.timerWarningTween.stop();
                        this.timerWarningTween = null;
                        const isDark = readDarkMode();
                        this.timerText.setStyle({
                            fill: isDark ? "#c6f6d5" : "#024b23",
                            stroke: isDark ? "#032a1f" : "#ffffff",
                            strokeThickness: 3
                        });
                        this.timerText.setScale(1);
                    }
                } catch (e) { }
            }

            update() {
                if (!this.player || !this.keys) return;

                // Allow debug toggle even when game is over
                if (Phaser.Input.Keyboard.JustDown(this.keyI)) {
                    this.debugMode = !this.debugMode;
                    this.updateDebugOverlay();
                }

                if (this.win || this.gameOver) {
                    if (this.player?.body) {
                        this.player.body.setVelocity(0, 0);
                        this.player.anims.stop();
                    }
                    //  Still render debug overlay if enabled
                    if (this.debugMode) {
                        this.updateDebugOverlay();
                    }
                    return;
                }

                const speed = playerConfig.speed;
                const body = this.player.body;
                let vx = 0, vy = 0;

                if (this.keys.left.isDown) {
                    vx = -speed;
                    this.player.anims.play("walk-left", true);
                } else if (this.keys.right.isDown) {
                    vx = speed;
                    this.player.anims.play("walk-right", true);
                } else if (this.keys.up.isDown) {
                    vy = -speed;
                    this.player.anims.play("walk-up", true);
                } else if (this.keys.down.isDown) {
                    vy = speed;
                    this.player.anims.play("walk-down", true);
                } else {
                    this.player.anims.stop();
                }

                body.setVelocity(vx, vy);

                if (!this.enemySpawned) {
                    const dx = this.player.x - this.playerStartX;
                    const dy = this.player.y - this.playerStartY;
                    const sq = dx * dx + dy * dy;
                    if (sq >= this.enemySpawnDistance * this.enemySpawnDistance) {
                        this.spawnEnemyAtStart();
                    }
                }

                if (this.debugMode) this.updateDebugOverlay();
            }

            spawnEnemyAtStart() {
                const ex = this.playerStartX;
                const ey = this.playerStartY;
                this.enemy = this.physics.add.sprite(ex, ey, "enemy", 0);
                this.enemy.setCollideWorldBounds(true);
                this.enemy.setDisplaySize(this.TILE * 0.9, this.TILE * 1.1);
                this.enemy.body.setSize(40, 50);
                this.enemy.body.setOffset(13, 25);

                this.walls.forEach(w => this.physics.add.collider(this.enemy, w));
                this.physics.add.overlap(this.player, this.enemy, () => {
                    this.onDefeat();
                }, null, this);

                this.enemySpawned = true;
            }

            updateEnemyPathAndMove() {
                if (!this.enemy || !this.player) return;
                const startCell = this.pixelToCell(this.enemy.x, this.enemy.y);
                const targetCell = this.pixelToCell(this.player.x, this.player.y);

                if (startCell.row === targetCell.row && startCell.col === targetCell.col) {
                    this.physics.moveToObject(this.enemy, this.player, this.enemySpeed);
                    this.playEnemyAnimForVelocity(this.enemy.body.velocity);
                    return;
                }

                const path = this.findPathBFS(startCell, targetCell, this.mazeGrid);
                if (!path || path.length < 2) {
                    this.physics.moveToObject(this.enemy, this.player, this.enemySpeed);
                    this.playEnemyAnimForVelocity(this.enemy.body.velocity);
                    return;
                }

                const next = path[1];
                const tx = next.col * this.TILE + this.TILE / 2;
                const ty = next.row * this.TILE + this.TILE / 2;

                this.physics.moveTo(this.enemy, tx, ty, this.enemySpeed);
                this.playEnemyAnimForVelocity(this.enemy.body.velocity);
            }

            playEnemyAnimForVelocity(vel) {
                if (!this.enemy) return;
                const vx = vel.x, vy = vel.y;
                if (Math.abs(vx) > Math.abs(vy)) {
                    if (vx > 0) this.enemy.anims.play("enemy-walk-right", true);
                    else this.enemy.anims.play("enemy-walk-left", true);
                } else {
                    if (vy > 0) this.enemy.anims.play("enemy-walk-down", true);
                    else if (vy < 0) this.enemy.anims.play("enemy-walk-up", true);
                    else this.enemy.anims.stop();
                }
            }

            findPathBFS(startCell, endCell, grid) {
                const rows = grid.length, cols = grid[0].length;
                const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
                const prev = Array.from({ length: rows }, () => Array(cols).fill(null));
                const q = [];
                q.push(startCell);
                visited[startCell.row][startCell.col] = true;
                const dirs = [{ dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }];
                while (q.length) {
                    const cur = q.shift();
                    if (cur.row === endCell.row && cur.col === endCell.col) {
                        const path = [];
                        let node = cur;
                        while (node) {
                            path.push({ row: node.row, col: node.col });
                            node = prev[node.row][node.col];
                        }
                        return path.reverse();
                    }
                    for (const d of dirs) {
                        const nr = cur.row + d.dr;
                        const nc = cur.col + d.dc;
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && grid[nr][nc] === 0) {
                            visited[nr][nc] = true;
                            prev[nr][nc] = cur;
                            q.push({ row: nr, col: nc });
                        }
                    }
                }
                return null;
            }

            pixelToCell(x, y) {
                const col = Math.floor(x / this.TILE);
                const row = Math.floor(y / this.TILE);
                return { row, col };
            }

            updateDebugOverlay() {
                // Ensure debugGraphics exists
                if (!this.debugGraphics) {
                    this.debugGraphics = this.add.graphics();
                    this.debugGraphics.setScrollFactor(0);
                    this.debugGraphics.setDepth(1000);
                } else {
                    this.debugGraphics.clear();
                }

                // Clean up old labels
                if (this.debugLabels) {
                    this.debugLabels.forEach(l => l.destroy?.());
                }
                this.debugLabels = [];

                if (!this.debugMode) {
                    return;
                }

                const textStyle = { font: "10px monospace", fill: "#ffff00" };
                const drawDebugFor = (obj, label) => {
                    const bounds = obj.getBounds();
                    this.debugGraphics.lineStyle(1, 0x00ffff, 0.8);
                    this.debugGraphics.strokeRectShape(bounds);
                    const text = this.add.text(bounds.x, bounds.y - 15, `${label}: (${Math.round(obj.x)}, ${Math.round(obj.y)})`, textStyle)
                        .setScrollFactor(0)
                        .setDepth(1000);
                    this.debugLabels.push(text);
                };

                drawDebugFor(this.player, "Player");
                drawDebugFor(this.finish, "Finish");
                if (this.enemy) drawDebugFor(this.enemy, "Enemy");

                const maxWallLabels = 5;
                this.walls.forEach((wall, i) => {
                    const bounds = wall.getBounds();
                    this.debugGraphics.lineStyle(1, 0xff00ff, 0.6);
                    this.debugGraphics.strokeRectShape(bounds);
                    if (i < maxWallLabels) {
                        const wallText = this.add.text(bounds.x, bounds.y - 12, `Wall ${i}`, { font: "8px monospace", fill: "#ff00ff" })
                            .setScrollFactor(0)
                            .setDepth(1000);
                        this.debugLabels.push(wallText);
                    }
                });
            }

            _onShutdown() {
                try {
                    if (this.debugGraphics) {
                        this.debugGraphics.destroy();
                        this.debugGraphics = null;
                    }
                } catch (e) { }

                if (this.debugLabels) {
                    this.debugLabels.forEach(l => {
                        try { l.destroy(); } catch (e) { }
                    });
                    this.debugLabels = [];
                }

                try { this.stopTimerWarning(); } catch (e) { }

                this._onShutdownCleanup?.forEach(fn => {
                    try { fn(); } catch (e) { }
                });
                this._onShutdownCleanup = [];
            }

            _onDestroy() {
                this._onShutdown();
            }

            onWin() {
                if (this.win || this.gameOver) return;
                this.win = true;
                this.winText.setVisible(true);
                this.retryButton.setVisible(true);
                this.nextLevelButton.setVisible(true);
                this.menuButton.setVisible(true);
                if (this.player?.body) this.player.body.setVelocity(0, 0);
                this.stopTimerWarning();
                this.tweens.add({ targets: this.finish, scaleX: 1.15, scaleY: 1.15, yoyo: true, repeat: 4, duration: 150 });
            }

            onDefeat() {
                if (this.win || this.gameOver) return;
                this.gameOver = true;
                if (this.player?.body) {
                    this.player.body.setVelocity(0, 0);
                    this.player.anims.stop();
                }
                if (this.enemy?.body) {
                    this.enemy.body.setVelocity(0, 0);
                    this.enemy.anims.stop();
                }
                this.stopTimerWarning();
                this.defeatText.setVisible(true);
                this.retryButton.setVisible(true);
                this.menuButton.setVisible(true);
                this.nextLevelButton.setVisible(false);
                this.timeUpText.setVisible(false);
                this.winText.setVisible(false);
                this.defeatText.scale = 1;
                this.tweens.add({ targets: this.defeatText, scaleX: 1.12, scaleY: 1.12, yoyo: true, repeat: 3, duration: 140 });
            }

            onTimeUp() {
                if (this.win || this.gameOver) return;
                this.gameOver = true;
                if (this.player?.body) {
                    this.player.body.setVelocity(0, 0);
                    this.player.anims.stop();
                }
                if (this.enemy?.body) {
                    this.enemy.body.setVelocity(0, 0);
                    this.enemy.anims.stop();
                }
                this.stopTimerWarning();
                this.timeUpText.setVisible(true);
                this.retryButton.setVisible(true);
                this.menuButton.setVisible(true);
                this.nextLevelButton.setVisible(false);
                this.defeatText.setVisible(false);
                this.winText.setVisible(false);
                this.timeUpText.scale = 1;
                this.tweens.add({ targets: this.timeUpText, scaleX: 1.12, scaleY: 1.12, yoyo: true, repeat: 3, duration: 140 });
            }
        }

        function generateMazeGrid(cellsX, cellsY) {
            const rows = cellsY * 2 + 1, cols = cellsX * 2 + 1;
            const grid = Array.from({ length: rows }, () => Array(cols).fill(1));
            const visited = Array.from({ length: cellsY }, () => Array(cellsX).fill(false));
            const toGrid = (cx, cy) => ({ col: cx * 2 + 1, row: cy * 2 + 1 });
            const stack = [];
            visited[0][0] = true;
            const g = toGrid(0, 0); grid[g.row][g.col] = 0;
            stack.push({ cx: 0, cy: 0 });
            const dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];

            while (stack.length) {
                const cur = stack[stack.length - 1];
                const neighbors = [];
                for (const d of dirs) {
                    const nx = cur.cx + d.dx, ny = cur.cy + d.dy;
                    if (nx >= 0 && nx < cellsX && ny >= 0 && ny < cellsY && !visited[ny][nx]) neighbors.push({ cx: nx, cy: ny });
                }
                if (!neighbors.length) stack.pop();
                else {
                    const nxt = Phaser.Math.RND.pick(neighbors);
                    const curG = toGrid(cur.cx, cur.cy);
                    const nxtG = toGrid(nxt.cx, nxt.cy);
                    grid[(curG.row + nxtG.row) / 2][(curG.col + nxtG.col) / 2] = 0;
                    grid[nxtG.row][nxtG.col] = 0;
                    visited[nxt.cy][nxt.cx] = true;
                    stack.push(nxt);
                }
            }
            return grid;
        }

        function findFinishPos(grid) {
            for (let r = grid.length - 2; r >= 1; r--) {
                for (let c = grid[0].length - 2; c >= 1; c--) {
                    if (grid[r][c] === 0) return { row: r, col: c };
                }
            }
            return { row: grid.length - 2, col: grid[0].length - 2 };
        }

        const config = {
            type: Phaser.AUTO,
            parent: gameParentRef.current,
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            backgroundColor: readDarkMode() ? 0x0f172a : 0xffffff,
            physics: { default: "arcade", arcade: { gravity: { y: 0 }, debug: false } },
            scene: [MainMenu, MazeRunnerScene],
        };

        game = new Phaser.Game(config);

        return () => {
            if (game) {
                try { game.destroy(true); } catch (e) { }
            }
        };
    }, [navigate]);

    return (
        <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div ref={gameParentRef} />
        </div>
    );
};

export default MazeRunner;