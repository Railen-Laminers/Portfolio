import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Phaser from "phaser";

// Character sprite
import s_idle from "../../assets/Characters/suzuka/s_idle.png"; // 3 frames & 192x64
import s_walk from "../../assets/Characters/suzuka/s_walk.png"; // 6 frames & 384x64
import s_run from "../../assets/Characters/suzuka/s_run.png"; // 6 frames & 384x64
import s_sprint from "../../assets/Characters/suzuka/s_sprint.png"; // 6 frames & 384x64
import s_stopSprint from "../../assets/Characters/suzuka/s_stopSprint.png"; // 3 frames & 192x64
import s_lowJump from "../../assets/Characters/suzuka/s_lowJump.png"; // 4 frames & 256x64
import s_sprintJump from "../../assets/Characters/suzuka/s_sprintJump.png"; // 7 frames & 448x64

// Ground & Decorations
import grass1 from "../../assets/GrassTileset/grass1.png"; // 16x16
import grass2 from "../../assets/GrassTileset/grass2.png"; // 16x16
import flower1 from "../../assets/Decorations/flower1.png"; // 19x23
import flower2 from "../../assets/Decorations/flower2.png"; // 15x18
import barrel from "../../assets/Decorations/barrel.png"; // 27x32
import rock3 from "../../assets/Decorations/rock3.png"; // 25x13
import stackedRocks from "../../assets/Decorations/stackedRocks.png"; // 49x35
import tree1 from "../../assets/Decorations/tree1.png"; // 105x148
import tree2 from "../../assets/Decorations/tree2.png"; // 99x137
import house from "../../assets/Decorations/house.png"; // 155x133
import fence1 from "../../assets/Decorations/fence1.png"; // 77x34
import woodenShed from "../../assets/Decorations/woodenShed.png"; // 116x68

// Clouds
import cloud3 from "../../assets/Decorations/cloud3.png"; // 131x22
import cloud5 from "../../assets/Decorations/cloud5.png"; // 101x28

// Backgrounds
import sky from "../../assets/Backgrounds/sky.png"; // 768x288

