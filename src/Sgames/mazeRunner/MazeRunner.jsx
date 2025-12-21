import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Phaser from "phaser";

const MazeRunner = () => {
    const gameParentRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        let game = null;
        let mo = null;

        // ---------------- Theme Utilities ----------------
        const applyBodyBg = (isDark) => {
            document.body.style.backgroundColor = isDark ? "#0f172a" : "#ffffff";
        };

        const storageHandler = (e) => {
            if (e.key === "darkMode") {
                const isDark = e.newValue === "true";
                applyThemeToScene(game.scene.getScene("MazeRunnerScene"), isDark);
                applyThemeToScene(game.scene.getScene("MainMenu"), isDark);
                applyBodyBg(isDark);
            }
        };

        function readDarkMode() {
            try {
                const stored = localStorage.getItem("darkMode");
                if (stored !== null) return stored === "true";
            } catch { }
            return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        }

        function applyThemeToScene(scene, isDark) {
            if (!scene) return;
            const bgColor = isDark ? 0x0f172a : 0xffffff;
            const wallColor = isDark ? 0x1f2937 : 0xbfbfbf;
            const finishColor = isDark ? 0x16a34a : 0x37c84f;
            const playerColor = isDark ? 0x60a5fa : 0x4da6ff;
            const hudFill = isDark ? "#e5e7eb" : "#111111";
            const winFill = isDark ? "#fff59d" : "#ffff66";
            const menuFill = isDark ? "#ff9d9d" : "#ff5555";
            const menuBg = isDark ? "#111827" : "#222222";

            try { scene.cameras.main.setBackgroundColor(bgColor); } catch { }

            if (scene.walls && Array.isArray(scene.walls)) {
                scene.walls.forEach(w => { try { w.setFillStyle(wallColor); } catch { } });
            }

            try {
                if (scene.finish) scene.finish.setFillStyle(finishColor);
                if (scene.player) scene.player.setFillStyle(playerColor);
                if (scene.hud) scene.hud.setColor(hudFill);
                if (scene.winText) scene.winText.setColor(winFill);
                if (scene.menuButton) {
                    scene.menuButton.setStyle({ fill: menuFill, backgroundColor: menuBg, padding: { x: 10, y: 5 } });
                }
                if (scene.retryButton) {
                    scene.retryButton.setStyle({ fill: menuFill, backgroundColor: menuBg, padding: { x: 10, y: 5 } });
                }
                if (scene.bgGraphics) {
                    scene.bgGraphics.clear();
                    drawMenuBackground(scene, isDark);
                }
                // Also update debug hint if exists
                if (scene.hintText) {
                    scene.hintText.setFill(isDark ? "#64748b" : "#666666");
                }
            } catch { }
        }

        // ------------------ Scenes ------------------
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

                addButton("Start Game", () => this.scene.start("MazeRunnerScene"));
                addButton("Instructions", () => alert("Use Arrow keys or WASD to move. Reach the green tile to win!"));
                addButton("Exit", () => navigate("/"));
            }

            update() {
                if (this.bgGraphics) {
                    this.bgGraphics.x -= 0.3;
                    if (this.bgGraphics.x < -50) this.bgGraphics.x = 0;
                }
            }
        }

        function drawMenuBackground(scene, isDark) {
            const color = isDark ? 0x1f2937 : 0xbfbfbf;
            const TILE = 40;
            for (let y = 0; y < scene.cameras.main.height; y += TILE) {
                for (let x = 0; x < scene.cameras.main.width; x += TILE) {
                    const alpha = Math.random() * 0.1 + 0.05;
                    scene.bgGraphics.fillStyle(color, alpha);
                    scene.bgGraphics.fillRect(x, y, TILE - 2, TILE - 2);
                }
            }
        }

        class MazeRunnerScene extends Phaser.Scene {
            constructor() { super({ key: "MazeRunnerScene" }); }

            preload() { }

            create() {
                this.win = false;
                const CELL_COUNT_X = 21;
                const CELL_COUNT_Y = 17;
                const TILE = 36;

                this.scale.resize(CELL_COUNT_X * TILE, CELL_COUNT_Y * TILE);
                const maze = generateMazeGrid((CELL_COUNT_X - 1) / 2, (CELL_COUNT_Y - 1) / 2);

                this.walls = [];
                this.graphics = this.add.graphics();

                const isDark = readDarkMode();
                this.cameras.main.setBackgroundColor(isDark ? 0x0f172a : 0xffffff);

                // Walls
                for (let r = 0; r < maze.length; r++) {
                    for (let c = 0; c < maze[0].length; c++) {
                        if (maze[r][c] === 1) {
                            const x = c * TILE;
                            const y = r * TILE;
                            const rect = this.add.rectangle(x + TILE / 2, y + TILE / 2, TILE, TILE, isDark ? 0x1f2937 : 0xbfbfbf).setOrigin(0.5);
                            this.physics.add.existing(rect, true);
                            this.walls.push(rect);
                        }
                    }
                }

                // Finish
                const finishPos = findFinishPos(maze);
                this.finish = this.add.rectangle(finishPos.col * TILE + TILE / 2, finishPos.row * TILE + TILE / 2, TILE * 0.8, TILE * 0.8, isDark ? 0x16a34a : 0x37c84f).setOrigin(0.5);
                this.physics.add.existing(this.finish, true);

                // Player
                const px = 1 * TILE + TILE / 2;
                const py = 1 * TILE + TILE / 2;
                this.player = this.add.circle(px, py, TILE * 0.34, isDark ? 0x60a5fa : 0x4da6ff).setOrigin(0.5);
                this.physics.add.existing(this.player);
                this.player.body.setCollideWorldBounds(true);
                this.player.body.setBounce(0);
                this.player.body.setDrag(600, 600);

                this.walls.forEach(w => this.physics.add.collider(this.player, w));
                this.physics.add.overlap(this.player, this.finish, onWin, null, this);

                this.cursors = this.input.keyboard.createCursorKeys();
                this.keysWASD = this.input.keyboard.addKeys("W,A,S,D");
                this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

                // HUD
                this.hud = this.add.text(10, 8, "Arrow keys / WASD to move. Reach the green tile to win.", { font: "16px Arial", fill: isDark ? "#e5e7eb" : "#111111" }).setScrollFactor(0);

                // Debug hint (initially hidden)
                this.hintText = this.add.text(10, 30, "[I] Toggle debug view", {
                    font: "12px Arial",
                    fill: isDark ? "#64748b" : "#666666"
                }).setScrollFactor(0).setVisible(false);

                // Debug overlay
                this.debugMode = false;
                this.debugGraphics = this.add.graphics();
                this.debugLabels = [];

                // Win text & Retry button
                this.winText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, "You win!", { font: "48px Arial", fill: isDark ? "#fff59d" : "#ffff66" }).setOrigin(0.5).setDepth(100).setVisible(false);

                this.retryButton = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 80, "Retry", {
                    font: "32px Arial",
                    fill: isDark ? "#ff9d9d" : "#ff5555",
                    backgroundColor: isDark ? "#111827" : "#222222",
                    padding: { x: 20, y: 10 },
                }).setOrigin(0.5).setDepth(100).setVisible(false)
                    .setInteractive({ useHandCursor: true })
                    .on("pointerdown", () => this.scene.restart());

                // Menu button
                this.menuButton = this.add.text(this.cameras.main.width - 10, 10, "Menu", {
                    font: "20px Arial",
                    fill: isDark ? "#ff9d9d" : "#ff5555",
                    backgroundColor: isDark ? "#111827" : "#222222",
                    padding: { x: 10, y: 5 }
                }).setOrigin(1, 0).setScrollFactor(0)
                    .setInteractive({ useHandCursor: true })
                    .on("pointerdown", () => this.scene.start("MainMenu"));

                applyBodyBg(isDark);
            }

            update() {
                if (!this.player || this.win) return;

                // Toggle debug on 'I' press
                if (Phaser.Input.Keyboard.JustDown(this.keyI)) {
                    this.debugMode = !this.debugMode;
                    this.hintText.setVisible(this.debugMode);
                    this.updateDebugOverlay();
                }

                const speed = 220;
                const body = this.player.body;
                let vx = 0, vy = 0;
                if (this.cursors.left.isDown || this.keysWASD.A.isDown) vx = -speed;
                else if (this.cursors.right.isDown || this.keysWASD.D.isDown) vx = speed;
                if (this.cursors.up.isDown || this.keysWASD.W.isDown) vy = -speed;
                else if (this.cursors.down.isDown || this.keysWASD.S.isDown) vy = speed;
                body.setVelocity(vx, vy);
            }

            updateDebugOverlay() {
                // Clear old debug visuals
                this.debugGraphics.clear();
                this.debugLabels.forEach(label => label.destroy());
                this.debugLabels = [];

                if (!this.debugMode) return;

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

                // Player
                drawDebugFor(this.player, "Player");

                // Finish
                drawDebugFor(this.finish, "Finish");

                // Walls (limit to avoid clutter)
                const maxWallLabels = 5;
                this.walls.forEach((wall, i) => {
                    const bounds = wall.getBounds();
                    this.debugGraphics.lineStyle(1, 0xff00ff, 0.6);
                    this.debugGraphics.strokeRectShape(bounds);

                    if (i < maxWallLabels) {
                        const wallText = this.add.text(bounds.x, bounds.y - 12, `Wall ${i}`, {
                            font: "8px monospace",
                            fill: "#ff00ff"
                        }).setScrollFactor(0).setDepth(1000);
                        this.debugLabels.push(wallText);
                    }
                });
            }

            shutdown() {
                // Clean up debug objects (optional, since scene restart re-creates everything)
                this.debugGraphics?.destroy();
                this.debugLabels?.forEach(l => l.destroy());
            }
        }

        // ------------------ Helpers ------------------
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

        function onWin(player, finish) {
            if (this.win) return;
            this.win = true;
            if (this.winText) this.winText.setVisible(true);
            if (this.retryButton) this.retryButton.setVisible(true);
            if (this.player && this.player.body) this.player.body.setVelocity(0, 0);
            this.tweens.add({ targets: finish, scaleX: 1.15, scaleY: 1.15, yoyo: true, repeat: 4, duration: 150 });
        }

        // ------------------ Phaser Game Config ------------------
        const config = {
            type: Phaser.AUTO,
            parent: gameParentRef.current,
            width: 800,
            height: 640,
            backgroundColor: readDarkMode() ? 0x0f172a : 0xffffff,
            physics: { default: "arcade", arcade: { gravity: { y: 0 }, debug: false } },
            scene: [MainMenu, MazeRunnerScene],
        };

        game = new Phaser.Game(config);

        window.addEventListener("storage", storageHandler);
        mo = new MutationObserver(() => {
            const nowDark = document.documentElement.classList.contains("dark");
            applyThemeToScene(game.scene.getScene("MazeRunnerScene"), nowDark);
            applyThemeToScene(game.scene.getScene("MainMenu"), nowDark);
            applyBodyBg(nowDark);
        });
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

        return () => {
            window.removeEventListener("storage", storageHandler);
            if (mo) mo.disconnect();
            if (game) { game.destroy(true); game = null; }
        };
    }, [navigate]);

    return (
        <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div ref={gameParentRef} />
        </div>
    );
};

export default MazeRunner;