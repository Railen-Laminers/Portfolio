import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Phaser from "phaser";
const BASE = import.meta.env.BASE_URL || '/';

// MazeRunner assets
export const brick = `${BASE}assets/BrickTileset/Brick.png`;
export const brickBlack = `${BASE}assets/BrickTileset/BrickBlack.png`;
export const breakableBrick = `${BASE}assets/BrickTileset/XBrick.png`;
export const womenMc = `${BASE}assets/Characters/WomenMc.png`;
export const enemy = `${BASE}assets/Characters/Enemy.png`;

// Randomize Jumpscare images
export const ed1 = `${BASE}assets/Jumpscare/Ed1.jpg`;
export const ed2 = `${BASE}assets/Jumpscare/Ed2.jpg`;
export const ed3 = `${BASE}assets/Jumpscare/Ed3.jpg`;
export const ed4 = `${BASE}assets/Jumpscare/Ed4.jpg`;
export const ed5 = `${BASE}assets/Jumpscare/Ed5.jpg`;

export const jumpscareSound = `${BASE}assets/Sounds/Death.mp3`; // ~4 seconds

// Scenes & Debug
import { MainMenuScene } from "./MainMenuScene";
import { createDebugOverlay, updateDebugOverlay, cleanupDebugOverlay } from "./DebugOverlay";

