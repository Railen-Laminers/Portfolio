// src/Sgames/race/Race.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Phaser from "phaser";

const BASE = import.meta.env.BASE_URL || '/';

// Racer sprite paths
export const s_idle = `${BASE}assets/Characters/suzuka/S_idle.png`;
export const s_walk = `${BASE}assets/Characters/suzuka/S_walk.png`;
export const s_run = `${BASE}assets/Characters/suzuka/S_run.png`;
export const s_sprint = `${BASE}assets/Characters/suzuka/S_sprint.png`;
export const o_idle = `${BASE}assets/Characters/oguri/O_idle.png`;
export const o_walk = `${BASE}assets/Characters/oguri/O_walk.png`;
export const o_run = `${BASE}assets/Characters/oguri/O_run.png`;
export const o_sprint = `${BASE}assets/Characters/oguri/O_sprint.png`;
export const mc_idle = `${BASE}assets/Characters/mcQueen/Mc_idle.png`;
export const mc_walk = `${BASE}assets/Characters/mcQueen/Mc_walk.png`;
export const mc_run = `${BASE}assets/Characters/mcQueen/Mc_run.png`;
export const mc_sprint = `${BASE}assets/Characters/mcQueen/Mc_sprint.png`;

const DISTANCE_CONFIG = {
    sprint: { label: "Sprint (400m)", finishLineX: 1200 },
    mile: { label: "Mile (800m)", finishLineX: 1800 },
    medium: { label: "Medium (1600m)", finishLineX: 2400 },
    long: { label: "Long (3200m)", finishLineX: 3600 },
};

const RACER_NAMES = ["Suzuka", "Oguri", "Mc Queen"];
const RACER_SPRITES = {
    Suzuka: s_idle,
    Oguri: o_idle,
    "Mc Queen": mc_idle,
};

const STORAGE_KEY_RACER = "race_selected_racer";
const STORAGE_KEY_DISTANCE = "race_selected_distance";

// Sprite frame configurations based on your assets
const SPRITE_CONFIG = {
    idle: { frameWidth: 64, frameHeight: 64, frames: 3 },
    walk: { frameWidth: 64, frameHeight: 64, frames: 6 },
    run: { frameWidth: 64, frameHeight: 64, frames: 6 },
    sprint: { frameWidth: 64, frameHeight: 64, frames: 6 }
};

