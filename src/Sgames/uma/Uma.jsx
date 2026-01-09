// src/Sgames/uma/Uma.jsx
import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Phaser from "phaser";

const BASE = import.meta.env.BASE_URL || '/';

// Assets

// Suzuka
export const s_idle = `${BASE}assets/Characters/suzuka/S_idle.png`;
export const s_walk = `${BASE}assets/Characters/suzuka/S_walk.png`;
export const s_run = `${BASE}assets/Characters/suzuka/S_run.png`;
export const s_sprint = `${BASE}assets/Characters/suzuka/S_sprint.png`;
export const s_stopSprint = `${BASE}assets/Characters/suzuka/S_stopSprint.png`;
export const s_lowJump = `${BASE}assets/Characters/suzuka/S_lowJump.png`;
export const s_sprintJump = `${BASE}assets/Characters/suzuka/S_sprintJump.png`;

// Oguri
export const o_idle = `${BASE}assets/Characters/oguri/O_idle.png`;
export const o_walk = `${BASE}assets/Characters/oguri/O_walk.png`;
export const o_run = `${BASE}assets/Characters/oguri/O_run.png`;
export const o_sprint = `${BASE}assets/Characters/oguri/O_sprint.png`;
export const o_stopSprint = `${BASE}assets/Characters/oguri/O_stopSprint.png`;
export const o_lowJump = `${BASE}assets/Characters/oguri/O_lowJump.png`;
export const o_sprintJump = `${BASE}assets/Characters/oguri/O_sprintJump.png`;

// Mc Queen (full frame set)
export const mc_idle = `${BASE}assets/Characters/mcQueen/Mc_idle.png`;
export const mc_walk = `${BASE}assets/Characters/mcQueen/Mc_walk.png`;
export const mc_run = `${BASE}assets/Characters/mcQueen/Mc_run.png`;
export const mc_sprint = `${BASE}assets/Characters/mcQueen/Mc_sprint.png`;
export const mc_stopSprint = `${BASE}assets/Characters/mcQueen/Mc_stopSprint.png`;
export const mc_lowJump = `${BASE}assets/Characters/mcQueen/Mc_lowJump.png`;
export const mc_sprintJump = `${BASE}assets/Characters/mcQueen/Mc_sprintJump.png`;

export const grass = `${BASE}assets/GrassTileset/Grass.png`;
export const fence1 = `${BASE}assets/Decorations/Fence1.png`;
export const cloud3 = `${BASE}assets/Decorations/Cloud3.png`;
export const cloud5 = `${BASE}assets/Decorations/Cloud5.png`;
export const sky = `${BASE}assets/Backgrounds/Sky.png`;

// Character mapping (keys used as labels)
const CHARACTERS = {
    Suzuka: {
        idle: s_idle,
        walk: s_walk,
        run: s_run,
        sprint: s_sprint,
        stopSprint: s_stopSprint,
        lowJump: s_lowJump,
        sprintJump: s_sprintJump,
    },
    Oguri: {
        idle: o_idle,
        walk: o_walk,
        run: o_run,
        sprint: o_sprint,
        stopSprint: o_stopSprint,
        lowJump: o_lowJump,
        sprintJump: o_sprintJump,
    },
    "Mc Queen": {
        idle: mc_idle,
        walk: mc_walk,
        run: mc_run,
        sprint: mc_sprint,
        stopSprint: mc_stopSprint,
        lowJump: mc_lowJump,
        sprintJump: mc_sprintJump,
    }
};