const MazeRunner = () => {
    const gameParentRef = useRef(null);
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);

    const playerConfig = {
        speed: 100,
        frameRate: 10,
        keys: { left: "A", right: "D", up: "W", down: "S" }
    };

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
            setIsPortrait(window.innerHeight > window.innerWidth);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        let game = null;

        const getGameDimensions = () => {
            const isMobile = window.innerWidth <= 768;
            const isPortrait = window.innerHeight > window.innerWidth;
            if (isMobile) {
                if (isPortrait) {
                    return {
                        width: Math.min(400, window.innerWidth - 20),
                        height: Math.min(600, window.innerHeight - 100),
                        uiPanelWidth: 0,
                        uiPanelPosition: 'bottom'
                    };
                } else {
                    return {
                        width: Math.min(700, window.innerWidth - 20),
                        height: Math.min(400, window.innerHeight - 20),
                        uiPanelWidth: 150,
                        uiPanelPosition: 'right'
                    };
                }
            } else {
                return {
                    width: 960,
                    height: 640,
                    uiPanelWidth: 200,
                    uiPanelPosition: 'right'
                };
            }
        };

        const dimensions = getGameDimensions();
        const GAME_WIDTH = dimensions.width;
        const GAME_HEIGHT = dimensions.height;
        const UI_PANEL_WIDTH = dimensions.uiPanelWidth;
        const UI_PANEL_POSITION = dimensions.uiPanelPosition;
        const MAZE_WIDTH = UI_PANEL_POSITION === 'right' ? GAME_WIDTH - UI_PANEL_WIDTH : GAME_WIDTH;
        const MAZE_HEIGHT = UI_PANEL_POSITION === 'bottom' ? GAME_HEIGHT - 100 : GAME_HEIGHT;

        // --- COLOR: single accent color (change here) ---
        const ACCENT_HEX = "#8d0202"; // <- change this to any hex color you prefer
        const ACCENT = parseInt(ACCENT_HEX.slice(1), 16); // Phaser uses number hex like 0x16a34a

        function hexToRgba(hex, alpha = 1) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        class MazeRunnerScene extends Phaser.Scene {
            constructor() {
                super({ key: "MazeRunnerScene" });
            }

            init(data) {
                this.level = data?.level || 1;
                this.joystick = {
                    active: false,
                    x: 0,
                    y: 0,
                    vector: { x: 0, y: 0 },
                    base: null,
                    thumb: null,
                    radius: 0,
                    touchId: null
                };
            }

            preload() {
                this.load.image("brick", brick);
                this.load.image("brickBlack", brickBlack);
                this.load.image("breakableBrick", breakableBrick);
                this.load.spritesheet("womenMc", womenMc, { frameWidth: 66, frameHeight: 82 });
                this.load.spritesheet("enemy", enemy, { frameWidth: 66, frameHeight: 82 });

                // Jumpscare assets
                this.load.image("ed1", ed1);
                this.load.image("ed2", ed2);
                this.load.image("ed3", ed3);
                this.load.image("ed4", ed4);
                this.load.image("ed5", ed5);
                this.load.audio("jumpscareSound", jumpscareSound);
            }

            create() {
                this.isMobile = this.game.device.os.android || this.game.device.os.iOS || window.innerWidth <= 768;
                this.isPortrait = this.scale.height > this.scale.width;

                this.input.keyboard.on("keydown-ESC", () => {
                    this.scene.start("MainMenu");
                });

                this.win = false;
                this.gameOver = false;

                let FIXED_CELLS_X, FIXED_CELLS_Y;
                if (this.isMobile) {
                    if (this.isPortrait) {
                        FIXED_CELLS_X = 7;
                        FIXED_CELLS_Y = 9;
                    } else {
                        FIXED_CELLS_X = 9;
                        FIXED_CELLS_Y = 7;
                    }
                } else {
                    FIXED_CELLS_X = 11;
                    FIXED_CELLS_Y = 9;
                }

                const rows = FIXED_CELLS_Y * 2 + 1;
                const cols = FIXED_CELLS_X * 2 + 1;
                const maxTileW = Math.floor(MAZE_WIDTH / cols);
                const maxTileH = Math.floor(MAZE_HEIGHT / rows);
                const TILE = Math.max(12, Math.min(36, Math.min(maxTileW, maxTileH)));
                this.TILE = TILE;

                this.enemySpeed = 70 + (this.level - 1) * 8;
                this.enemySpawnDistance = TILE * 3;

                const extraPaths = 15;
                const breakableBricks = 10;

                const maze = generateMazeGrid(FIXED_CELLS_X, FIXED_CELLS_Y, extraPaths, breakableBricks);
                this.mazeGrid = maze;
                this.walls = [];
                this.breakableWalls = [];

                // unify camera background to white (canvas background) — you can change this if needed
                this.cameras.main.setBackgroundColor(0xffffff);
                this.cameras.main.setBounds(0, 0, MAZE_WIDTH, MAZE_HEIGHT);

                for (let r = 0; r < maze.length; r++) {
                    for (let c = 0; c < maze[0].length; c++) {
                        const x = c * TILE + TILE / 2;
                        const y = r * TILE + TILE / 2;
                        if (maze[r][c] === 1) {
                            const wall = this.add.image(x, y, "brickBlack").setDisplaySize(TILE, TILE).setOrigin(0.5);
                            this.physics.add.existing(wall, true);
                            this.walls.push(wall);
                        } else if (maze[r][c] === 2) {
                            const brickObj = this.add.image(x, y, "breakableBrick").setDisplaySize(TILE, TILE).setOrigin(0.5);
                            this.physics.add.existing(brickObj, true);
                            this.breakableWalls.push(brickObj);
                        } else {
                            this.add.image(x, y, "brick").setDisplaySize(TILE, TILE).setOrigin(0.5);
                        }
                    }
                }

                const finishPos = findFinishPos(maze);
                this.finish = this.add.rectangle(
                    finishPos.col * TILE + TILE / 2,
                    finishPos.row * TILE + TILE / 2,
                    TILE * 0.8, TILE * 0.8,
                    ACCENT
                ).setOrigin(0.5);
                this.physics.add.existing(this.finish, true);

                // Animations
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
                this.breakableWalls.forEach(b => {
                    this.physics.add.overlap(this.player, b, this.onBreakableHit, null, this);
                });
                this.physics.add.overlap(this.player, this.finish, this.onWin, null, this);

                this.keys = this.input.keyboard.addKeys(playerConfig.keys);
                this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

                // === MOBILE: TOP-RIGHT OVERLAY ===
                const textPrimary = "#ffffff";
                const menuBtnBg = hexToRgba(ACCENT_HEX, 0.06);
                const menuBtnHover = hexToRgba(ACCENT_HEX, 0.12);
                const menuBtnText = "#ffffff"; // or "#000000" on light backgrounds

                if (this.isMobile) {
                    const padding = 12;
                    const fontSize = this.isPortrait ? '14px' : '16px';

                    this.levelText = this.add.text(
                        MAZE_WIDTH - padding,
                        padding,
                        `Level: ${this.level}`,
                        {
                            font: fontSize,
                            fill: textPrimary,
                            stroke: "#000000",
                            fontWeight: 'bold',
                            align: 'right'
                        }
                    ).setOrigin(1, 0).setScrollFactor(0).setDepth(910);

                    this.menuButton = this.add.text(
                        MAZE_WIDTH - padding,
                        padding + 24,
                        "☰ Menu",
                        {
                            font: fontSize,
                            fill: menuBtnText,
                            backgroundColor: menuBtnBg,
                            padding: { x: 12, y: 6 }
                        }
                    )
                        .setOrigin(1, 0)
                        .setScrollFactor(0)
                        .setDepth(910)
                        .setInteractive({ useHandCursor: true })
                        .on("pointerdown", () => this.scene.start("MainMenu"))
                        .on("pointerover", () => {
                            this.tweens.add({
                                targets: this.menuButton,
                                scaleX: 1.08,
                                scaleY: 1.08,
                                duration: 150,
                                ease: "Power2"
                            });
                            this.menuButton.setBackgroundColor(menuBtnHover);
                        })
                        .on("pointerout", () => {
                            this.tweens.add({
                                targets: this.menuButton,
                                scaleX: 1,
                                scaleY: 1,
                                duration: 150,
                                ease: "Power2"
                            });
                            this.menuButton.setBackgroundColor(menuBtnBg);
                        });

                } else {
                    const panelColor = ACCENT; // use accent as fill
                    const panelAlpha = 0.12;

                    const panelX = MAZE_WIDTH + 10;
                    const panelY = 20;
                    const panelWidth = UI_PANEL_WIDTH - 20;
                    const panelHeight = GAME_HEIGHT - 40;

                    this.uiPanel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, panelColor)
                        .setAlpha(panelAlpha).setOrigin(0, 0).setScrollFactor(0).setDepth(900);

                    this.add.rectangle(panelX - 2, panelY, 2, panelHeight, ACCENT)
                        .setOrigin(0, 0).setScrollFactor(0).setDepth(899);

                    this.menuButton = this.add.text(
                        panelX + panelWidth / 2, panelY + 25, "☰ Menu",
                        {
                            font: "18px Arial",
                            fill: menuBtnText,
                            backgroundColor: menuBtnBg,
                            padding: { x: 16, y: 8 },
                        })
                        .setOrigin(0.5).setScrollFactor(0).setDepth(910)
                        .setInteractive({ useHandCursor: true })
                        .on("pointerdown", () => this.scene.start("MainMenu"))
                        .on("pointerover", () => {
                            this.tweens.add({ targets: this.menuButton, scaleX: 1.08, scaleY: 1.08, duration: 150, ease: "Power2" });
                            this.menuButton.setBackgroundColor(menuBtnHover);
                        })
                        .on("pointerout", () => {
                            this.tweens.add({ targets: this.menuButton, scaleX: 1, scaleY: 1, duration: 150, ease: "Power2" });
                            this.menuButton.setBackgroundColor(menuBtnBg);
                        });

                    this.instructionText = this.add.text(
                        panelX + 10, panelY + 65,
                        `Move with\n${Object.values(playerConfig.keys).join(' / ')}\nPress [I] for debug`,
                        { font: '16px Arial', fill: textPrimary, align: 'left' }
                    ).setScrollFactor(0).setDepth(910);

                    this.levelText = this.add.text(panelX + 10, panelY + 140, `Level: ${this.level}`, {
                        font: '22px Arial',
                        fill: textPrimary,
                        fontWeight: 'bold'
                    }).setScrollFactor(0).setDepth(910);
                }

                if (this.isMobile) {
                    this.createVirtualJoystick();
                }

                const centerX = MAZE_WIDTH / 2;
                const centerY = MAZE_HEIGHT / 2;

                this.winText = this.add.text(centerX, centerY, "You win!", {
                    font: this.isMobile ? "36px Arial" : "48px Arial",
                    fill: ACCENT_HEX
                }).setOrigin(0.5).setDepth(1000).setVisible(false);

                this.retryButton = this.add.text(centerX, centerY + (this.isMobile ? 60 : 80), "Retry", {
                    font: this.isMobile ? "24px Arial" : "32px Arial",
                    fill: "#ffffff",
                    backgroundColor: hexToRgba(ACCENT_HEX, 0.9),
                    padding: { x: 20, y: 10 },
                }).setOrigin(0.5).setDepth(1000).setVisible(false)
                    .setInteractive({ useHandCursor: true })
                    .on("pointerdown", () => this.scene.restart({ level: this.level }));

                this.nextLevelButton = this.add.text(centerX, centerY + (this.isMobile ? 110 : 140), "Next Level", {
                    font: this.isMobile ? "22px Arial" : "28px Arial",
                    fill: "#ffffff",
                    backgroundColor: hexToRgba(ACCENT_HEX, 0.95),
                    padding: { x: 20, y: 10 },
                }).setOrigin(0.5).setDepth(1000).setVisible(false)
                    .setInteractive({ useHandCursor: true })
                    .on("pointerdown", () => {
                        const next = this.level + 1;
                        this.scene.restart({ level: next });
                    });

                this.defeatText = this.add.text(centerX, centerY, "You were caught!", {
                    font: this.isMobile ? "36px Arial" : "48px Arial",
                    fill: hexToRgba(ACCENT_HEX, 0.85),
                    stroke: "#00000049",
                }).setOrigin(0.5).setDepth(1000).setVisible(false);

                this.enemy = null;
                this.enemySpawned = false;

                this.pathUpdateInterval = 300;
                this.pathTimer = this.time.addEvent({
                    delay: this.pathUpdateInterval,
                    loop: true,
                    callback: () => {
                        if (!this.enemySpawned || !this.enemy || this.win || this.gameOver) return;
                        this.updateEnemyPathAndMove();
                    }
                });

                this._onShutdownCleanup = [];
                this._onShutdownCleanup.push(() => {
                    try { this.pathTimer?.remove(false); } catch (e) { }
                });

                this.events.on('shutdown', this._onShutdown, this);
                this.events.on('destroy', this._onDestroy, this);
            }

            // --- JOYSTICK & UTILS ---
            createVirtualJoystick() {
                const baseColor = ACCENT; // use accent
                const thumbColor = ACCENT; // use accent
                let baseX, baseY;
                if (this.isPortrait) {
                    baseX = 80;
                    baseY = this.cameras.main.height - 120;
                } else {
                    baseX = 100;
                    baseY = this.cameras.main.height - 100;
                }
                const baseRadius = 50;
                const thumbRadius = 25;

                this.joystick.base = this.add.circle(baseX, baseY, baseRadius, baseColor, 0.14)
                    .setStrokeStyle(2, ACCENT).setDepth(950).setScrollFactor(0);
                this.joystick.thumb = this.add.circle(baseX, baseY, thumbRadius, thumbColor, 0.28)
                    .setStrokeStyle(2, ACCENT).setDepth(951).setScrollFactor(0);

                this.joystick.x = baseX;
                this.joystick.y = baseY;
                this.joystick.radius = baseRadius - thumbRadius;
                this.joystick.originalX = baseX;
                this.joystick.originalY = baseY;

                this.input.on('pointerdown', (pointer) => {
                    if (pointer.x < this.cameras.main.width / 2 ||
                        (pointer.x > this.joystick.x - baseRadius && pointer.x < this.joystick.x + baseRadius &&
                            pointer.y > this.joystick.y - baseRadius && pointer.y < this.joystick.y + baseRadius)) {
                        this.joystick.active = true;
                        this.joystick.touchId = pointer.id;
                        this.updateJoystickPosition(pointer.x, pointer.y);
                    }
                });

                this.input.on('pointermove', (pointer) => {
                    if (this.joystick.active && pointer.id === this.joystick.touchId) {
                        this.updateJoystickPosition(pointer.x, pointer.y);
                    }
                });

                this.input.on('pointerup', (pointer) => {
                    if (this.joystick.active && pointer.id === this.joystick.touchId) {
                        this.resetJoystick();
                    }
                });

                this.input.on('pointercancel', (pointer) => {
                    if (this.joystick.active && pointer.id === this.joystick.touchId) {
                        this.resetJoystick();
                    }
                });

                if (this.isPortrait) {
                    this.add.text(baseX, baseY - baseRadius - 15, "Joystick", {
                        font: '12px Arial',
                        fill: ACCENT_HEX
                    }).setOrigin(0.5).setDepth(951).setScrollFactor(0);
                }
            }

            updateJoystickPosition(touchX, touchY) {
                if (!this.joystick.active) return;
                const deltaX = touchX - this.joystick.originalX;
                const deltaY = touchY - this.joystick.originalY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                let newThumbX, newThumbY;
                if (distance <= this.joystick.radius) {
                    newThumbX = touchX;
                    newThumbY = touchY;
                } else {
                    const angle = Math.atan2(deltaY, deltaX);
                    newThumbX = this.joystick.originalX + Math.cos(angle) * this.joystick.radius;
                    newThumbY = this.joystick.originalY + Math.sin(angle) * this.joystick.radius;
                }
                this.joystick.thumb.x = newThumbX;
                this.joystick.thumb.y = newThumbY;
                this.joystick.vector.x = (newThumbX - this.joystick.originalX) / this.joystick.radius;
                this.joystick.vector.y = (newThumbY - this.joystick.originalY) / this.joystick.radius;

                this.joystick.base.fillColor = ACCENT;
                this.joystick.base.fillAlpha = 0.3;
            }

            resetJoystick() {
                this.joystick.active = false;
                this.joystick.touchId = null;
                this.joystick.vector.x = 0;
                this.joystick.vector.y = 0;
                this.tweens.add({
                    targets: this.joystick.thumb,
                    x: this.joystick.originalX,
                    y: this.joystick.originalY,
                    duration: 150,
                    ease: 'Power2'
                });
                this.joystick.base.fillColor = ACCENT;
                this.joystick.base.fillAlpha = 0.14;
            }

            update() {
                if (!this.player || !this.keys) return;
                if (Phaser.Input.Keyboard.JustDown(this.keyI)) {
                    this.debugMode = !this.debugMode;
                    updateDebugOverlay(this);
                }
                if (this.win || this.gameOver) {
                    if (this.player?.body) {
                        this.player.body.setVelocity(0, 0);
                        this.player.anims.stop();
                    }
                    if (this.debugMode) updateDebugOverlay(this);
                    return;
                }

                const speed = playerConfig.speed;
                const body = this.player.body;
                let vx = 0, vy = 0;

                if (this.isMobile && this.joystick.active) {
                    vx = this.joystick.vector.x * speed;
                    vy = this.joystick.vector.y * speed;
                } else {
                    if (this.keys.left.isDown) vx = -speed;
                    else if (this.keys.right.isDown) vx = speed;
                    if (this.keys.up.isDown) vy = -speed;
                    else if (this.keys.down.isDown) vy = speed;
                }

                body.setVelocity(vx, vy);

                if (vx !== 0 || vy !== 0) {
                    if (Math.abs(vx) > Math.abs(vy)) {
                        if (vx > 0) this.player.anims.play("walk-right", true);
                        else this.player.anims.play("walk-left", true);
                    } else {
                        if (vy > 0) this.player.anims.play("walk-down", true);
                        else if (vy < 0) this.player.anims.play("walk-up", true);
                    }
                } else {
                    this.player.anims.stop();
                }

                if (!this.enemySpawned) {
                    const dx = this.player.x - this.playerStartX;
                    const dy = this.player.y - this.playerStartY;
                    const sq = dx * dx + dy * dy;
                    if (sq >= this.enemySpawnDistance * this.enemySpawnDistance) {
                        this.spawnEnemyAtStart();
                    }
                }

                if (this.debugMode) updateDebugOverlay(this);
            }

            spawnEnemyAtStart() {
                const ex = this.playerStartX;
                const ey = this.playerStartY;
                this.enemy = this.physics.add.sprite(ex, ey, "enemy", 0);
                this.enemy.setCollideWorldBounds(true);
                this.enemy.setDisplaySize(this.TILE * 0.9, this.TILE * 1.1);
                this.enemy.body.setSize(40, 50);
                this.enemy.body.setOffset(13, 25);
                // Collide only with solid walls
                this.walls.forEach(w => this.physics.add.collider(this.enemy, w));
                this.physics.add.overlap(this.player, this.enemy, () => this.onDefeat(), null, this);
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

            // NEW: Check if breakable brick at (row, col) has been destroyed
            isBreakableBrickDestroyed(row, col) {
                const x = col * this.TILE + this.TILE / 2;
                const y = row * this.TILE + this.TILE / 2;
                return !this.breakableWalls.some(brick =>
                    Math.abs(brick.x - x) < 1 && Math.abs(brick.y - y) < 1
                );
            }

            // UPDATED: Pathfinding respects destroyed breakable bricks
            findPathBFS(startCell, endCell, grid) {
                const rows = grid.length;
                const cols = grid[0].length;
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

                        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || visited[nr][nc]) {
                            continue;
                        }

                        const cellValue = grid[nr][nc];
                        let isPassable = false;

                        if (cellValue === 0) {
                            isPassable = true;
                        } else if (cellValue === 2) {
                            isPassable = this.isBreakableBrickDestroyed(nr, nc);
                        }

                        if (isPassable) {
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

            _onShutdown() {
                cleanupDebugOverlay(this);
                this._onShutdownCleanup?.forEach(fn => {
                    try { fn(); } catch (e) { }
                });
                this._onShutdownCleanup = [];
            }

            _onDestroy() {
                this._onShutdown();
            }

            onBreakableHit(player, brick) {
                if (brick.alpha <= 0) return;

                const bx = brick.x;
                const by = brick.y;
                const tileSize = this.TILE;

                this.tweens.add({
                    targets: brick,
                    alpha: 0,
                    duration: 400,
                    onComplete: () => {
                        // Remove the original breakable brick
                        try { brick.destroy(); } catch (e) { }

                        const index = this.breakableWalls.indexOf(brick);
                        if (index !== -1) {
                            this.breakableWalls.splice(index, 1);
                        }

                        //  Visual-only brick tile BEHIND player & enemies
                        const brickTile = this.add.image(bx, by, "brick")
                            .setDisplaySize(tileSize, tileSize)
                            .setOrigin(0.5)
                            .setDepth(-10); //  lower than characters & enemies

                        // No physics body → passable
                    }
                });
            }


            onWin() {
                if (this.win || this.gameOver) return;
                this.win = true;
                this.winText.setVisible(true);
                this.retryButton.setVisible(true);
                this.nextLevelButton.setVisible(true);
                this.menuButton.setVisible(true);
                if (this.player?.body) this.player.body.setVelocity(0, 0);
                this.tweens.add({ targets: this.finish, scaleX: 1.15, scaleY: 1.15, yoyo: true, repeat: 4, duration: 150 });
                if (this.isMobile && this.joystick.base) {
                    this.joystick.base.setVisible(false);
                    this.joystick.thumb.setVisible(false);
                }
            }

            // UPDATED: Image appears at 1-second mark of sound
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

                // Hide normal UI
                this.menuButton.setVisible(false);
                if (this.isMobile && this.joystick.base) {
                    this.joystick.base.setVisible(false);
                    this.joystick.thumb.setVisible(false);
                }

                const camWidth = this.cameras.main.width;
                const camHeight = this.cameras.main.height;
                const centerX = camWidth / 2;
                const centerY = camHeight / 2;

                // Play sound immediately
                const sound = this.sound.add("jumpscareSound", { volume: 0.8 });
                sound.play();

                // Show jumpscare after 1 second (1000 ms)
                this.time.delayedCall(1000, () => {
                    if (this.gameOver && !this.win) {
                        const jumpscareImages = ["ed1", "ed2", "ed3", "ed4", "ed5"];
                        const randomImage = Phaser.Utils.Array.GetRandom(jumpscareImages);
                        const jumpscare = this.add.image(0, 0, randomImage)
                            .setOrigin(0, 0)
                            .setDisplaySize(camWidth, camHeight)
                            .setDepth(2000);

                        const defeatText = this.add.text(centerX, centerY - 60, "You were caught!", {
                            font: this.isMobile ? "36px Arial" : "48px Arial",
                            fill: hexToRgba(ACCENT_HEX, 0.85),
                            stroke: "#00000049",
                            strokeThickness: 4,
                            align: "center"
                        }).setOrigin(0.5).setDepth(2001);

                        const retryButton = this.add.text(centerX, centerY + 40, "Try Again", {
                            font: this.isMobile ? "24px Arial" : "32px Arial",
                            fill: "#ffffff",
                            backgroundColor: hexToRgba(ACCENT_HEX, 0.95),
                            padding: { x: 24, y: 12 },
                            align: "center"
                        })
                            .setOrigin(0.5)
                            .setDepth(2001)
                            .setInteractive({ useHandCursor: true })
                            .on("pointerdown", () => {
                                jumpscare.destroy();
                                defeatText.destroy();
                                retryButton.destroy();
                                this.scene.restart({ level: this.level });
                            });
                    }
                }, [], this);
            }
        }

        // --- Helper Functions ---
        function generateMazeGrid(cellsX, cellsY, extraPaths = 3, breakableBricks = 2) {
            const rows = cellsY * 2 + 1;
            const cols = cellsX * 2 + 1;
            const grid = Array.from({ length: rows }, () => Array(cols).fill(1));
            const visited = Array.from({ length: cellsY }, () => Array(cellsX).fill(false));
            const toGrid = (cx, cy) => ({ col: cx * 2 + 1, row: cy * 2 + 1 });
            const stack = [];
            visited[0][0] = true;
            const g = toGrid(0, 0);
            grid[g.row][g.col] = 0;
            stack.push({ cx: 0, cy: 0 });
            const dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];

            while (stack.length) {
                const cur = stack[stack.length - 1];
                const neighbors = [];
                for (const d of dirs) {
                    const nx = cur.cx + d.dx;
                    const ny = cur.cy + d.dy;
                    if (nx >= 0 && nx < cellsX && ny >= 0 && ny < cellsY && !visited[ny][nx]) {
                        neighbors.push({ cx: nx, cy: ny });
                    }
                }
                if (!neighbors.length) {
                    stack.pop();
                } else {
                    const nxt = Phaser.Math.RND.pick(neighbors);
                    const curG = toGrid(cur.cx, cur.cy);
                    const nxtG = toGrid(nxt.cx, nxt.cy);
                    grid[(curG.row + nxtG.row) / 2][(curG.col + nxtG.col) / 2] = 0;
                    grid[nxtG.row][nxtG.col] = 0;
                    visited[nxt.cy][nxt.cx] = true;
                    stack.push(nxt);
                }
            }

            let added = 0;
            let attempts = 0;
            const maxAttempts = 100;
            while (added < extraPaths && attempts < maxAttempts) {
                const r = Phaser.Math.RND.between(1, rows - 2);
                const c = Phaser.Math.RND.between(1, cols - 2);
                if (grid[r][c] === 1) {
                    if (r % 2 === 1 && c % 2 === 0 && grid[r][c - 1] === 0 && grid[r][c + 1] === 0) {
                        grid[r][c] = 0;
                        added++;
                    } else if (r % 2 === 0 && c % 2 === 1 && grid[r - 1][c] === 0 && grid[r + 1][c] === 0) {
                        grid[r][c] = 0;
                        added++;
                    }
                }
                attempts++;
            }

            let breakAdded = 0;
            attempts = 0;
            while (breakAdded < breakableBricks && attempts < 200) {
                const r = Phaser.Math.RND.between(1, rows - 2);
                const c = Phaser.Math.RND.between(1, cols - 2);
                if (grid[r][c] === 1) {
                    grid[r][c] = 2;
                    breakAdded++;
                }
                attempts++;
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
            backgroundColor: 0xffffff, // canvas background
            physics: { default: "arcade", arcade: { gravity: { y: 0 }, debug: false } },
            scene: [MainMenuScene, MazeRunnerScene],
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                width: GAME_WIDTH,
                height: GAME_HEIGHT
            },
            input: {
                touch: { capture: true }
            }
        };

        game = new Phaser.Game(config);

        const handleResize = () => {
            if (game) game.scale.resize(GAME_WIDTH, GAME_HEIGHT);
        };
        window.addEventListener('resize', handleResize);
        game.exitCallback = () => navigate("/");

        return () => {
            if (game) {
                try { game.destroy(true); } catch (e) { }
            }
            window.removeEventListener('resize', handleResize);
        };
    }, [navigate]);

    return (
        <div style={{
            width: "100%",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            backgroundColor: "transparent", // let page handle dark/light backgrounds
            position: "relative",
            touchAction: "none"
        }}>
            <div ref={gameParentRef} style={{ maxWidth: "100%", maxHeight: "100vh" }} />
        </div>
    );
};

export default MazeRunner;
