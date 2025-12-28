import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Phaser from "phaser";

const BASE = import.meta.env.BASE_URL || '/';

// MazeRunner assets
export const brick = `${BASE}assets/BrickTileset/Brick.png`;
export const brickBlack = `${BASE}assets/BrickTileset/BrickBlack.png`;
export const womenMc = `${BASE}assets/Characters/WomenMc.png`;
export const enemy = `${BASE}assets/Characters/Enemy.png`;

// IMPORT EXTRACTED SCENES & DEBUG UTILS
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

    // Handle resize and orientation
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

        // Dynamic game dimensions based on screen size
        const getGameDimensions = () => {
            const isMobile = window.innerWidth <= 768;
            const isPortrait = window.innerHeight > window.innerWidth;

            if (isMobile) {
                if (isPortrait) {
                    // Mobile portrait
                    return {
                        width: Math.min(400, window.innerWidth - 20),
                        height: Math.min(600, window.innerHeight - 100),
                        uiPanelWidth: 0, // No side panel on mobile
                        uiPanelPosition: 'bottom' // UI at bottom
                    };
                } else {
                    // Mobile landscape
                    return {
                        width: Math.min(700, window.innerWidth - 20),
                        height: Math.min(400, window.innerHeight - 20),
                        uiPanelWidth: 150,
                        uiPanelPosition: 'right'
                    };
                }
            } else {
                // Desktop
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
                this.load.spritesheet("womenMc", womenMc, { frameWidth: 66, frameHeight: 82 });
                this.load.spritesheet("enemy", enemy, { frameWidth: 66, frameHeight: 82 });
            }

            create() {
                // Check if we're on mobile
                this.isMobile = this.game.device.os.android || this.game.device.os.iOS || window.innerWidth <= 768;
                this.isPortrait = this.scale.height > this.scale.width;

                this.input.keyboard.on("keydown-ESC", () => {
                    this.scene.start("MainMenu");
                });

                this.win = false;
                this.gameOver = false;

                // Adjust maze size based on screen
                let FIXED_CELLS_X, FIXED_CELLS_Y;
                if (this.isMobile) {
                    if (this.isPortrait) {
                        FIXED_CELLS_X = 7;  // Smaller maze for mobile portrait
                        FIXED_CELLS_Y = 9;
                    } else {
                        FIXED_CELLS_X = 9;  // Slightly smaller for mobile landscape
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

                this.timeLeft = Math.max(15, 60 - (this.level - 1) * 5);
                this.enemySpeed = 70 + (this.level - 1) * 8;
                this.enemySpawnDistance = TILE * 3;

                const maze = generateMazeGrid(FIXED_CELLS_X, FIXED_CELLS_Y);
                this.mazeGrid = maze;

                this.walls = [];
                const isDark = this.readDarkMode();
                this.cameras.main.setBackgroundColor(isDark ? 0x0f172a : 0xffffff);
                this.cameras.main.setBounds(0, 0, MAZE_WIDTH, MAZE_HEIGHT);

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
                this.physics.add.overlap(this.player, this.finish, this.onWin, null, this);

                this.keys = this.input.keyboard.addKeys(playerConfig.keys);
                this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

                // --- DYNAMIC UI PANEL BASED ON SCREEN SIZE ---
                let panelX, panelY, panelWidth, panelHeight;
                const panelColor = isDark ? 0x071024 : 0xf2f4f7;
                const panelAlpha = isDark ? 0.35 : 0.8;
                const textPrimary = isDark ? "#e6f9ff" : "#06111a";
                const menuBtnBg = isDark ? "#1e293b" : "#4a5568";
                const menuBtnHover = isDark ? "#334155" : "#6b7280";
                const menuBtnText = isDark ? "#f1f5f9" : "#ffffff";

                if (UI_PANEL_POSITION === 'right') {
                    // Side panel
                    panelX = MAZE_WIDTH + 10;
                    panelY = 20;
                    panelWidth = UI_PANEL_WIDTH - 20;
                    panelHeight = GAME_HEIGHT - 40;

                    this.uiPanel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, panelColor)
                        .setAlpha(panelAlpha)
                        .setOrigin(0, 0)
                        .setScrollFactor(0)
                        .setDepth(900);

                    this.add.rectangle(panelX - 2, panelY, 2, panelHeight, isDark ? 0x2d3748 : 0xcccccc)
                        .setOrigin(0, 0)
                        .setScrollFactor(0)
                        .setDepth(899);

                    // === MENU BUTTON ===
                    this.menuButton = this.add.text(
                        panelX + panelWidth / 2,
                        panelY + 25,
                        "☰ Menu",
                        {
                            font: this.isMobile ? "16px Arial" : "18px Arial",
                            fill: menuBtnText,
                            backgroundColor: menuBtnBg,
                            padding: { x: 16, y: 8 },
                        })
                        .setOrigin(0.5, 0.5)
                        .setScrollFactor(0)
                        .setDepth(910)
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

                    // === INSTRUCTIONS ===
                    const instructionY = this.isMobile ? panelY + 55 : panelY + 65;
                    this.instructionText = this.add.text(
                        panelX + 10,
                        instructionY,
                        this.isMobile ? `Move with\nWASD` : `Move with\n${Object.values(playerConfig.keys).join(' / ')}\n\nPress [I] for debug`,
                        {
                            font: this.isMobile ? '14px Arial' : '16px Arial',
                            fill: textPrimary,
                            align: 'left'
                        })
                        .setScrollFactor(0)
                        .setDepth(910);

                    this.levelText = this.add.text(panelX + 10, panelY + (this.isMobile ? 110 : 140), `Level: ${this.level}`, {
                        font: this.isMobile ? '18px Arial' : '22px Arial',
                        fill: textPrimary,
                        fontWeight: 'bold'
                    })
                        .setScrollFactor(0)
                        .setDepth(910);

                    this.timerText = this.add.text(panelX + 10, panelY + (this.isMobile ? 140 : 180), `Time: ${this.timeLeft}`, {
                        font: this.isMobile ? '18px Arial' : '22px Arial',
                        fill: isDark ? "#c6f6d5" : "#024b23",
                        fontWeight: 'bold'
                    })
                        .setScrollFactor(0)
                        .setDepth(910);

                } else if (UI_PANEL_POSITION === 'bottom') {
                    // Bottom panel for mobile portrait
                    panelX = 10;
                    panelY = MAZE_HEIGHT + 10;
                    panelWidth = GAME_WIDTH - 20;
                    panelHeight = GAME_HEIGHT - MAZE_HEIGHT - 20;

                    this.uiPanel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, panelColor)
                        .setAlpha(panelAlpha)
                        .setOrigin(0, 0)
                        .setScrollFactor(0)
                        .setDepth(900);

                    // === MENU BUTTON ===
                    this.menuButton = this.add.text(
                        panelX + 80,
                        panelY + panelHeight / 2,
                        "☰ Menu",
                        {
                            font: "16px Arial",
                            fill: menuBtnText,
                            backgroundColor: menuBtnBg,
                            padding: { x: 12, y: 6 },
                        })
                        .setOrigin(0.5, 0.5)
                        .setScrollFactor(0)
                        .setDepth(910)
                        .setInteractive({ useHandCursor: true })
                        .on("pointerdown", () => {
                            this.scene.start("MainMenu");
                        });

                    // === LEVEL & TIMER ===
                    this.levelText = this.add.text(panelX + panelWidth - 120, panelY + 15, `Level: ${this.level}`, {
                        font: '16px Arial',
                        fill: textPrimary,
                        fontWeight: 'bold'
                    })
                        .setScrollFactor(0)
                        .setDepth(910);

                    this.timerText = this.add.text(panelX + panelWidth - 120, panelY + 40, `Time: ${this.timeLeft}`, {
                        font: '16px Arial',
                        fill: isDark ? "#c6f6d5" : "#024b23",
                        fontWeight: 'bold'
                    })
                        .setScrollFactor(0)
                        .setDepth(910);
                }

                // === VIRTUAL JOYSTICK FOR MOBILE ===
                if (this.isMobile) {
                    this.createVirtualJoystick();
                }

                const centerX = MAZE_WIDTH / 2;
                const centerY = MAZE_HEIGHT / 2;

                this.winText = this.add.text(centerX, centerY, "You win!", {
                    font: this.isMobile ? "36px Arial" : "48px Arial",
                    fill: isDark ? "#fff59d" : "#ffff66"
                })
                    .setOrigin(0.5).setDepth(1000).setVisible(false);

                this.retryButton = this.add.text(centerX, centerY + (this.isMobile ? 60 : 80), "Retry", {
                    font: this.isMobile ? "24px Arial" : "32px Arial",
                    fill: isDark ? "#ff9d9d" : "#ff5555",
                    backgroundColor: isDark ? "#111827" : "#222222",
                    padding: { x: 20, y: 10 },
                })
                    .setOrigin(0.5).setDepth(1000).setVisible(false)
                    .setInteractive({ useHandCursor: true })
                    .on("pointerdown", () => this.scene.restart({ level: this.level }));

                this.nextLevelButton = this.add.text(centerX, centerY + (this.isMobile ? 110 : 140), "Next Level", {
                    font: this.isMobile ? "22px Arial" : "28px Arial",
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

                this.defeatText = this.add.text(centerX, centerY, "You were caught!", {
                    font: this.isMobile ? "36px Arial" : "48px Arial",
                    fill: isDark ? "#ff8b8b" : "#ff3333"
                })
                    .setOrigin(0.5).setDepth(1000).setVisible(false);

                this.timeUpText = this.add.text(centerX, centerY, "Time's Up!", {
                    font: this.isMobile ? "36px Arial" : "48px Arial",
                    fill: isDark ? "#ff8b8b" : "#ff3333"
                })
                    .setOrigin(0.5).setDepth(1000).setVisible(false);

                this.enemy = null;
                this.enemySpawned = false;

                // === TIMERS ===
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

            createVirtualJoystick() {
                const isDark = this.readDarkMode();
                const baseColor = isDark ? 0x2d3748 : 0xcccccc;
                const thumbColor = isDark ? 0x475569 : 0x999999;

                // Calculate joystick position
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

                // Create joystick base (stationary)
                this.joystick.base = this.add.circle(baseX, baseY, baseRadius, baseColor, 0.3)
                    .setStrokeStyle(2, isDark ? 0x475569 : 0x999999)
                    .setDepth(950)
                    .setScrollFactor(0);

                // Create joystick thumb (movable)
                this.joystick.thumb = this.add.circle(baseX, baseY, thumbRadius, thumbColor, 0.5)
                    .setStrokeStyle(2, isDark ? 0x64748b : 0x777777)
                    .setDepth(951)
                    .setScrollFactor(0);

                this.joystick.x = baseX;
                this.joystick.y = baseY;
                this.joystick.radius = baseRadius - thumbRadius; // Max movement radius for thumb

                // Store original positions
                this.joystick.originalX = baseX;
                this.joystick.originalY = baseY;

                // Set up touch events for the entire game area
                this.input.on('pointerdown', (pointer) => {
                    // Only activate if pointer is in the left half of the screen (for joystick area)
                    if (pointer.x < this.cameras.main.width / 2 ||
                        (pointer.x > this.joystick.x - baseRadius && pointer.x < this.joystick.x + baseRadius &&
                            pointer.y > this.joystick.y - baseRadius && pointer.y < this.joystick.y + baseRadius)) {

                        this.joystick.active = true;
                        this.joystick.touchId = pointer.id;

                        // Move thumb to touch position (clamped within radius)
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

                // Also handle pointer cancellation (e.g., browser interruption)
                this.input.on('pointercancel', (pointer) => {
                    if (this.joystick.active && pointer.id === this.joystick.touchId) {
                        this.resetJoystick();
                    }
                });

                // Add joystick instruction text
                if (this.isPortrait) {
                    this.add.text(baseX, baseY - baseRadius - 15, "Joystick", {
                        font: '12px Arial',
                        fill: isDark ? '#94a3b8' : '#666666'
                    })
                        .setOrigin(0.5)
                        .setDepth(951)
                        .setScrollFactor(0);
                }
            }

            updateJoystickPosition(touchX, touchY) {
                if (!this.joystick.active) return;

                const deltaX = touchX - this.joystick.originalX;
                const deltaY = touchY - this.joystick.originalY;

                // Calculate distance from center
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                let newThumbX, newThumbY;

                if (distance <= this.joystick.radius) {
                    // Within bounds, move thumb directly to touch
                    newThumbX = touchX;
                    newThumbY = touchY;
                } else {
                    // Outside bounds, clamp to max radius
                    const angle = Math.atan2(deltaY, deltaX);
                    newThumbX = this.joystick.originalX + Math.cos(angle) * this.joystick.radius;
                    newThumbY = this.joystick.originalY + Math.sin(angle) * this.joystick.radius;
                }

                // Update thumb position
                this.joystick.thumb.x = newThumbX;
                this.joystick.thumb.y = newThumbY;

                // Calculate normalized vector (-1 to 1)
                const vecX = (newThumbX - this.joystick.originalX) / this.joystick.radius;
                const vecY = (newThumbY - this.joystick.originalY) / this.joystick.radius;

                // Update joystick vector
                this.joystick.vector.x = vecX;
                this.joystick.vector.y = vecY;

                // Visual feedback - make base slightly brighter when active
                const isDark = this.readDarkMode();
                this.joystick.base.fillColor = isDark ? 0x3c4b64 : 0xdddddd;
                this.joystick.base.fillAlpha = 0.4;
            }

            resetJoystick() {
                this.joystick.active = false;
                this.joystick.touchId = null;
                this.joystick.vector.x = 0;
                this.joystick.vector.y = 0;

                // Animate thumb back to center
                this.tweens.add({
                    targets: this.joystick.thumb,
                    x: this.joystick.originalX,
                    y: this.joystick.originalY,
                    duration: 150,
                    ease: 'Power2'
                });

                // Reset base appearance
                const isDark = this.readDarkMode();
                this.joystick.base.fillColor = isDark ? 0x2d3748 : 0xcccccc;
                this.joystick.base.fillAlpha = 0.3;
            }

            readDarkMode() {
                try {
                    const stored = localStorage.getItem("darkMode");
                    if (stored !== null) return stored === "true";
                } catch { }
                return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
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
                        const isDark = this.readDarkMode();
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

                if (Phaser.Input.Keyboard.JustDown(this.keyI)) {
                    this.debugMode = !this.debugMode;
                    updateDebugOverlay(this);
                }

                if (this.win || this.gameOver) {
                    if (this.player?.body) {
                        this.player.body.setVelocity(0, 0);
                        this.player.anims.stop();
                    }
                    if (this.debugMode) {
                        updateDebugOverlay(this);
                    }
                    return;
                }

                const speed = playerConfig.speed;
                const body = this.player.body;
                let vx = 0, vy = 0;

                // Check for joystick input first (mobile)
                if (this.isMobile && this.joystick.active) {
                    vx = this.joystick.vector.x * speed;
                    vy = this.joystick.vector.y * speed;
                }
                // Then check keyboard controls (desktop or mobile with keyboard)
                else {
                    if (this.keys.left.isDown) {
                        vx = -speed;
                    } else if (this.keys.right.isDown) {
                        vx = speed;
                    }

                    if (this.keys.up.isDown) {
                        vy = -speed;
                    } else if (this.keys.down.isDown) {
                        vy = speed;
                    }
                }

                // Set velocity
                body.setVelocity(vx, vy);

                // Handle animations based on movement direction
                if (vx !== 0 || vy !== 0) {
                    // Prioritize horizontal movement for animation
                    if (Math.abs(vx) > Math.abs(vy)) {
                        if (vx > 0) {
                            this.player.anims.play("walk-right", true);
                        } else {
                            this.player.anims.play("walk-left", true);
                        }
                    } else {
                        if (vy > 0) {
                            this.player.anims.play("walk-down", true);
                        } else if (vy < 0) {
                            this.player.anims.play("walk-up", true);
                        }
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

            _onShutdown() {
                cleanupDebugOverlay(this);

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

                // Hide joystick on win
                if (this.isMobile && this.joystick.base) {
                    this.joystick.base.setVisible(false);
                    this.joystick.thumb.setVisible(false);
                }
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

                // Hide joystick on defeat
                if (this.isMobile && this.joystick.base) {
                    this.joystick.base.setVisible(false);
                    this.joystick.thumb.setVisible(false);
                }
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

                // Hide joystick on time up
                if (this.isMobile && this.joystick.base) {
                    this.joystick.base.setVisible(false);
                    this.joystick.thumb.setVisible(false);
                }
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
            scene: [MainMenuScene, MazeRunnerScene],
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                width: GAME_WIDTH,
                height: GAME_HEIGHT
            },
            input: {
                touch: {
                    capture: true // Ensure touch events are captured properly
                }
            }
        };

        game = new Phaser.Game(config);

        // Handle window resize
        const handleResize = () => {
            if (game) {
                game.scale.resize(GAME_WIDTH, GAME_HEIGHT);
            }
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

    function readDarkMode() {
        try {
            const stored = localStorage.getItem("darkMode");
            if (stored !== null) return stored === "true";
        } catch { }
        return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    return (
        <div style={{
            width: "100%",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            backgroundColor: readDarkMode() ? "#0f172a" : "#ffffff",
            position: "relative",
            touchAction: "none" // Prevent browser touch actions
        }}>
            {/* Orientation warning for mobile */}
            {isMobile && isPortrait && (
                <div style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    right: 10,
                    backgroundColor: "#ff9900",
                    color: "#000",
                    padding: "10px",
                    borderRadius: "5px",
                    fontSize: "14px",
                    textAlign: "center",
                    zIndex: 1000,
                    display: "none" // Optional: uncomment to show orientation warning
                }}>
                    Tip: Rotate to landscape for better gameplay
                </div>
            )}

            <div ref={gameParentRef} style={{
                maxWidth: "100%",
                maxHeight: "100vh",
            }} />
        </div>
    );
};

export default MazeRunner;