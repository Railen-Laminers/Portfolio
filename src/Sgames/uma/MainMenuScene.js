// MainMenuScene.js
import Phaser from "phaser";

export default class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: "MainMenu" });
    }

    create() {
        const isDark = this.readDarkMode();
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

        // Animated background
        this.bgGraphics = this.add.graphics();
        this.drawMenuBackground(isDark);

        // Buttons
        this.createButton(centerX, startY, "Start Game", () => this.scene.start("UmaScene"));
        this.createButton(centerX, startY + spacing, "Controls", () => this.showControls());
        this.createButton(centerX, startY + 2 * spacing, "Credits", () => this.showCredits());
        this.createButton(centerX, startY + 3 * spacing, "Exit", () => {
            if (typeof window.__exitToHome === "function") {
                window.__exitToHome();
            }
        });

        // Footer
        this.add.text(centerX, 520, "Suzuka's Adventure Awaits!", {
            font: "16px Arial",
            fill: isDark ? "#94a3b8" : "#666666"
        }).setOrigin(0.5);
    }

    createButton(x, y, label, callback) {
        const isDark = this.readDarkMode();
        const btnBg = isDark ? "#111827" : "#222222";
        const btnHover = isDark ? "#1f2937" : "#333333";
        const btnColor = isDark ? "#ff9d9d" : "#ff5555";

        const btn = this.add.text(x, y, label, {
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
                btn.setScale(1.1); // ✅ Correct: use `btn`, not `this`
                btn.setBackgroundColor(btnHover);
            })
            .on("pointerout", () => {
                btn.setScale(1); // ✅
                btn.setBackgroundColor(btnBg);
            });

        return btn;
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
        const { width, height } = this.cameras.main;

        for (let y = 0; y < height; y += TILE_BG) {
            for (let x = 0; x < width; x += TILE_BG) {
                const alpha = Math.random() * 0.1 + 0.05;
                this.bgGraphics.fillStyle(color, alpha);
                this.bgGraphics.fillRect(x, y, TILE_BG - 2, TILE_BG - 2);
            }
        }
    }

    showControls() {
        alert(
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
            "• Press I to toggle debug mode"
        );
    }

    showCredits() {
        alert(
            "CREDITS\n" +
            "══════════\n" +
            "Character Sprite: Suzuka (Custom)\n" +
            "Tile Assets: Grass Grass Pack\n" +
            "Decoration Assets: Pixel Art Tiles and Backgrounds\n\n"
        );
    }

    update() {
        if (this.bgGraphics) {
            this.bgGraphics.x -= 0.5;
            if (this.bgGraphics.x < -50) this.bgGraphics.x = 0;
        }
    }
}