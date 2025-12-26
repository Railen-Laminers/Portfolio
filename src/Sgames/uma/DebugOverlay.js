// DebugOverlay.js
export default class DebugOverlay {
    constructor(scene) {
        this.scene = scene;
        this.debugMode = false;

        this.graphics = scene.add.graphics();
        this.graphics.setDepth(1000);

        this.text = scene.add.text(10, 10, "", {
            fontSize: "14px",
            fill: "#e0f7ff",
            backgroundColor: "rgba(20, 40, 60, 0.85)",
            padding: { x: 8, y: 6 },
            stroke: "#1a3a5a",
            strokeThickness: 2
        });
        this.text.setScrollFactor(0);
        this.text.setDepth(1001);
        this.text.setVisible(false);

        scene.input.keyboard.on("keydown-I", () => {
            this.toggle();
        });
    }

    toggle() {
        this.debugMode = !this.debugMode;
        this.text.setVisible(this.debugMode);
        this.graphics.clear();
        if (!this.debugMode) this.text.setText("");
    }

    // ✅ Updated signature: added WORLD_HEIGHT
    update(player, debugGroups, WORLD_WIDTH, WORLD_HEIGHT, GROUND_LEVEL) {
        if (!this.debugMode) return;

        const { scene } = this;
        const camera = scene.cameras.main;
        const cameraBounds = {
            left: camera.scrollX,
            right: camera.scrollX + camera.width,
            top: camera.scrollY,
            bottom: camera.scrollY + camera.height
        };

        player.debugData = {
            type: "player",
            state: player.anims.currentAnim ? player.anims.currentAnim.key : "unknown",
            onGround: player.body.blocked.down,
            velocity: { x: Math.round(player.body.velocity.x), y: Math.round(player.body.velocity.y) },
            position: { x: Math.round(player.x), y: Math.round(player.y) }
        };

        let debugInfo = [
            "=== DEBUG MODE (Press I to toggle) ===",
            `Player: ${player.debugData.state}`,
            `Position: (${player.debugData.position.x}, ${player.debugData.position.y})`,
            `Velocity: (${player.debugData.velocity.x}, ${player.debugData.velocity.y})`,
            `On Ground: ${player.debugData.onGround}`,
            `Facing: ${player.flipX ? "Left" : "Right"}`,
            `Camera: (${Math.round(camera.scrollX)}, ${Math.round(camera.scrollY)})`,
            "",
            "=== OBJECTS IN VIEW ==="
        ];

        this.graphics.clear();

        let objectCount = 0, decorInView = 0, groundInView = 0, cloudsInView = 0;

        // Player
        this.graphics.fillStyle(0xff0000, 0.1);
        const playerBounds = player.getBounds();
        this.graphics.fillRect(playerBounds.x, playerBounds.y, playerBounds.width, playerBounds.height);
        this.graphics.lineStyle(2, 0xff3333, 1);
        this.graphics.strokeRect(playerBounds.x, playerBounds.y, playerBounds.width, playerBounds.height);
        this.graphics.fillStyle(0xff0000, 0.8);
        this.graphics.fillCircle(player.x, player.y, 4);
        debugInfo.push(`[PLAYER] (${Math.round(player.x)}, ${Math.round(player.y)}) 64x64`);
        objectCount++;

        // Ground
        this.graphics.lineStyle(1, 0x88ff88, 0.7);
        debugGroups.ground.children.iterate((tile) => {
            const bounds = tile.getBounds();
            if (bounds.x < cameraBounds.right && bounds.right > cameraBounds.left) {
                this.graphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
                groundInView++; objectCount++;
            }
        });

        // Decorations
        this.graphics.lineStyle(2, 0x88aaff, 0.8);
        debugGroups.decorations.children.iterate((decor) => {
            const bounds = decor.getBounds();
            if (bounds.x < cameraBounds.right && bounds.right > cameraBounds.left) {
                this.graphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
                this.graphics.fillStyle(0xffff88, 0.9);
                this.graphics.fillCircle(decor.x, decor.y, 3);
                this.graphics.fillStyle(0xff88ff, 0.9);
                this.graphics.fillCircle(decor.x, decor.y + decor.height / 2, 2);
                decorInView++; objectCount++;
            }
        });

        // Clouds
        this.graphics.lineStyle(1, 0x88ffff, 0.6);
        debugGroups.clouds.children.iterate((cloud) => {
            const bounds = cloud.getBounds();
            if (bounds.x < cameraBounds.right && bounds.right > cameraBounds.left) {
                this.graphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
                const scrollX = cloud.scrollFactorX || 0.5;
                this.graphics.lineStyle(1, 0xffff88, 0.8);
                this.graphics.lineBetween(cloud.x - 10, cloud.y - 10, cloud.x - 10 + (scrollX * 20), cloud.y - 10);
                cloudsInView++; objectCount++;
            }
        });

        // World & camera outlines
        this.graphics.lineStyle(2, 0xffff00, 0.4);
        this.graphics.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT); // ✅ Now WORLD_HEIGHT is defined
        this.graphics.lineStyle(2, 0xff88ff, 0.6);
        this.graphics.lineBetween(0, GROUND_LEVEL, WORLD_WIDTH, GROUND_LEVEL);
        this.graphics.lineStyle(2, 0xffffff, 0.3);
        this.graphics.strokeRect(cameraBounds.left, cameraBounds.top, camera.width, camera.height);

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

        this.text.setText(debugInfo);
    }
}