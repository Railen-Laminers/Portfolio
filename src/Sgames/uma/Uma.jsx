// Uma.jsx
import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Phaser from "phaser";
import MainMenu from "./MainMenuScene";
import DebugOverlay from "./DebugOverlay";

// Character sprite
import s_idle from "../../assets/Characters/suzuka/s_idle.png"; // 3 frames & 192x64
import s_walk from "../../assets/Characters/suzuka/s_walk.png"; // 6 frames & 384x64
import s_run from "../../assets/Characters/suzuka/s_run.png"; // 6 frames & 384x64
import s_sprint from "../../assets/Characters/suzuka/s_sprint.png"; // 6 frames & 384x64
import s_stopSprint from "../../assets/Characters/suzuka/s_stopSprint.png"; // 3 frames & 192x64
import s_lowJump from "../../assets/Characters/suzuka/s_lowJump.png"; // 4 frames & 256x64
import s_sprintJump from "../../assets/Characters/suzuka/s_sprintJump.png"; // 7 frames & 448x64

// Ground & Decorations
import grass from "../../assets/GrassTileset/grass.png"; // 32x32
import grassPlatform from "../../assets/GrassTileset/grassPlatform.png"; // 96x32
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

        let wasSprinting = false;
        let isStoppingSprint = false;
        let isJumping = false;
        let isSprintJumping = false;
        let currentHorizontalSpeed = 0;

        const WALK_SPEED = 120;
        const RUN_SPEED = 200;
        const SPRINT_SPEED = 300;
        const LOW_JUMP_VELOCITY = -260;
        const SPRINT_JUMP_VELOCITY = -300;
        const AIR_CONTROL_FACTOR = 0.8;
        const INITIAL_JUMP_MOMENTUM_FACTOR = 0.7;

        const WORLD_WIDTH = 2400;
        const WORLD_HEIGHT = 600;
        const GROUND_LEVEL = WORLD_HEIGHT - 40;

        class UmaScene extends Phaser.Scene {
            constructor() {
                super({ key: "UmaScene" });
            }

            preload() {
                this.load.spritesheet("idle", s_idle, { frameWidth: 64, frameHeight: 64 });
                this.load.spritesheet("walk", s_walk, { frameWidth: 64, frameHeight: 64 });
                this.load.spritesheet("run", s_run, { frameWidth: 64, frameHeight: 64 });
                this.load.spritesheet("sprint", s_sprint, { frameWidth: 64, frameHeight: 64 });
                this.load.spritesheet("stopSprint", s_stopSprint, { frameWidth: 64, frameHeight: 64 });
                this.load.spritesheet("lowJump", s_lowJump, { frameWidth: 64, frameHeight: 64 });
                this.load.spritesheet("sprintJump", s_sprintJump, { frameWidth: 64, frameHeight: 64 });

                // Use only single grass asset
                this.load.image("grass", grass);

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

                this.load.image("sky", sky);
                this.load.image("cloud3", cloud3);
                this.load.image("cloud5", cloud5);
            }

            create() {
                this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
                this.createMenuButton();

                const skyBg = this.add.image(0, 0, "sky").setOrigin(0, 0);
                skyBg.displayWidth = WORLD_WIDTH;
                skyBg.displayHeight = WORLD_HEIGHT;
                skyBg.setScrollFactor(0, 0);
                skyBg.debugId = "skyBg";

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
                    clouds.add(cloud);
                });

                const dirtGraphics = this.add.graphics();
                dirtGraphics.fillStyle(0x8B5A2B, 1);
                dirtGraphics.fillRect(0, GROUND_LEVEL, WORLD_WIDTH, WORLD_HEIGHT - GROUND_LEVEL);
                dirtGraphics.setScrollFactor(1, 1);
                dirtGraphics.debugId = "dirtLayer";

                const groundGroup = this.physics.add.staticGroup();
                for (let x = 0; x < WORLD_WIDTH; x += 16) {
                    const tile = groundGroup.create(x, GROUND_LEVEL, "grass");
                    tile.setScale(1, 0.5).refreshBody();
                    tile.debugId = `groundTile_${x}`;
                }

                player = this.physics.add.sprite(200, GROUND_LEVEL - 70, "idle");
                player.setCollideWorldBounds(true);
                player.setBounce(0.1);
                player.setDrag(500);
                player.debugId = "player";

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
                    dec.setDepth(0);
                });

                // Store groups for debug overlay
                this.debugGroups = { ground: groundGroup, decorations: decor, clouds, player };

                this.physics.add.collider(player, groundGroup);

                this.anims.create({ key: "idle", frames: this.anims.generateFrameNumbers("idle", { start: 0, end: 2 }), frameRate: 6, repeat: -1 });
                this.anims.create({ key: "walk", frames: this.anims.generateFrameNumbers("walk", { start: 0, end: 5 }), frameRate: 10, repeat: -1 });
                this.anims.create({ key: "run", frames: this.anims.generateFrameNumbers("run", { start: 0, end: 5 }), frameRate: 12, repeat: -1 });
                this.anims.create({ key: "sprint", frames: this.anims.generateFrameNumbers("sprint", { start: 0, end: 5 }), frameRate: 14, repeat: -1 });
                this.anims.create({ key: "stopSprint", frames: this.anims.generateFrameNumbers("stopSprint", { start: 0, end: 2 }), frameRate: 10, repeat: 0 });
                this.anims.create({ key: "lowJump", frames: this.anims.generateFrameNumbers("lowJump", { start: 0, end: 3 }), frameRate: 10, repeat: 0 });
                this.anims.create({ key: "sprintJump", frames: this.anims.generateFrameNumbers("sprintJump", { start: 0, end: 6 }), frameRate: 12, repeat: 0 });

                keys = this.input.keyboard.addKeys({
                    left: "A",
                    right: "D",
                    up: "W",
                    run: "K",
                    sprint: "L",
                });

                this.input.keyboard.on("keydown-ESC", () => {
                    this.scene.start("MainMenu");
                });

                player.play("idle");

                this.cameras.main.startFollow(player, true, 0.1, 0.1, 0, 0);
                this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

                // Initialize debug overlay (automatically sets up 'I' toggle)
                this.debugOverlay = new DebugOverlay(this);

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

                this.menuButton = this.add.text(
                    750,
                    20,
                    "☰ Menu",
                    {
                        font: "18px Arial",
                        fill: btnText,
                        backgroundColor: btnBg,
                        padding: { x: 16, y: 8 },
                    })
                    .setOrigin(1, 0)
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

            update() {
                this.debugOverlay.update(player, this.debugGroups, WORLD_WIDTH, WORLD_HEIGHT, GROUND_LEVEL);

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
                } else if (keys.up.isDown && onGround && !sprintingInput) {
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

                if (!onGround) {
                    if (isSprintJumping) player.play("sprintJump", true);
                    else player.play("lowJump", true);
                    return;
                }

                if (sprintingInput) {
                    player.play("sprint", true);
                    wasSprinting = true;
                    return;
                }

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
            scene: [MainMenu, UmaScene],
        };

        game = new Phaser.Game(config);
        window.__exitToHome = () => navigate("/");

        return () => {
            if (game) game.destroy(true);
            delete window.__exitToHome;
        };
    }, [navigate]);

    return (
        <div style={{ width: "100vw", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div ref={gameRef} style={{ width: 800, height: 600 }} />
        </div>
    );
};

export default Uma;
