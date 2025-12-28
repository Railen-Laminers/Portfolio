// src/Sgames/uma/Uma.jsx
import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Phaser from "phaser";

// Assets
import s_idle from "../../assets/Characters/suzuka/s_idle.png";
import s_walk from "../../assets/Characters/suzuka/s_walk.png";
import s_run from "../../assets/Characters/suzuka/s_run.png";
import s_sprint from "../../assets/Characters/suzuka/s_sprint.png";
import s_stopSprint from "../../assets/Characters/suzuka/s_stopSprint.png";
import s_lowJump from "../../assets/Characters/suzuka/s_lowJump.png";
import s_sprintJump from "../../assets/Characters/suzuka/s_sprintJump.png";

import grass from "../../assets/GrassTileset/grass.png";
import fence1 from "../../assets/Decorations/fence1.png";
import cloud3 from "../../assets/Decorations/cloud3.png";
import cloud5 from "../../assets/Decorations/cloud5.png";
import sky from "../../assets/Backgrounds/sky.png";

const Uma = () => {
    const gameRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        // ───────────────────────────────────────
        // 🎮 GAME CONFIGURATION — TUNE HERE!
        // ───────────────────────────────────────
        const GAME_CONFIG = {
            // 🖥️ Display
            WIDTH: 720,
            HEIGHT: 510,

            // 🌍 World
            GROUND_Y: 462,           // Y position of ground (higher = lower ground)
            GRAVITY: 1600,           // Strength of downward pull

            // 🦘 Jump
            JUMP_VELOCITY: -500,     // Upward force when jumping (more negative = higher jump)
            JUMP_KEYS: [             // Keys that trigger jump
                Phaser.Input.Keyboard.KeyCodes.UP,
                Phaser.Input.Keyboard.KeyCodes.W,
                Phaser.Input.Keyboard.KeyCodes.SPACE,
            ],

            // 🏃 Player
            PLAYER_START_X: 100,     // X position at spawn
            PLAYER_HITBOX: {         // Hitbox relative to sprite (centered + snug)
                width: 32,
                height: 48,
                offsetX: 16,         // (64 - 32) / 2 → centered horizontally
                offsetY: 16,         // Raised slightly from bottom
            },

            // 🚧 Obstacles (fences)
            FENCE_SPAWN_INTERVAL: 1500, // ms between spawns
            FENCE_X_SPAWN: 760,      // Spawn off-screen right
            FENCE_BASE_Y_OFFSET: -5, // Visual offset from ground
            FENCE_SCALE_X: 0.55,     // Horizontal scale
            FENCE_HEIGHT_VARIANTS: [1.0, 1.3], // Short / tall
            FENCE_HITBOX: {          // Hitbox as % of visual size
                widthFactor: 0.8,    // 80% of visual width
                heightFactor: 0.85,  // 85% of visual height
            },

            // 📈 Progression
            SPEED_INCREMENT: 0.5,    // Speed added every 5 points

            // 💥 Bump Feedback
            KNOCKBACK_X: -200,       // Horizontal knockback force on hit
            KNOCKBACK_Y: -100,       // Small upward pop
            BUMP_DURATION: 300,      // ms before game over (lets animation play)
        };

        const { WIDTH, HEIGHT, GROUND_Y } = GAME_CONFIG;

        // ======================
        // MAIN MENU SCENE
        // ======================
        class UmaMainMenu extends Phaser.Scene {
            constructor() {
                super("UmaMainMenu");
            }

            preload() {
                this.load.image("sky", sky);
                this.load.image("cloud3", cloud3);
                this.load.image("cloud5", cloud5);
            }

            create() {
                const isDark = this.readDarkMode();
                this.add.image(0, 0, "sky").setOrigin(0).setDisplaySize(WIDTH, HEIGHT);
                this.add.image(200, 80, "cloud3").setAlpha(0.6);
                this.add.image(500, 120, "cloud5").setAlpha(0.7);

                const textColor = isDark ? "#f1f5f9" : "#1e293b";
                const btnBg = isDark ? "#1e293b" : "#dbeafe";
                const btnColor = isDark ? "#fbbf24" : "#92400e";

                this.add.text(WIDTH / 2, 100, "UMA RUNNER", {
                    fontSize: "48px",
                    fill: textColor,
                    stroke: isDark ? "#f59e0b" : "#7c2d12",
                    strokeThickness: 3,
                    fontFamily: "Arial"
                }).setOrigin(0.5);

                let y = 200;
                const spacing = 70;

                const addButton = (text, callback) => {
                    const btn = this.add.text(WIDTH / 2, y, text, {
                        fontSize: "32px",
                        fill: btnColor,
                        backgroundColor: btnBg,
                        padding: { x: 24, y: 12 },
                        fontFamily: "Arial"
                    })
                        .setOrigin(0.5)
                        .setInteractive({ useHandCursor: true })
                        .on("pointerdown", callback)
                        .on("pointerover", () => btn.setScale(1.08))
                        .on("pointerout", () => btn.setScale(1));
                    y += spacing;
                    return btn;
                };

                addButton("Start Game", () => this.scene.start("UmaGame"));
                addButton("Controls", () => {
                    alert(
                        "CONTROLS\n" +
                        "W / ↑ / SPACE: Jump\n" +
                        "\nPress [I] during game for debug view\n" +
                        "Press [ESC] to return to menu"
                    );
                });
                addButton("Credits", () => {
                    alert(
                        "CREDITS\n" +
                        "Character: Suzuka Sprite\n" +
                        "Art: Custom Tileset\n" +
                        "Game Design: Railen"
                    );
                });
                addButton("Exit", () => {
                    this.scene.systems.game.exitCallback?.();
                });
            }

            readDarkMode() {
                try {
                    const stored = localStorage.getItem("darkMode");
                    if (stored !== null) return stored === "true";
                } catch { }
                return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
            }
        }

        // ======================
        // GAME SCENE
        // ======================
        class UmaGame extends Phaser.Scene {
            constructor() {
                super("UmaGame");
            }

            preload() {
                // Load ALL assets
                this.load.spritesheet("s_idle", s_idle, { frameWidth: 64, frameHeight: 64 });
                this.load.spritesheet("s_walk", s_walk, { frameWidth: 64, frameHeight: 64 });
                this.load.spritesheet("s_run", s_run, { frameWidth: 64, frameHeight: 64 });
                this.load.spritesheet("s_sprint", s_sprint, { frameWidth: 64, frameHeight: 64 });
                this.load.spritesheet("s_stopSprint", s_stopSprint, { frameWidth: 64, frameHeight: 64 });
                this.load.spritesheet("s_lowJump", s_lowJump, { frameWidth: 64, frameHeight: 64 });
                this.load.spritesheet("s_sprintJump", s_sprintJump, { frameWidth: 64, frameHeight: 64 });

                this.load.image("sky", sky);
                this.load.image("cloud3", cloud3);
                this.load.image("cloud5", cloud5);
                this.load.image("grass", grass);
                this.load.image("fence1", fence1);
            }

            create() {
                const {
                    GROUND_Y,
                    PLAYER_START_X,
                    PLAYER_HITBOX,
                    JUMP_KEYS
                } = GAME_CONFIG;

                this.gameStarted = false;
                this.localGameOver = false;
                this.score = 0;
                this.gameSpeed = 5;
                this.obstacles = [];
                this.obstacleTimer = 0;
                this.isBumping = false; // 👈 Prevent multiple bumps

                // Background
                this.add.image(0, 0, "sky").setOrigin(0).setDisplaySize(WIDTH, HEIGHT);
                this.add.rectangle(WIDTH / 2, HEIGHT - 25, WIDTH, 50, 0x8b4513);

                // Clouds
                this.clouds = this.add.group();
                this.clouds.add(this.add.image(200, 80, "cloud3").setAlpha(0.8));
                this.clouds.add(this.add.image(500, 120, "cloud5").setAlpha(0.8));

                // Ground
                this.groundGroup = this.physics.add.staticGroup();
                for (let x = 0; x < WIDTH; x += 16) {
                    this.groundGroup.create(x, GROUND_Y, "grass").setOrigin(0, 1);
                }

                // Player
                this.player = this.physics.add.sprite(PLAYER_START_X, GROUND_Y - 16, "s_idle");
                this.player.setOrigin(0.5, 1);
                this.player.setFlipX(true);
                this.player.setCollideWorldBounds(true);

                // ✅ CENTERED HITBOX: snug and aligned
                this.player.body.setSize(
                    PLAYER_HITBOX.width,
                    PLAYER_HITBOX.height
                );
                this.player.body.setOffset(
                    PLAYER_HITBOX.offsetX,
                    PLAYER_HITBOX.offsetY
                );

                this.physics.add.collider(this.player, this.groundGroup);

                // Animations
                this.anims.create({ key: "idle", frames: this.anims.generateFrameNumbers("s_idle", { start: 0, end: 2 }), frameRate: 3, repeat: -1 });
                this.anims.create({ key: "walk", frames: this.anims.generateFrameNumbers("s_walk", { start: 0, end: 5 }), frameRate: 10, repeat: -1 });
                this.anims.create({ key: "run", frames: this.anims.generateFrameNumbers("s_run", { start: 0, end: 5 }), frameRate: 12, repeat: -1 });
                this.anims.create({ key: "sprint", frames: this.anims.generateFrameNumbers("s_sprint", { start: 0, end: 5 }), frameRate: 15, repeat: -1 });
                this.anims.create({ key: "stopSprint", frames: this.anims.generateFrameNumbers("s_stopSprint", { start: 0, end: 2 }), frameRate: 10 });
                this.anims.create({ key: "lowJump", frames: this.anims.generateFrameNumbers("s_lowJump", { start: 0, end: 3 }), frameRate: 12 });
                this.anims.create({ key: "sprintJump", frames: this.anims.generateFrameNumbers("s_sprintJump", { start: 0, end: 6 }), frameRate: 15 });

                this.player.play("idle");

                // Input
                this.cursors = this.input.keyboard.createCursorKeys();
                this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
                this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
                this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
                this.debugMode = false;

                this.scoreText = this.add.text(16, 16, "Score: 0", { fontSize: "20px", fill: "#000" });

                // ESC → Main Menu
                this.input.keyboard.on("keydown-ESC", () => {
                    this.scene.start("UmaMainMenu");
                });

                // Countdown
                const text = this.add.text(WIDTH / 2, HEIGHT / 2, "3", { fontSize: "64px", fill: "#000" }).setOrigin(0.5);
                let count = 3;
                this.time.addEvent({
                    delay: 1000,
                    repeat: 2,
                    callback: () => {
                        count--;
                        if (count > 0) text.setText(count);
                        else {
                            text.setText("");
                            this.gameStarted = true;
                            this.player.play("walk");
                        }
                    },
                });

                // Game Over UI
                this.gameOverText = this.add.text(WIDTH / 2, HEIGHT / 2 - 40, "Game Over", { fontSize: "48px", fill: "#ff3333" })
                    .setOrigin(0.5).setVisible(false);
                this.finalScoreText = this.add.text(WIDTH / 2, HEIGHT / 2 + 20, "", { fontSize: "28px", fill: "#000" })
                    .setOrigin(0.5).setVisible(false);
                this.retryButton = this.add.text(WIDTH / 2, HEIGHT / 2 + 80, "Retry", {
                    fontSize: "32px",
                    fill: "#fff",
                    backgroundColor: "#e53e3e",
                    padding: { x: 20, y: 10 }
                }).setOrigin(0.5).setVisible(false).setInteractive().on("pointerdown", () => this.scene.restart());

                this.menuButton = this.add.text(WIDTH / 2, HEIGHT / 2 + 140, "Main Menu", {
                    fontSize: "28px",
                    fill: "#fff",
                    backgroundColor: "#3182ce",
                    padding: { x: 20, y: 10 }
                }).setOrigin(0.5).setVisible(false).setInteractive().on("pointerdown", () => this.scene.start("UmaMainMenu"));

                // Debug
                this.debugGraphics = null;
                this.debugLabels = [];

                this.events.on("shutdown", this.cleanupDebug, this);
            }

            update(time, delta) {
                if (!this.gameStarted || this.localGameOver) {
                    if (this.debugMode) this.updateDebug();
                    return;
                }

                // Toggle debug
                if (Phaser.Input.Keyboard.JustDown(this.keyI)) {
                    this.debugMode = !this.debugMode;
                    this.updateDebug();
                }

                // Clouds
                this.clouds.children.iterate(c => {
                    c.x -= 0.3;
                    if (c.x < -150) c.x = 850;
                });

                // ✅ JUMP: W / UP / SPACE
                const { JUMP_KEYS } = GAME_CONFIG;
                const jumpPressed = JUMP_KEYS.some(keyCode => {
                    const key = this.input.keyboard.addKey(keyCode);
                    return Phaser.Input.Keyboard.JustDown(key);
                });

                if (jumpPressed && this.player.body.blocked.down) {
                    this.player.setVelocityY(GAME_CONFIG.JUMP_VELOCITY);
                    this.player.play(this.gameSpeed >= 7 ? "sprintJump" : "lowJump", true);
                }

                // Animation
                if (this.player.body.blocked.down && !this.player.anims.isPlaying) {
                    if (this.gameSpeed < 7) this.player.play("walk", true);
                    else if (this.gameSpeed < 10) this.player.play("run", true);
                    else this.player.play("sprint", true);
                }

                // Spawn fences
                const { FENCE_SPAWN_INTERVAL, FENCE_X_SPAWN, FENCE_BASE_Y_OFFSET, FENCE_SCALE_X, FENCE_HEIGHT_VARIANTS, FENCE_HITBOX } = GAME_CONFIG;
                this.obstacleTimer += delta;
                if (this.obstacleTimer > FENCE_SPAWN_INTERVAL) {
                    this.obstacleTimer = 0;
                    const heightScale = Phaser.Utils.Array.GetRandom(FENCE_HEIGHT_VARIANTS);
                    const baseY = GROUND_Y + FENCE_BASE_Y_OFFSET;

                    const fence = this.physics.add.image(FENCE_X_SPAWN, baseY, "fence1");
                    fence.setOrigin(0.5, 1);
                    fence.setScale(FENCE_SCALE_X, heightScale);

                    // ✅ CENTERED & FAIR HITBOX
                    const displayWidth = fence.width * FENCE_SCALE_X;
                    const displayHeight = fence.height * heightScale;
                    const hitboxWidth = displayWidth * FENCE_HITBOX.widthFactor;
                    const hitboxHeight = displayHeight * FENCE_HITBOX.heightFactor;

                    fence.body.setSize(hitboxWidth, hitboxHeight);
                    fence.body.setOffset(
                        (fence.width - hitboxWidth) / 2,   // Center horizontally
                        fence.height - hitboxHeight        // Align to bottom
                    );

                    fence.body.allowGravity = false;
                    fence.setImmovable(true);
                    this.obstacles.push(fence);
                }

                // Update obstacles & check collision
                for (let i = this.obstacles.length - 1; i >= 0; i--) {
                    const obs = this.obstacles[i];
                    obs.x -= this.gameSpeed;

                    if (this.physics.overlap(this.player, obs)) {
                        if (!this.isBumping) {
                            this.isBumping = true;
                            this.onBump(); // 👈 Trigger knockback + animation
                        }
                        return;
                    }

                    if (obs.x < -50) {
                        obs.destroy();
                        this.obstacles.splice(i, 1);
                        this.score++;
                        this.scoreText.setText(`Score: ${this.score}`);
                        if (this.score % 5 === 0) this.gameSpeed += GAME_CONFIG.SPEED_INCREMENT;
                    }
                }

                if (this.debugMode) this.updateDebug();
            }

            // 💥 New: Bump reaction with knockback and animation
            onBump() {
                // Play stop sprint animation
                this.player.play("stopSprint", true);

                // Apply knockback
                this.player.setVelocityX(GAME_CONFIG.KNOCKBACK_X);
                this.player.setVelocityY(GAME_CONFIG.KNOCKBACK_Y);

                // Freeze gameplay during bump
                this.gameStarted = false;

                // End game after animation
                this.time.delayedCall(GAME_CONFIG.BUMP_DURATION, () => {
                    this.onGameOver();
                });
            }

            // Updated: Simpler game over (animation already played)
            onGameOver() {
                this.localGameOver = true;
                this.player.setVelocity(0, 0); // Full stop

                this.gameOverText.setVisible(true);
                this.finalScoreText.setText(`Final Score: ${this.score}`).setVisible(true);
                this.retryButton.setVisible(true);
                this.menuButton.setVisible(true);
            }

            // 🔧 Debug Overlay
            updateDebug() {
                if (!this.debugMode) {
                    this.cleanupDebug();
                    return;
                }

                if (!this.debugGraphics) {
                    this.debugGraphics = this.add.graphics();
                    this.debugGraphics.setDepth(1000);
                    this.debugLabels = [];
                } else {
                    this.debugGraphics.clear();
                }

                this.debugLabels?.forEach(l => l.destroy?.());
                this.debugLabels = [];

                const drawBody = (obj, label, color = 0x00ffff) => {
                    const body = obj.body;
                    if (!body) return;
                    const x = body.x + body.offset.x;
                    const y = body.y + body.offset.y;
                    const w = body.width;
                    const h = body.height;
                    this.debugGraphics.lineStyle(2, color, 0.9);
                    this.debugGraphics.strokeRect(x, y, w, h);
                    const text = this.add.text(x, y - 18, `${label}`, { font: "12px monospace", fill: "#00ffff" }).setDepth(1001);
                    this.debugLabels.push(text);
                };

                drawBody(this.player, "Player", 0x00ffff);
                this.obstacles.forEach((obs, i) => drawBody(obs, `Fence ${i}`, 0xff00ff));
            }

            cleanupDebug() {
                if (this.debugGraphics) {
                    this.debugGraphics.destroy();
                    this.debugGraphics = null;
                }
                if (this.debugLabels) {
                    this.debugLabels.forEach(l => l.destroy?.());
                    this.debugLabels = [];
                }
            }
        }

        // ======================
        // PHASER GAME
        // ======================
        const config = {
            type: Phaser.AUTO,
            width: GAME_CONFIG.WIDTH,
            height: GAME_CONFIG.HEIGHT,
            parent: "uma-game-container",
            physics: {
                default: "arcade",
                arcade: {
                    gravity: { y: GAME_CONFIG.GRAVITY },
                    debug: false,
                },
            },
            scene: [UmaMainMenu, UmaGame],
        };

        const game = new Phaser.Game(config);
        game.exitCallback = () => navigate("/");

        gameRef.current = game;

        return () => {
            if (game) {
                try { game.destroy(true); } catch (e) { }
            }
        };
    }, [navigate]);

    return (
        <div style={{ width: "100%", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div id="uma-game-container" />
        </div>
    );
};

export default Uma;