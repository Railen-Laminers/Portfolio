import Phaser from "phaser";

// Shared utilities
export function readDarkMode() {
    try {
        const stored = localStorage.getItem("darkMode");
        if (stored !== null) return stored === "true";
    } catch { }
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function drawMenuBackground(graphics, isDark, width, height) {
    const color = isDark ? 0x1f2937 : 0xbfbfbf;
    const TILE_BG = 40;
    for (let y = 0; y < height; y += TILE_BG) {
        for (let x = 0; x < width; x += TILE_BG) {
            const alpha = Math.random() * 0.1 + 0.05;
            graphics.fillStyle(color, alpha);
            graphics.fillRect(x, y, TILE_BG - 2, TILE_BG - 2);
        }
    }
}

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: "MainMenu" });
    }

    create() {
        const isDark = readDarkMode();
        this.bgGraphics = this.add.graphics();
        drawMenuBackground(this.bgGraphics, isDark, this.cameras.main.width, this.cameras.main.height);

        const textColor = isDark ? "#e5e7eb" : "#111111";
        const btnBg = isDark ? "#111827" : "#222222";
        const btnColor = isDark ? "#ff9d9d" : "#ff5555";

        const centerX = this.cameras.main.centerX;
        let startY = 180;
        const spacing = 75;

        // Title
        this.add.text(centerX, 80, "Maze Runner", {
            font: "48px Arial",
            fill: textColor,
            stroke: isDark ? "#ff9d9d" : "#ff5555",
            strokeThickness: 4
        }).setOrigin(0.5);

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

        addButton("Start Game", () => this.scene.start("MazeRunnerScene", { level: 1 }));
        addButton("Controls", () => this.showControls());
        addButton("Credits", () => this.showCredits());
        addButton("Exit", () => this.scene.systems.game.exitCallback?.());
    }

    showControls() {
        const controlsText =
            "CONTROLS\n" +
            "══════════\n" +
            "W - Move Up\n" +
            "A - Move Left\n" +
            "S - Move Down\n" +
            "D - Move Right\n" +
            "\nTips:\n" +
            "• Reach the green finish zone\n" +
            "• Avoid enemies after moving far\n" +
            "• Press I to toggle debug mode";
        alert(controlsText);
    }

    showCredits() {
        const creditsText =
            "CREDITS\n" +
            "══════════\n" +
            "Character Sprite: MemaoCharacterFantasySpritePack by Galv\n" +
            "Tile Assets: DeadlyEssence / Kailyn M.\n" +
            "Game Design: Railen";
        alert(creditsText);
    }

    update() {
        if (this.bgGraphics) {
            this.bgGraphics.x -= 0.5;
            if (this.bgGraphics.x < -50) this.bgGraphics.x = 0;
        }
    }
}