const STORAGE_KEY = "uma_selected_character";

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

        // Safe localStorage helpers
        const safeGet = (key, fallback = null) => {
            try {
                const v = localStorage.getItem(key);
                return v !== null ? v : fallback;
            } catch {
                return fallback;
            }
        };
        const safeSet = (key, value) => {
            try {
                localStorage.setItem(key, value);
            } catch { }
        };

        // ======================
        // MAIN MENU SCENE
        // ======================
        class UmaMainMenu extends Phaser.Scene {
            constructor() {
                super("UmaMainMenu");
                this.selectedCharacter = safeGet(STORAGE_KEY, "Suzuka");
            }

            preload() {
                this.load.image("sky", sky);
                this.load.image("cloud3", cloud3);
                this.load.image("cloud5", cloud5);

                // Load an *idle preview* spritesheet for every character so we can show animated previews in the menu
                Object.entries(CHARACTERS).forEach(([name, char]) => {
                    // unique key per-character to avoid colliding with game preload keys
                    this.load.spritesheet(`${name}_idle_preview`, char.idle, { frameWidth: 64, frameHeight: 64 });
                });
            }

            create() {
                const isDark = this.readDarkMode();
                this.add.image(0, 0, "sky").setOrigin(0).setDisplaySize(WIDTH, HEIGHT);
                this.add.image(200, 80, "cloud3").setAlpha(0.6);
                this.add.image(500, 120, "cloud5").setAlpha(0.7);

                const textColor = isDark ? "#f1f5f9" : "#1e293b";
                const btnBg = isDark ? "#1e293b" : "#dbeafe";
                const btnColor = isDark ? "#fbbf24" : "#92400e";

                this.add.text(WIDTH / 2, 60, "UMA", {
                    fontSize: "48px",
                    fill: textColor,
                    stroke: isDark ? "#f59e0b" : "#7c2d12",
                    strokeThickness: 3,
                    fontFamily: "Arial"
                }).setOrigin(0.5);

                // ----- Character selector row (click a portrait to select) -----
                const characterNames = Object.keys(CHARACTERS);
                // starting x to center the row (100px spacing)
                const spacing = 120;
                const startX = WIDTH / 2 - ((characterNames.length - 1) * spacing) / 2;
                const y = 160;

                // Create an anim and portrait for each character
                this.characterWidgets = []; // keep references to update highlight
                characterNames.forEach((name, idx) => {
                    const safeName = name.replace(/\s+/g, "_");
                    const previewKey = `${name}_idle_preview`;
                    const animKey = `menu_idle_${safeName}`;

                    // create menu-only animation (if not exists)
                    if (!this.anims.exists(animKey)) {
                        this.anims.create({
                            key: animKey,
                            frames: this.anims.generateFrameNumbers(previewKey, { start: 0, end: 2 }),
                            frameRate: 4,
                            repeat: -1
                        });
                    }

                    const x = startX + idx * spacing;

                    // portrait sprite
                    const sprite = this.add.sprite(x, y, previewKey, 0).setScale(0.9).setInteractive({ useHandCursor: true });
                    sprite.play(animKey);

                    // label
                    const label = this.add.text(x, y + 46, name, {
                        fontSize: "16px",
                        fill: btnColor,
                        fontFamily: "Arial"
                    }).setOrigin(0.5);

                    // highlight rectangle (visible if selected)
                    const rect = this.add.rectangle(x, y - 6, 88, 88, 0xffffff, 0.08).setStrokeStyle(2, 0xffffff, 0.12);
                    rect.setOrigin(0.5);

                    // click handler
                    const choose = () => {
                        this.selectedCharacter = name;
                        safeSet(STORAGE_KEY, name);
                        // update visual highlight
                        this.characterWidgets.forEach(w => {
                            w.rect.setVisible(w.name === name);
                            w.label.setStyle({ fill: w.name === name ? "#ffffff" : btnColor });
                            w.sprite.setScale(w.name === name ? 1.02 : 0.9);
                        });
                    };

                    sprite.on("pointerdown", choose);
                    label.setInteractive({ useHandCursor: true }).on("pointerdown", choose);

                    this.characterWidgets.push({ name, sprite, label, rect });
                });

                // Initialize highlight based on stored selection
                if (!this.selectedCharacter || !characterNames.includes(this.selectedCharacter)) {
                    this.selectedCharacter = characterNames[0];
                    safeSet(STORAGE_KEY, this.selectedCharacter);
                }
                this.characterWidgets.forEach(w => {
                    w.rect.setVisible(w.name === this.selectedCharacter);
                    w.label.setStyle({ fill: w.name === this.selectedCharacter ? "#ffffff" : btnColor });
                    w.sprite.setScale(w.name === this.selectedCharacter ? 1.02 : 0.9);
                });

                // ----- Menu buttons ----- (positioned below selector)
                let by = 300;
                const addButton = (text, callback, opts = {}) => {
                    const btn = this.add.text(WIDTH / 2, by, text, {
                        fontSize: opts.fontSize ?? "28px",
                        fill: opts.fill ?? "#fff",
                        backgroundColor: opts.bg ?? "#3182ce",
                        padding: { x: 20, y: 10 },
                        fontFamily: "Arial"
                    })
                        .setOrigin(0.5)
                        .setInteractive({ useHandCursor: true })
                        .on("pointerdown", callback)
                        .on("pointerover", () => btn.setScale(1.04))
                        .on("pointerout", () => btn.setScale(1));
                    by += opts.spacing ?? 56;
                    return btn;
                };

                addButton("Start Game", () => {
                    safeSet(STORAGE_KEY, this.selectedCharacter ?? "Suzuka");
                    this.scene.start("UmaGame");
                }, { bg: "#e53e3e", fill: "#fff", fontSize: "32px", spacing: 66 });

                addButton("Controls", () => {
                    alert(
                        "CONTROLS\n" +
                        "W / ↑ / SPACE: Jump\n" +
                        "\nPress [I] during game for debug view\n" +
                        "Press [ESC] to return to menu \n" +
                        "Click a character portrait to select a character"
                    );
                }, { bg: btnBg, fill: btnColor });

                addButton("Credits", () => {
                    alert(
                        "CREDITS\n" +
                        `Character: ${this.selectedCharacter ?? "Suzuka"} Sprite\n` +
                        "Art: Custom Tileset\n" +
                        "Game Design: Railen"
                    );
                }, { bg: btnBg, fill: btnColor });

                addButton("Exit", () => {
                    this.scene.systems.game.exitCallback?.();
                }, { bg: btnBg, fill: btnColor });
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
                // --- Load BOTH characters at startup under unique keys ---
                Object.entries(CHARACTERS).forEach(([name, char]) => {
                    this.load.spritesheet(`${name}_idle`, char.idle, { frameWidth: 64, frameHeight: 64 });
                    this.load.spritesheet(`${name}_walk`, char.walk, { frameWidth: 64, frameHeight: 64 });
                    this.load.spritesheet(`${name}_run`, char.run, { frameWidth: 64, frameHeight: 64 });
                    this.load.spritesheet(`${name}_sprint`, char.sprint, { frameWidth: 64, frameHeight: 64 });
                    this.load.spritesheet(`${name}_stopSprint`, char.stopSprint, { frameWidth: 64, frameHeight: 64 });
                    this.load.spritesheet(`${name}_lowJump`, char.lowJump, { frameWidth: 64, frameHeight: 64 });
                    this.load.spritesheet(`${name}_sprintJump`, char.sprintJump, { frameWidth: 64, frameHeight: 64 });
                });

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

                let selected = "Suzuka";
                try {
                    const v = localStorage.getItem(STORAGE_KEY);
                    if (v) selected = v;
                } catch { }
                const pfx = selected;

                this.gameStarted = false;
                this.localGameOver = false;
                this.score = 0;
                this.gameSpeed = 5;
                this.obstacles = [];
                this.obstacleTimer = 0;
                this.isBumping = false;
                this.isInAir = false;

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
                this.player = this.physics.add.sprite(PLAYER_START_X, GROUND_Y - 16, `${pfx}_idle`);
                this.player.setOrigin(0.5, 1);
                this.player.setFlipX(true);
                this.player.setCollideWorldBounds(true);

                this.player.body.setSize(PLAYER_HITBOX.width, PLAYER_HITBOX.height);
                this.player.body.setOffset(PLAYER_HITBOX.offsetX, PLAYER_HITBOX.offsetY);

                this.physics.add.collider(this.player, this.groundGroup);

                // Remove old animations if any
                const animNames = ["idle", "walk", "run", "sprint", "stopSprint", "lowJump", "sprintJump"];
                animNames.forEach(a => {
                    if (this.anims.exists(a)) {
                        this.anims.remove(a);
                    }
                });

                // Define animations
                this.anims.create({ key: "idle", frames: this.anims.generateFrameNumbers(`${pfx}_idle`, { start: 0, end: 2 }), frameRate: 3, repeat: -1 });
                this.anims.create({ key: "walk", frames: this.anims.generateFrameNumbers(`${pfx}_walk`, { start: 0, end: 5 }), frameRate: 10, repeat: -1 });
                this.anims.create({ key: "run", frames: this.anims.generateFrameNumbers(`${pfx}_run`, { start: 0, end: 5 }), frameRate: 12, repeat: -1 });
                this.anims.create({ key: "sprint", frames: this.anims.generateFrameNumbers(`${pfx}_sprint`, { start: 0, end: 5 }), frameRate: 15, repeat: -1 });
                this.anims.create({ key: "stopSprint", frames: this.anims.generateFrameNumbers(`${pfx}_stopSprint`, { start: 0, end: 2 }), frameRate: 10 });
                this.anims.create({ key: "lowJump", frames: this.anims.generateFrameNumbers(`${pfx}_lowJump`, { start: 0, end: 3 }), frameRate: 12 });
                this.anims.create({ key: "sprintJump", frames: this.anims.generateFrameNumbers(`${pfx}_sprintJump`, { start: 0, end: 6 }), frameRate: 15 });

                this.player.play("idle");

                // Input
                this.cursors = this.input.keyboard.createCursorKeys();
                this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
                this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
                this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
                this.debugMode = false;

                // Mobile tap-to-jump
                this.input.on('pointerdown', () => {
                    if (this.gameStarted && !this.localGameOver && this.player.body.blocked.down) {
                        this.player.setVelocityY(GAME_CONFIG.JUMP_VELOCITY);
                        this.isInAir = true;
                        this.player.play(this.gameSpeed >= 7 ? "sprintJump" : "lowJump", true);
                    }
                });

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

                // 🔥 CRITICAL: Listen for jump animation completion
                this.player.on('animationcomplete-lowJump', this.onJumpLanded, this);
                this.player.on('animationcomplete-sprintJump', this.onJumpLanded, this);

                // Debug
                this.debugGraphics = null;
                this.debugLabels = [];
                this.events.on("shutdown", this.cleanupDebug, this);
            }

            onJumpLanded() {
                // Only transition to ground animation if:
                // - Game is active
                // - Not bumping/knocked down
                // - Player is actually on the ground
                if (this.gameStarted && !this.localGameOver && !this.isBumping && this.player.body.blocked.down) {
                    let desired = "walk";
                    if (this.gameSpeed >= 10) desired = "sprint";
                    else if (this.gameSpeed >= 7) desired = "run";
                    this.player.play(desired, true);
                }
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

                // Jump input
                const { JUMP_KEYS } = GAME_CONFIG;
                const jumpPressed = JUMP_KEYS.some(keyCode => {
                    const key = this.input.keyboard.addKey(keyCode);
                    return Phaser.Input.Keyboard.JustDown(key);
                });

                if (jumpPressed && this.player.body.blocked.down && !this.isInAir) {
                    this.player.setVelocityY(GAME_CONFIG.JUMP_VELOCITY);
                    this.isInAir = true;
                    this.player.play(this.gameSpeed >= 7 ? "sprintJump" : "lowJump", true);
                }

                // Landing: mark isInAir = false as soon as grounded
                if (this.isInAir && this.player.body.blocked.down) {
                    this.isInAir = false;
                    // ⚠️ Do NOT change animation here — wait for animationcomplete!
                }

                // ✅ Prevent ground logic from overriding jump animations
                const isPlayingJump = this.player.anims.isPlaying &&
                    (this.player.anims.currentAnim.key === "lowJump" ||
                        this.player.anims.currentAnim.key === "sprintJump");

                // Only apply ground animation if NOT in air AND NOT playing a jump
                if (!this.isInAir && this.player.body.blocked.down && !isPlayingJump) {
                    let desired = "walk";
                    if (this.gameSpeed >= 10) desired = "sprint";
                    else if (this.gameSpeed >= 7) desired = "run";

                    if (this.player.anims.currentAnim?.key !== desired) {
                        this.player.play(desired, true);
                    }
                }

                // Obstacle spawning & collision
                const { FENCE_SPAWN_INTERVAL, FENCE_X_SPAWN, FENCE_BASE_Y_OFFSET, FENCE_SCALE_X, FENCE_HEIGHT_VARIANTS, FENCE_HITBOX } = GAME_CONFIG;
                this.obstacleTimer += delta;
                if (this.obstacleTimer > FENCE_SPAWN_INTERVAL) {
                    this.obstacleTimer = 0;
                    const heightScale = Phaser.Utils.Array.GetRandom(FENCE_HEIGHT_VARIANTS);
                    const baseY = GROUND_Y + FENCE_BASE_Y_OFFSET;

                    const fence = this.physics.add.image(FENCE_X_SPAWN, baseY, "fence1");
                    fence.setOrigin(0.5, 1);
                    fence.setScale(FENCE_SCALE_X, heightScale);

                    const displayWidth = fence.width * FENCE_SCALE_X;
                    const displayHeight = fence.height * heightScale;
                    const hitboxWidth = displayWidth * FENCE_HITBOX.widthFactor;
                    const hitboxHeight = displayHeight * FENCE_HITBOX.heightFactor;

                    fence.body.setSize(hitboxWidth, hitboxHeight);
                    fence.body.setOffset(
                        (fence.width - hitboxWidth) / 2,
                        fence.height - hitboxHeight
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
                            this.onBump();
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

            onBump() {
                this.player.play("stopSprint", true);
                this.player.setVelocityX(GAME_CONFIG.KNOCKBACK_X);
                this.player.setVelocityY(GAME_CONFIG.KNOCKBACK_Y);
                this.gameStarted = false;

                this.time.delayedCall(GAME_CONFIG.BUMP_DURATION, () => {
                    this.onGameOver();
                });
            }

            onGameOver() {
                this.localGameOver = true;
                this.player.setVelocity(0, 0);

                this.gameOverText.setVisible(true);
                this.finalScoreText.setText(`Final Score: ${this.score}`).setVisible(true);
                this.retryButton.setVisible(true);
                this.menuButton.setVisible(true);
            }

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
        // PHASER GAME — centered & responsive
        // ======================
        const config = {
            type: Phaser.AUTO,
            width: GAME_CONFIG.WIDTH,      // Logical width (720)
            height: GAME_CONFIG.HEIGHT,    // Logical height (510)
            parent: "uma-game-container",
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
            },
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

    // ✅ Fixed full-screen container — lets Phaser handle centering
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                touchAction: 'none',
                backgroundColor: '#000', // optional: avoids white flash on load
            }}
        >
            <div id="uma-game-container" />
        </div>
    );
};

export default Uma;