const Race = () => {
    const gameRef = useRef(null);
    const navigate = useNavigate();
    const [selectedRacer, setSelectedRacer] = useState(null);
    const [selectedDistance, setSelectedDistance] = useState(null);
    const [raceStarted, setRaceStarted] = useState(false);
    const [countdown, setCountdown] = useState(null);
    const [raceResult, setRaceResult] = useState(null);
    const [leaderboardIndices, setLeaderboardIndices] = useState([0, 1, 2]);
    const [gameSize, setGameSize] = useState({ width: 800, height: 400 });

    // Handle window resize
    useEffect(() => {
        const updateGameSize = () => {
            const isMobile = window.innerWidth < 768;
            const isTablet = window.innerWidth < 1024;

            if (isMobile) {
                setGameSize({
                    width: window.innerWidth - 32,
                    height: Math.min(300, window.innerHeight * 0.5)
                });
            } else if (isTablet) {
                setGameSize({
                    width: Math.min(window.innerWidth - 64, 700),
                    height: 350
                });
            } else {
                setGameSize({ width: 800, height: 400 });
            }
        };

        updateGameSize();
        window.addEventListener('resize', updateGameSize);
        return () => window.removeEventListener('resize', updateGameSize);
    }, []);

    // Load saved selections
    useEffect(() => {
        try {
            const savedRacer = localStorage.getItem(STORAGE_KEY_RACER);
            const savedDistance = localStorage.getItem(STORAGE_KEY_DISTANCE);
            if (savedRacer && RACER_NAMES.includes(savedRacer)) {
                setSelectedRacer(savedRacer);
            }
            if (savedDistance && Object.keys(DISTANCE_CONFIG).includes(savedDistance)) {
                setSelectedDistance(savedDistance);
            }
        } catch (e) {
            console.warn("Failed to load race preferences");
        }
    }, []);

    const readyToStart = selectedRacer !== null && selectedDistance !== null;

    const handleStartRace = () => {
        if (readyToStart) {
            try {
                localStorage.setItem(STORAGE_KEY_RACER, selectedRacer);
                localStorage.setItem(STORAGE_KEY_DISTANCE, selectedDistance);
            } catch (e) {
                console.warn("Failed to save race preferences");
            }
            setRaceStarted(true);
            setRaceResult(null);
        }
    };

    // ======================
    // PHASER GAME LOGIC (Fixed for mobile)
    // ======================
    useEffect(() => {
        if (!raceStarted) return;

        let gameInstance = null;
        let racers = [];
        let raceActive = false;
        const finishLineX = DISTANCE_CONFIG[selectedDistance].finishLineX;
        let winnerDeclared = false;

        let countdownValue = 3;
        setCountdown(countdownValue);
        const countdownInterval = setInterval(() => {
            countdownValue--;
            if (countdownValue >= 0) setCountdown(countdownValue);
            if (countdownValue < 0) {
                clearInterval(countdownInterval);
                setCountdown(null);
                if (gameInstance?.scene.getScene('RaceScene')?.startRace) {
                    gameInstance.scene.getScene('RaceScene').startRace();
                }
                raceActive = true;
            }
        }, 1000);

        // Detect current theme for canvas background
        const isDark = document.documentElement.classList.contains('dark');
        const canvasBg = isDark ? "#1e293b" : "#f1f5f9";

        const config = {
            type: Phaser.AUTO,
            width: gameSize.width,
            height: gameSize.height,
            parent: gameRef.current,
            backgroundColor: canvasBg,
            physics: {
                default: "arcade",
                arcade: {
                    debug: false,
                    gravity: { y: 0 }
                }
            },
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            scene: {
                key: 'RaceScene',
                preload: preload,
                create: create,
                update: update,
            },
        };

        const game = new Phaser.Game(config);
        gameInstance = game;

        function preload() {
            // Load spritesheets with correct frame dimensions from your assets
            this.load.spritesheet("suzuka_idle", s_idle, {
                frameWidth: SPRITE_CONFIG.idle.frameWidth,
                frameHeight: SPRITE_CONFIG.idle.frameHeight
            });
            this.load.spritesheet("suzuka_walk", s_walk, {
                frameWidth: SPRITE_CONFIG.walk.frameWidth,
                frameHeight: SPRITE_CONFIG.walk.frameHeight
            });
            this.load.spritesheet("suzuka_run", s_run, {
                frameWidth: SPRITE_CONFIG.run.frameWidth,
                frameHeight: SPRITE_CONFIG.run.frameHeight
            });
            this.load.spritesheet("suzuka_sprint", s_sprint, {
                frameWidth: SPRITE_CONFIG.sprint.frameWidth,
                frameHeight: SPRITE_CONFIG.sprint.frameHeight
            });

            this.load.spritesheet("oguri_idle", o_idle, {
                frameWidth: SPRITE_CONFIG.idle.frameWidth,
                frameHeight: SPRITE_CONFIG.idle.frameHeight
            });
            this.load.spritesheet("oguri_walk", o_walk, {
                frameWidth: SPRITE_CONFIG.walk.frameWidth,
                frameHeight: SPRITE_CONFIG.walk.frameHeight
            });
            this.load.spritesheet("oguri_run", o_run, {
                frameWidth: SPRITE_CONFIG.run.frameWidth,
                frameHeight: SPRITE_CONFIG.run.frameHeight
            });
            this.load.spritesheet("oguri_sprint", o_sprint, {
                frameWidth: SPRITE_CONFIG.sprint.frameWidth,
                frameHeight: SPRITE_CONFIG.sprint.frameHeight
            });

            this.load.spritesheet("mc_idle", mc_idle, {
                frameWidth: SPRITE_CONFIG.idle.frameWidth,
                frameHeight: SPRITE_CONFIG.idle.frameHeight
            });
            this.load.spritesheet("mc_walk", mc_walk, {
                frameWidth: SPRITE_CONFIG.walk.frameWidth,
                frameHeight: SPRITE_CONFIG.walk.frameHeight
            });
            this.load.spritesheet("mc_run", mc_run, {
                frameWidth: SPRITE_CONFIG.run.frameWidth,
                frameHeight: SPRITE_CONFIG.run.frameHeight
            });
            this.load.spritesheet("mc_sprint", mc_sprint, {
                frameWidth: SPRITE_CONFIG.sprint.frameWidth,
                frameHeight: SPRITE_CONFIG.sprint.frameHeight
            });
        }

        function create() {
            const canvasWidth = this.cameras.main.width;
            const canvasHeight = this.cameras.main.height;

            // Scale game elements based on screen size
            const scaleFactor = Math.min(canvasWidth / 800, canvasHeight / 400);
            const adjustedFinishLineX = finishLineX * scaleFactor;

            const numLanes = 3;
            const laneHeight = 40 * (canvasHeight / 400);
            const laneSpacing = 10 * (canvasHeight / 400);
            const totalRaceHeight = numLanes * laneHeight + (numLanes - 1) * laneSpacing;
            const topY = (canvasHeight - totalRaceHeight) / 2 + laneHeight / 2;
            const lanePositions = [];
            const laneColors = [0xffcccc, 0xccffcc, 0xccccff];

            for (let i = 0; i < numLanes; i++) {
                const laneY = topY + i * (laneHeight + laneSpacing);
                lanePositions.push(laneY);
                this.add.rectangle(adjustedFinishLineX / 2, laneY, adjustedFinishLineX, laneHeight, laneColors[i])
                    .setStrokeStyle(2, isDark ? 0x555555 : 0xaaaaaa);
            }

            const finishLineWidth = 30 * scaleFactor;
            const darkRed = 0x8B0000;
            this.add.rectangle(adjustedFinishLineX + finishLineWidth / 2, canvasHeight / 2, finishLineWidth, canvasHeight, darkRed);

            // Create animations with correct frame counts
            const createAnims = (prefix) => {
                // Idle animation (3 frames)
                this.anims.create({
                    key: `${prefix}_idle`,
                    frames: this.anims.generateFrameNumbers(`${prefix}_idle`, {
                        start: 0,
                        end: SPRITE_CONFIG.idle.frames - 1
                    }),
                    frameRate: 6,
                    repeat: -1,
                });

                // Walk animation (6 frames)
                this.anims.create({
                    key: `${prefix}_walk`,
                    frames: this.anims.generateFrameNumbers(`${prefix}_walk`, {
                        start: 0,
                        end: SPRITE_CONFIG.walk.frames - 1
                    }),
                    frameRate: 10,
                    repeat: -1,
                });

                // Run animation (6 frames)
                this.anims.create({
                    key: `${prefix}_run`,
                    frames: this.anims.generateFrameNumbers(`${prefix}_run`, {
                        start: 0,
                        end: SPRITE_CONFIG.run.frames - 1
                    }),
                    frameRate: 15,
                    repeat: -1,
                });

                // Sprint animation (6 frames)
                this.anims.create({
                    key: `${prefix}_sprint`,
                    frames: this.anims.generateFrameNumbers(`${prefix}_sprint`, {
                        start: 0,
                        end: SPRITE_CONFIG.sprint.frames - 1
                    }),
                    frameRate: 20,
                    repeat: -1,
                });
            };

            createAnims("suzuka");
            createAnims("oguri");
            createAnims("mc");

            const racerConfigs = [
                { prefix: "suzuka", name: "Suzuka" },
                { prefix: "oguri", name: "Oguri" },
                { prefix: "mc", name: "Mc Queen" }
            ];

            racers = racerConfigs.map((cfg, idx) => {
                const startX = 50 * scaleFactor;
                const startY = lanePositions[idx];

                const racer = this.physics.add.sprite(startX, startY, `${cfg.prefix}_idle`);
                racer.setData("animPrefix", cfg.prefix);
                racer.setData("currentLane", idx);
                racer.setData("racePhase", "idle");
                racer.setData("name", cfg.name);
                racer.lanePositions = lanePositions;

                // Scale the sprite display size, not the frame dimensions
                const spriteScale = 0.8 * scaleFactor;
                racer.setScale(spriteScale);

                // Adjust body size based on scale
                racer.body.setSize(40 * spriteScale, 50 * spriteScale, true);
                racer.flipX = true;

                racer.anims.play(`${cfg.prefix}_idle`, true);
                return racer;
            });

            this.cameras.main.setBounds(0, 0, adjustedFinishLineX + finishLineWidth, canvasHeight);
            const followRacer = racers.find(r => r.getData("name") === selectedRacer);
            if (followRacer) {
                this.cameras.main.startFollow(followRacer, true, 0.08, 0.08);
            }

            this.startRace = () => {
                racers.forEach(racer => {
                    const prefix = racer.getData("animPrefix");
                    racer.anims.play(`${prefix}_walk`, true);
                    racer.setData("racePhase", "walk");
                });

                this.time.delayedCall(1500, () => {
                    racers.forEach(racer => {
                        const prefix = racer.getData("animPrefix");
                        racer.anims.play(`${prefix}_run`, true);
                        racer.setData("racePhase", "run");
                    });
                });
            };
        }

        function update() {
            if (!raceActive || winnerDeclared) return;

            const canvasWidth = this.cameras.main.width;
            const scaleFactor = canvasWidth / 800;
            const adjustedFinishLineX = finishLineX * scaleFactor;

            racers.forEach((racer) => {
                if (racer.x >= adjustedFinishLineX) return;

                const progress = Phaser.Math.Clamp(racer.x / adjustedFinishLineX, 0, 1);
                let currentPhase = racer.getData("racePhase");

                if (progress >= 0.6 && currentPhase !== "sprint") {
                    const prefix = racer.getData("animPrefix");
                    racer.anims.play(`${prefix}_sprint`, true);
                    racer.setData("racePhase", "sprint");
                    currentPhase = "sprint";
                }

                let baseSpeed = 0;
                switch (currentPhase) {
                    case "walk":
                        baseSpeed = Phaser.Math.Between(2, 3) * scaleFactor;
                        break;
                    case "run":
                        baseSpeed = Phaser.Math.Between(4, 6) * scaleFactor;
                        break;
                    case "sprint":
                        baseSpeed = Phaser.Math.Between(7, 9) * scaleFactor;
                        break;
                    default:
                        baseSpeed = 0;
                }

                // Add some randomness
                if (Phaser.Math.Between(0, 100) > 95) {
                    baseSpeed += Phaser.Math.Between(0.5, 1.5) * scaleFactor;
                }

                racer.x += baseSpeed;

                // Lane switching with less frequency for smoother animation
                if (Phaser.Math.Between(0, 100) > 99) {
                    const currentLane = racer.getData("currentLane");
                    const direction = Phaser.Math.Between(-1, 1);
                    const newLane = currentLane + direction;

                    if (newLane >= 0 && newLane < racer.lanePositions.length && newLane !== currentLane) {
                        racer.setData("currentLane", newLane);
                        this.tweens.add({
                            targets: racer,
                            y: racer.lanePositions[newLane],
                            duration: 400,
                            ease: "Sine.easeInOut",
                        });
                    }
                }
            });

            if (!winnerDeclared) {
                const finishedRacers = racers.filter(r => r.x >= adjustedFinishLineX);
                if (finishedRacers.length > 0) {
                    winnerDeclared = true;
                    raceActive = false;

                    racers.forEach(r => {
                        r.anims.stop();
                        r.body.setVelocity(0, 0);
                        r.body.enable = false;
                    });

                    const winnerIndex = racers.indexOf(finishedRacers[0]);
                    const userWon = racers[winnerIndex].getData("name") === selectedRacer;
                    setRaceResult(userWon ? "win" : "lose");
                }
            }

            const sortedIndices = [...racers]
                .map((racer, idx) => ({ idx, x: racer.x }))
                .sort((a, b) => b.x - a.x)
                .map(item => item.idx);
            setLeaderboardIndices(sortedIndices);
        }

        return () => {
            clearInterval(countdownInterval);
            if (game) {
                try {
                    game.destroy(true);
                } catch (e) {
                    console.warn("Game destroy error:", e);
                }
            }
        };
    }, [raceStarted, selectedRacer, selectedDistance, gameSize]);

    // ======================
    // MAIN MENU — Responsive Design
    // ======================
    if (!raceStarted) {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-6 bg-primary-light dark:bg-primary-dark text-secondary-light dark:text-secondary-dark">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 md:mb-8 animate-fade-in text-center">
                    🏁 <span className="text-accent-light dark:text-accent-dark">RACE</span>
                </h1>

                {/* Character Selector */}
                <div className="w-full max-w-6xl mb-6 md:mb-8 text-center animate-slide-in px-2">
                    <h2 className="text-xl sm:text-2xl font-semibold mb-3 md:mb-4 text-gray-800 dark:text-gray-100">
                        Choose Your Racer
                    </h2>
                    <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                        {RACER_NAMES.map((name) => {
                            const isSelected = selectedRacer === name;
                            return (
                                <div
                                    key={name}
                                    onClick={() => setSelectedRacer(name)}
                                    className={`flex flex-col items-center cursor-pointer transition-transform ${isSelected ? 'scale-105' : 'opacity-80 hover:opacity-100'} active:scale-95`}
                                >
                                    <div
                                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-cover bg-center border-2 transition-colors ${isSelected
                                            ? 'border-accent-light dark:border-accent-dark shadow-lg'
                                            : 'border-transparent'
                                            }`}
                                        style={{ backgroundImage: `url(${RACER_SPRITES[name]})` }}
                                    />
                                    <span className={`mt-2 text-sm sm:text-base font-medium ${isSelected ? 'text-accent-light dark:text-accent-dark' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Distance Selector */}
                <div className="w-full max-w-6xl mb-6 md:mb-8 text-center animate-slide-in px-2">
                    <h2 className="text-xl sm:text-2xl font-semibold mb-3 md:mb-4 text-gray-800 dark:text-gray-100">
                        Choose Distance
                    </h2>
                    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                        {Object.entries(DISTANCE_CONFIG).map(([key, config]) => {
                            const isSelected = selectedDistance === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setSelectedDistance(key)}
                                    className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${isSelected
                                        ? 'bg-accent-light text-white dark:bg-accent-dark dark:text-gray-900'
                                        : 'bg-primary-light dark:bg-primary-dark border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    {config.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 animate-fade-in w-full max-w-md px-4">
                    <button
                        onClick={handleStartRace}
                        disabled={!readyToStart}
                        className={`px-5 py-3 sm:px-6 sm:py-3 text-base sm:text-lg font-bold rounded-lg transition-all ${readyToStart
                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-md active:scale-95'
                            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        Start Race
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="px-5 py-3 sm:px-6 sm:py-3 text-base sm:text-lg font-bold rounded-lg bg-primary-light dark:bg-primary-dark border border-gray-300 dark:border-gray-600 text-accent-light dark:text-accent-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-95"
                    >
                        Exit
                    </button>
                </div>
            </div>
        );
    }

    // ======================
    // RACE VIEW — Responsive Design
    // ======================
    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-2 sm:p-4 bg-primary-light dark:bg-primary-dark overflow-x-hidden">
            {/* Countdown Overlay */}
            {countdown !== null && (
                <div className="fixed inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="text-5xl sm:text-6xl md:text-7xl font-bold text-accent-light dark:text-accent-dark drop-shadow-lg animate-pulse">
                        {countdown > 0 ? countdown : "Go!"}
                    </div>
                </div>
            )}

            {/* Game Canvas Container */}
            <div className="w-full max-w-6xl flex justify-center mb-4 sm:mb-6">
                <div
                    ref={gameRef}
                    className="w-full rounded-lg overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700"
                    style={{
                        maxWidth: `${gameSize.width}px`,
                        height: `${gameSize.height}px`
                    }}
                />
            </div>

            {/* Live Leaderboard - Responsive Positioning */}
            {!raceResult && (
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white/95 dark:bg-gray-800/95 p-2 sm:p-3 rounded-lg shadow-md min-w-[120px] sm:min-w-[160px] border border-gray-200 dark:border-gray-700 backdrop-blur-sm z-10">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1 sm:mb-2 text-sm sm:text-base">
                        Leaderboard
                    </h3>
                    <ol className="list-decimal pl-3 sm:pl-4 space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
                        {leaderboardIndices.map((racerIndex, rank) => {
                            const isUser = racerIndex === RACER_NAMES.indexOf(selectedRacer);
                            return (
                                <li
                                    key={rank}
                                    className={`${isUser
                                        ? 'text-accent-light dark:text-accent-dark font-semibold pl-1 border-l-2 border-accent-light dark:border-accent-dark'
                                        : 'text-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    {RACER_NAMES[racerIndex]}
                                </li>
                            );
                        })}
                    </ol>
                </div>
            )}

            {/* Result Modal with Podium - Responsive */}
            {raceResult && (
                <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex flex-col items-center justify-center z-10 p-4">
                    <div className="w-full max-w-md mx-auto">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-accent-light dark:text-accent-dark mb-4 sm:mb-6 text-center">
                            Race Results
                        </h2>
                        <div className="bg-white/95 dark:bg-gray-800/95 p-4 sm:p-5 rounded-xl shadow-xl backdrop-blur-sm border border-gray-300 dark:border-gray-700">
                            {leaderboardIndices.map((racerIndex, rank) => {
                                const isUser = racerIndex === RACER_NAMES.indexOf(selectedRacer);
                                const place = rank === 0 ? "1st" : rank === 1 ? "2nd" : "3rd";
                                return (
                                    <div
                                        key={rank}
                                        className={`flex items-center justify-between py-2 px-3 my-1 rounded ${isUser ? 'bg-yellow-100/60 dark:bg-yellow-900/40' : 'bg-gray-100/50 dark:bg-gray-700/50'
                                            }`}
                                    >
                                        <span className={`font-bold ${isUser ? 'text-accent-light dark:text-accent-dark' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {place}
                                        </span>
                                        <span className={`${isUser ? 'font-semibold text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {RACER_NAMES[racerIndex]}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-4 sm:mt-6">
                            <button
                                onClick={() => {
                                    setRaceStarted(false);
                                    setSelectedRacer(null);
                                    setSelectedDistance(null);
                                    setRaceResult(null);
                                    setLeaderboardIndices([0, 1, 2]);
                                }}
                                className="px-5 py-3 sm:px-6 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors active:scale-95 text-sm sm:text-base"
                            >
                                Race Again
                            </button>

                            <button
                                onClick={() => navigate('/')}
                                className="px-5 py-3 sm:px-6 sm:py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors active:scale-95 text-sm sm:text-base"
                            >
                                Main Menu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Race;