const Uma = () => {
    const gameRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        let game;
        let player;
        let keys;

        // State flags
        let wasSprinting = false;
        let isStoppingSprint = false;
        let isJumping = false;
        let isSprintJumping = false;
        let currentHorizontalSpeed = 0;

        // Debug mode
        let debugMode = false;
        let debugGraphics = null;
        let debugText = null;

        const WALK_SPEED = 120;              // The horizontal speed of the character while walking. Higher means the character moves faster while walking.
        const RUN_SPEED = 200;               // The horizontal speed while running. Higher = faster running.
        const SPRINT_SPEED = 300;            // The maximum horizontal speed when sprinting. Higher = faster sprinting. 
        const LOW_JUMP_VELOCITY = -260;      // Higher absolute value = jump goes higher/faster. Lower absolute value = shorter jump.
        const SPRINT_JUMP_VELOCITY = -300;   // Vertical speed for a jump while sprinting. Higher absolute value = higher jump when sprinting.
        const AIR_CONTROL_FACTOR = 0.8;      // 1 = full control, 0 = no control. Higher = easier to steer midair.
        const INITIAL_JUMP_MOMENTUM_FACTOR = 0.7; // Higher = keeps more of the running speed when jumping. Lower = jump "cuts" momentum more.

        const WORLD_WIDTH = 2400;
        const WORLD_HEIGHT = 600;
        const GROUND_LEVEL = WORLD_HEIGHT - 40; // Raised ground

        // ========== MAIN MENU SCENE ==========
        class MainMenu extends Phaser.Scene {
            constructor() {
                super({ key: "MainMenu" });
            }

            create() {
                // Read dark mode preference
                const isDark = this.readDarkMode();

                // Create animated background
                this.bgGraphics = this.add.graphics();
                this.drawMenuBackground(isDark);

                const textColor = isDark ? "#e5e7eb" : "#111111";
                const btnBg = isDark ? "#111827" : "#222222";
                const btnColor = isDark ? "#ff9d9d" : "#ff5555";

                const centerX = this.cameras.main.centerX;
                let startY = 180;
                const spacing = 75;

                // Title
                this.add.text(centerX, 80, "Uma Game", {
                    font: "48px Arial",
                    fill: textColor,
                    stroke: isDark ? "#ff9d9d" : "#ff5555",
                    strokeThickness: 4
                }).setOrigin(0.5);

                // Subtitle
                this.add.text(centerX, 130, "Suzuka's Adventure", {
                    font: "20px Arial",
                    fill: isDark ? "#c7d2fe" : "#6666ff",
                    fontStyle: "italic"
                }).setOrigin(0.5);

                // Create buttons
                const addButton = (label, callback) => {
                    const btn = this.add.text(centerX, startY, label, {
                        font: "32px Arial",
                        fill: btnColor,
                        backgroundColor: btnBg,
                        padding: { x: 30, y: 15 },
                        stroke: isDark ? "#ff6b6b" : "#ff3333",
                        strokeThickness: 2
                    })
                        .setOrigin(0.5)
                        .setInteractive({ useHandCursor: true })
                        .on("pointerdown", callback)
                        .on("pointerover", () => {
                            btn.setScale(1.1);
                            btn.setBackgroundColor(isDark ? "#1f2937" : "#333333");
                        })
                        .on("pointerout", () => {
                            btn.setScale(1);
                            btn.setBackgroundColor(btnBg);
                        });
                    startY += spacing;
                    return btn;
                };

                // Game buttons - using alert instead of modals
                addButton("Start Game", () => this.scene.start("UmaScene"));
                addButton("Controls", () => this.showControls());
                addButton("Credits", () => this.showCredits());
                addButton("Exit", () => navigate("/"));

                // Footer text - removed "Press I to use debug in menu"
                this.add.text(centerX, 520, "Suzuka's Adventure Awaits!", {
                    font: "16px Arial",
                    fill: isDark ? "#94a3b8" : "#666666"
                }).setOrigin(0.5);
            }

            readDarkMode() {
                try {
                    const stored = localStorage.getItem("darkMode");
                    if (stored !== null) return stored === "true";
                } catch { }
                return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
            }

            drawMenuBackground(isDark) {
                const color = isDark ? 0x1f2937 : 0xbfbfbf;
                const TILE_BG = 40;

                // Draw grid background
                for (let y = 0; y < this.cameras.main.height; y += TILE_BG) {
                    for (let x = 0; x < this.cameras.main.width; x += TILE_BG) {
                        const alpha = Math.random() * 0.1 + 0.05;
                        this.bgGraphics.fillStyle(color, alpha);
                        this.bgGraphics.fillRect(x, y, TILE_BG - 2, TILE_BG - 2);
                    }
                }


            }

            showControls() {
                const controlsText =
                    "CONTROLS\n" +
                    "══════════\n" +
                    "W - Jump\n" +
                    "A - Move Left\n" +
                    "D - Move Right\n" +
                    "K - Run\n" +
                    "L - Sprint\n\n" +
                    "Tips:\n" +
                    "• Hold Sprint (L) + Jump (W) for higher jump\n" +
                    "• Release Sprint while moving to see stop animation\n" +
                    "• Press I to toggle debug mode";

                alert(controlsText);
            }

            showCredits() {
                const creditsText =
                    "CREDITS\n" +
                    "══════════\n" +
                    "Character Sprite: Suzuka (Custom)\n" +
                    "Tile Assets: Grass Grass Pack\n" +
                    "Decoration Assets: Pixel Art Tiles and Backgrounds\n\n";

                alert(creditsText);
            }

            update() {
                // Animate background
                if (this.bgGraphics) {
                    this.bgGraphics.x -= 0.5;
                    if (this.bgGraphics.x < -50) this.bgGraphics.x = 0;
                }
            }
        }

        // ========== UMA GAME SCENE ==========
        class UmaScene extends Phaser.Scene {
            constructor() {
                super({ key: "UmaScene" });
            }

            preload() {
                // Character spritesheets
                this.load.spritesheet("idle", s_idle, { frameWidth: 64, frameHeight: 64 });
                this.load.spritesheet("walk", s_walk, { frameWidth: 64, frameHeight: 64 });
                this.load.spritesheet("run", s_run, { frameWidth: 64, frameHeight: 64 });
                this.load.spritesheet("sprint", s_sprint, { frameWidth: 64, frameHeight: 64 });
                this.load.spritesheet("stopSprint", s_stopSprint, { frameWidth: 64, frameHeight: 64 });
                this.load.spritesheet("lowJump", s_lowJump, { frameWidth: 64, frameHeight: 64 });
                this.load.spritesheet("sprintJump", s_sprintJump, { frameWidth: 64, frameHeight: 64 });

                // Map assets
                this.load.image("grass1", grass1);
                this.load.image("grass2", grass2);
                this.load.image("flower1", flower1);
                this.load.image("flower2", flower2);
                this.load.image("barrel", barrel);
                this.load.image("rock3", rock3);
                this.load.image("stackedRocks", stackedRocks);
                this.load.image("tree1", tree1);
                this.load.image("tree2", tree2);
                this.load.image("house", house);
                this.load.image("fence1", fence1);
                this.load.image("woodenShed", woodenShed);

                // Background
                this.load.image("sky", sky);
                this.load.image("cloud3", cloud3);
                this.load.image("cloud5", cloud5);
            }

            create() {
                this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

                // Create menu button
                this.createMenuButton();

                // Debug graphics object
                debugGraphics = this.add.graphics();
                debugGraphics.setDepth(1000);

                // Create debug text overlay
                debugText = this.add.text(10, 10, "", {
                    fontSize: "14px",
                    fill: "#e0f7ff", // Light cyan text
                    backgroundColor: "rgba(20, 40, 60, 0.85)", // Semi-transparent dark blue
                    padding: { x: 8, y: 6 },
                    stroke: "#1a3a5a", // Subtle outline
                    strokeThickness: 2
                });
                debugText.setScrollFactor(0);
                debugText.setDepth(1001);
                debugText.setVisible(false);

                // Debug toggle
                this.input.keyboard.on("keydown-I", () => {
                    debugMode = !debugMode;
                    debugText.setVisible(debugMode);
                    debugGraphics.clear();

                    if (!debugMode) {
                        debugText.setText("");
                    }
                });

                // === SKY BACKGROUND (static) ===
                const skyBg = this.add.image(0, 0, "sky").setOrigin(0, 0);
                skyBg.displayWidth = WORLD_WIDTH;
                skyBg.displayHeight = WORLD_HEIGHT;
                skyBg.setScrollFactor(0, 0);
                skyBg.debugId = "skyBg";

                // === CLOUDS ===
                const clouds = this.add.group();
                const cloudConfigs = [
                    { x: 300, y: 100, key: "cloud3", scrollX: 0.2 },
                    { x: 900, y: 80, key: "cloud5", scrollX: 0.15 },
                    { x: 1500, y: 120, key: "cloud3", scrollX: 0.25 },
                    { x: 2000, y: 90, key: "cloud5", scrollX: 0.18 },
                ];

                cloudConfigs.forEach((cfg, index) => {
                    const cloud = this.add.image(cfg.x, cfg.y, cfg.key);
                    cloud.setScrollFactor(cfg.scrollX, 0);
                    cloud.debugId = `cloud_${index + 1}`;
                    cloud.debugData = { type: "cloud", scrollFactor: cfg.scrollX };
                    clouds.add(cloud);
                });

                // === SOLID DIRT LAYER (fills from ground to bottom of screen) ===
                const dirtGraphics = this.add.graphics();
                dirtGraphics.fillStyle(0x8B5A2B, 1); // Rich brown: RGB(139, 90, 43)
                dirtGraphics.fillRect(0, GROUND_LEVEL, WORLD_WIDTH, WORLD_HEIGHT - GROUND_LEVEL);
                dirtGraphics.setScrollFactor(1, 1); // Scroll normally with world
                dirtGraphics.debugId = "dirtLayer";

                // === GRASS GROUND (on top of dirt) ===
                const groundGroup = this.physics.add.staticGroup();
                const groundTiles = [];
                for (let x = 0; x < WORLD_WIDTH; x += 16) {
                    const grassKey = x % 32 === 0 ? "grass1" : "grass2";
                    const tile = groundGroup.create(x, GROUND_LEVEL, grassKey);
                    tile.setScale(1, 0.5).refreshBody();
                    tile.debugId = `groundTile_${x}`;
                    groundTiles.push(tile);
                }

                // === PLAYER ===
                player = this.physics.add.sprite(200, GROUND_LEVEL - 70, "idle");
                player.setCollideWorldBounds(true);
                player.setBounce(0.1);
                player.setDrag(500);
                player.debugId = "player";
                player.debugData = {
                    type: "player",
                    state: "idle",
                    onGround: true,
                    velocity: { x: 0, y: 0 }
                };

                // === DECORATIONS ===
                const decor = this.add.group();
                const decorationConfigs = [
                    { type: "tree1", x: 300, y: GROUND_LEVEL },
                    { type: "tree2", x: 800, y: GROUND_LEVEL },
                    { type: "tree1", x: 1400, y: GROUND_LEVEL },
                    { type: "barrel", x: 500, y: GROUND_LEVEL },
                    { type: "rock3", x: 700, y: GROUND_LEVEL },
                    { type: "stackedRocks", x: 1100, y: GROUND_LEVEL },
                    { type: "house", x: 1600, y: GROUND_LEVEL },
                    { type: "woodenShed", x: 2000, y: GROUND_LEVEL },
                    { type: "fence1", x: 2100, y: GROUND_LEVEL },
                    { type: "flower1", x: 400, y: GROUND_LEVEL },
                    { type: "flower2", x: 420, y: GROUND_LEVEL },
                    { type: "flower1", x: 1200, y: GROUND_LEVEL },
                ];

                decorationConfigs.forEach((cfg, index) => {
                    const dec = decor.create(cfg.x, cfg.y, cfg.type);
                    dec.setOrigin(0.5, 1);
                    dec.debugId = `decor_${cfg.type}_${index}`;
                    dec.debugData = { type: cfg.type };
                    dec.setDepth(0);
                });

                // Store groups for debugging
                this.debugGroups = {
                    ground: groundGroup,
                    decorations: decor,
                    clouds: clouds,
                    player: player
                };

                // Collisions
                this.physics.add.collider(player, groundGroup);

                // Animations
                this.anims.create({ key: "idle", frames: this.anims.generateFrameNumbers("idle", { start: 0, end: 2 }), frameRate: 6, repeat: -1 });
                this.anims.create({ key: "walk", frames: this.anims.generateFrameNumbers("walk", { start: 0, end: 5 }), frameRate: 10, repeat: -1 });
                this.anims.create({ key: "run", frames: this.anims.generateFrameNumbers("run", { start: 0, end: 5 }), frameRate: 12, repeat: -1 });
                this.anims.create({ key: "sprint", frames: this.anims.generateFrameNumbers("sprint", { start: 0, end: 5 }), frameRate: 14, repeat: -1 });
                this.anims.create({ key: "stopSprint", frames: this.anims.generateFrameNumbers("stopSprint", { start: 0, end: 2 }), frameRate: 10, repeat: 0 });
                this.anims.create({ key: "lowJump", frames: this.anims.generateFrameNumbers("lowJump", { start: 0, end: 3 }), frameRate: 10, repeat: 0 });
                this.anims.create({ key: "sprintJump", frames: this.anims.generateFrameNumbers("sprintJump", { start: 0, end: 6 }), frameRate: 12, repeat: 0 });

                // Input
                keys = this.input.keyboard.addKeys({
                    left: "A",
                    right: "D",
                    up: "W",
                    run: "K",
                    sprint: "L",
                });

                // Add escape key to return to menu
                this.input.keyboard.on("keydown-ESC", () => {
                    this.scene.start("MainMenu");
                });

                player.play("idle");

                // Camera
                this.cameras.main.startFollow(player, true, 0.1, 0.1, 0, 0);
                this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

                // Add game instructions overlay (disappears after 5 seconds)
                const instructions = this.add.text(
                    this.cameras.main.centerX,
                    50,
                    "Use WASD to move, K to run, L to sprint\nPress ESC for menu",
                    {
                        font: "16px Arial",
                        fill: "#ffffff",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        padding: { x: 10, y: 5 },
                        align: "center"
                    }
                ).setOrigin(0.5, 0).setScrollFactor(0).setDepth(999);

                // Fade out instructions after 5 seconds
                this.time.delayedCall(5000, () => {
                    this.tweens.add({
                        targets: instructions,
                        alpha: 0,
                        duration: 1000,
                        onComplete: () => instructions.destroy()
                    });
                });
            }

            createMenuButton() {
                const isDark = this.readDarkMode();
                const btnBg = isDark ? "#111827" : "#222222";
                const btnHover = isDark ? "#1f2937" : "#333333";
                const btnText = isDark ? "#f1f5f9" : "#ffffff";

                // Create menu button in top-right corner
                this.menuButton = this.add.text(
                    750, // Position near top-right
                    20,
                    "☰ Menu",
                    {
                        font: "18px Arial",
                        fill: btnText,
                        backgroundColor: btnBg,
                        padding: { x: 16, y: 8 },
                    })
                    .setOrigin(1, 0) // Right-align
                    .setScrollFactor(0)
                    .setDepth(1000)
                    .setInteractive({ useHandCursor: true })
                    .on("pointerdown", () => {
                        this.scene.start("MainMenu");
                    })
                    .on("pointerover", () => {
                        this.tweens.add({
                            targets: this.menuButton,
                            scaleX: 1.08,
                            scaleY: 1.08,
                            duration: 150,
                            ease: "Power2"
                        });
                        this.menuButton.setBackgroundColor(btnHover);
                    })
                    .on("pointerout", () => {
                        this.tweens.add({
                            targets: this.menuButton,
                            scaleX: 1,
                            scaleY: 1,
                            duration: 150,
                            ease: "Power2"
                        });
                        this.menuButton.setBackgroundColor(btnBg);
                    });
            }

            readDarkMode() {
                try {
                    const stored = localStorage.getItem("darkMode");
                    if (stored !== null) return stored === "true";
                } catch { }
                return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
            }

            updateDebugInfo() {
                if (!debugMode) return;

                debugGraphics.clear();

                // Update player debug data
                player.debugData = {
                    type: "player",
                    state: player.anims.currentAnim ? player.anims.currentAnim.key : "unknown",
                    onGround: player.body.blocked.down,
                    velocity: {
                        x: Math.round(player.body.velocity.x),
                        y: Math.round(player.body.velocity.y)
                    },
                    position: {
                        x: Math.round(player.x),
                        y: Math.round(player.y)
                    }
                };

                // Collect debug info
                let debugInfo = [
                    "=== DEBUG MODE (Press I to toggle) ===",
                    `Player: ${player.debugData.state}`,
                    `Position: (${player.debugData.position.x}, ${player.debugData.position.y})`,
                    `Velocity: (${player.debugData.velocity.x}, ${player.debugData.velocity.y})`,
                    `On Ground: ${player.debugData.onGround}`,
                    `Facing: ${player.flipX ? "Left" : "Right"}`,
                    `Camera: (${Math.round(this.cameras.main.scrollX)}, ${Math.round(this.cameras.main.scrollY)})`,
                    "",
                    "=== OBJECTS IN VIEW ==="
                ];

                // Get camera bounds
                const camera = this.cameras.main;
                const cameraBounds = {
                    left: camera.scrollX,
                    right: camera.scrollX + camera.width,
                    top: camera.scrollY,
                    bottom: camera.scrollY + camera.height
                };

                let objectCount = 0;
                let decorInView = 0;
                let groundInView = 0;
                let cloudsInView = 0;

                // Draw player bounds (red with glow)
                debugGraphics.fillStyle(0xff0000, 0.1);
                const playerBounds = player.getBounds();
                debugGraphics.fillRect(playerBounds.x, playerBounds.y, playerBounds.width, playerBounds.height);
                debugGraphics.lineStyle(2, 0xff3333, 1);
                debugGraphics.strokeRect(playerBounds.x, playerBounds.y, playerBounds.width, playerBounds.height);

                // Draw player origin point
                debugGraphics.fillStyle(0xff0000, 0.8);
                debugGraphics.fillCircle(player.x, player.y, 4);

                debugInfo.push(`[PLAYER] (${Math.round(player.x)}, ${Math.round(player.y)}) 64x64`);
                objectCount++;

                // Draw ground tiles in view (light green)
                debugGraphics.lineStyle(1, 0x88ff88, 0.7);
                this.debugGroups.ground.children.iterate((tile) => {
                    const bounds = tile.getBounds();
                    if (bounds.x < cameraBounds.right && bounds.right > cameraBounds.left) {
                        debugGraphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
                        groundInView++;
                        objectCount++;
                    }
                });

                // Draw decorations in view (light blue)
                debugGraphics.lineStyle(2, 0x88aaff, 0.8);
                this.debugGroups.decorations.children.iterate((decor) => {
                    const bounds = decor.getBounds();
                    if (bounds.x < cameraBounds.right && bounds.right > cameraBounds.left) {
                        debugGraphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

                        // Draw center point
                        debugGraphics.fillStyle(0xffff88, 0.9);
                        debugGraphics.fillCircle(decor.x, decor.y, 3);

                        // Draw origin point (bottom center)
                        debugGraphics.fillStyle(0xff88ff, 0.9);
                        debugGraphics.fillCircle(decor.x, decor.y + decor.height / 2, 2);

                        decorInView++;
                        objectCount++;
                    }
                });

                // Draw clouds in view (light cyan)
                debugGraphics.lineStyle(1, 0x88ffff, 0.6);
                this.debugGroups.clouds.children.iterate((cloud) => {
                    const bounds = cloud.getBounds();
                    if (bounds.x < cameraBounds.right && bounds.right > cameraBounds.left) {
                        debugGraphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

                        // Draw scroll factor indicator
                        const scrollX = cloud.scrollFactorX || 0.5;
                        debugGraphics.lineStyle(1, 0xffff88, 0.8);
                        debugGraphics.lineBetween(
                            cloud.x - 10, cloud.y - 10,
                            cloud.x - 10 + (scrollX * 20), cloud.y - 10
                        );

                        cloudsInView++;
                        objectCount++;
                    }
                });

                // Draw world bounds (yellow)
                debugGraphics.lineStyle(2, 0xffff00, 0.4);
                debugGraphics.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

                // Draw ground level line (magenta)
                debugGraphics.lineStyle(2, 0xff88ff, 0.6);
                debugGraphics.lineBetween(0, GROUND_LEVEL, WORLD_WIDTH, GROUND_LEVEL);

                // Draw camera bounds (white)
                debugGraphics.lineStyle(2, 0xffffff, 0.3);
                debugGraphics.strokeRect(cameraBounds.left, cameraBounds.top, camera.width, camera.height);

                // Add statistics to debug info
                debugInfo.push(`Objects in view: ${objectCount}`);
                debugInfo.push(`Ground tiles: ${groundInView}`);
                debugInfo.push(`Decorations: ${decorInView}`);
                debugInfo.push(`Clouds: ${cloudsInView}`);
                debugInfo.push("");
                debugInfo.push("=== LEGEND ===");
                debugInfo.push("🔴 Player bounds & origin");
                debugInfo.push("🟢 Ground tiles");
                debugInfo.push("🔵 Decorations (yellow=center, pink=origin)");
                debugInfo.push("🟦 Clouds (yellow line=scroll speed)");
                debugInfo.push("🟡 World bounds | 🟪 Ground level | ⬜ Camera view");

                // Update debug text
                debugText.setText(debugInfo);
            }

            update() {
                // Update debug info first
                this.updateDebugInfo();

                // 🔒 Lock movement during stop sprint
                if (isStoppingSprint) {
                    player.setVelocityX(0);
                    return;
                }

                const movingLeft = keys.left.isDown;
                const movingRight = keys.right.isDown;
                const moving = movingLeft || movingRight;
                const sprintingInput = keys.sprint.isDown && moving;
                const onGround = player.body.blocked.down;

                if (onGround) {
                    isJumping = false;
                    isSprintJumping = false;
                    currentHorizontalSpeed = 0;
                }

                let targetSpeed = 0;
                if (sprintingInput) targetSpeed = SPRINT_SPEED;
                else if (keys.run.isDown && moving) targetSpeed = RUN_SPEED;
                else if (moving) targetSpeed = WALK_SPEED;

                if (movingLeft || movingRight) {
                    if (movingLeft) player.setFlipX(false);
                    else if (movingRight) player.setFlipX(true);

                    if (onGround) {
                        player.setVelocityX(movingLeft ? -targetSpeed : targetSpeed);
                        currentHorizontalSpeed = targetSpeed;
                    } else {
                        let airSpeed = isSprintJumping ? SPRINT_SPEED * AIR_CONTROL_FACTOR : targetSpeed * AIR_CONTROL_FACTOR;
                        player.setVelocityX(movingLeft ? -airSpeed : airSpeed);
                    }
                } else if (!onGround) {
                    if (isSprintJumping && currentHorizontalSpeed > 0) {
                        player.setVelocityX(player.flipX ? currentHorizontalSpeed * 0.9 : -currentHorizontalSpeed * 0.9);
                    } else if (isJumping && currentHorizontalSpeed > 0) {
                        player.setVelocityX(player.flipX ? currentHorizontalSpeed * 0.7 : -currentHorizontalSpeed * 0.7);
                    } else {
                        player.setVelocityX(player.body.velocity.x * 0.95);
                    }
                } else {
                    player.setVelocityX(0);
                    currentHorizontalSpeed = 0;
                }

                // 🏃‍♂️ SPRINT JUMP
                if (keys.up.isDown && onGround && sprintingInput) {
                    player.setVelocityY(SPRINT_JUMP_VELOCITY);
                    player.play("sprintJump", true);
                    isJumping = true;
                    isSprintJumping = true;
                    wasSprinting = true;

                    if (!moving) {
                        player.setVelocityX(player.flipX ? SPRINT_SPEED * INITIAL_JUMP_MOMENTUM_FACTOR : -SPRINT_SPEED * INITIAL_JUMP_MOMENTUM_FACTOR);
                        currentHorizontalSpeed = SPRINT_SPEED;
                    }
                }
                // 🦘 LOW JUMP
                else if (keys.up.isDown && onGround && !sprintingInput) {
                    player.setVelocityY(LOW_JUMP_VELOCITY);
                    player.play("lowJump", true);
                    isJumping = true;

                    let jumpMomentumSpeed = keys.run.isDown ? RUN_SPEED : moving ? WALK_SPEED : WALK_SPEED;
                    if (!moving) {
                        player.setVelocityX(player.flipX ? jumpMomentumSpeed * INITIAL_JUMP_MOMENTUM_FACTOR : -jumpMomentumSpeed * INITIAL_JUMP_MOMENTUM_FACTOR);
                        currentHorizontalSpeed = jumpMomentumSpeed;
                    } else {
                        currentHorizontalSpeed = jumpMomentumSpeed;
                    }
                }

                // ✈️ Air animations
                if (!onGround) {
                    if (isSprintJumping) player.play("sprintJump", true);
                    else player.play("lowJump", true);
                    return;
                }

                // 🏃 Sprinting
                if (sprintingInput) {
                    player.play("sprint", true);
                    wasSprinting = true;
                    return;
                }

                // 🛑 STOP SPRINT
                if (wasSprinting && (!keys.sprint.isDown || !moving)) {
                    wasSprinting = false;
                    isStoppingSprint = true;
                    player.setVelocityX(0);
                    player.play("stopSprint");

                    player.once("animationcomplete-stopSprint", () => {
                        isStoppingSprint = false;
                        if (keys.run.isDown && (keys.left.isDown || keys.right.isDown)) player.play("run", true);
                        else if (keys.left.isDown || keys.right.isDown) player.play("walk", true);
                        else player.play("idle", true);
                    });
                    return;
                }

                // Normal movement
                if (keys.run.isDown && moving) {
                    player.play("run", true);
                    return;
                }
                if (moving) {
                    player.play("walk", true);
                    return;
                }

                player.play("idle", true);
            }
        }

        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: gameRef.current,
            physics: {
                default: "arcade",
                arcade: {
                    gravity: { y: 800 },
                    debug: false,
                },
            },
            scene: [MainMenu, UmaScene], // Start with MainMenu
        };

        game = new Phaser.Game(config);

        return () => {
            if (game) game.destroy(true);
        };
    }, [navigate]);

    return (
        <div style={{ width: "100vw", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div ref={gameRef} style={{ width: 800, height: 600 }} />
        </div>
    );
};

export default Uma;