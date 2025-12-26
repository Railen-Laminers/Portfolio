// src/components/MazeRunner/DebugOverlay.js
export function createDebugOverlay(scene) {
    scene.debugGraphics = scene.add.graphics();
    scene.debugGraphics.setScrollFactor(0);
    scene.debugGraphics.setDepth(1000);
    scene.debugLabels = [];
}

export function updateDebugOverlay(scene) {
    if (!scene.debugMode) {
        if (scene.debugGraphics) scene.debugGraphics.clear();
        if (scene.debugLabels) {
            scene.debugLabels.forEach(l => l.destroy?.());
            scene.debugLabels = [];
        }
        return;
    }

    if (!scene.debugGraphics) createDebugOverlay(scene);
    else scene.debugGraphics.clear();

    scene.debugLabels?.forEach(l => l.destroy?.());
    scene.debugLabels = [];

    const textStyle = { font: "10px monospace", fill: "#ffff00" };

    const drawDebugFor = (obj, label) => {
        const bounds = obj.getBounds();
        scene.debugGraphics.lineStyle(1, 0x00ffff, 0.8);
        scene.debugGraphics.strokeRectShape(bounds);
        const text = scene.add.text(bounds.x, bounds.y - 15, `${label}: (${Math.round(obj.x)}, ${Math.round(obj.y)})`, textStyle)
            .setScrollFactor(0)
            .setDepth(1000);
        scene.debugLabels.push(text);
    };

    drawDebugFor(scene.player, "Player");
    drawDebugFor(scene.finish, "Finish");
    if (scene.enemy) drawDebugFor(scene.enemy, "Enemy");

    const maxWallLabels = 5;
    scene.walls.forEach((wall, i) => {
        const bounds = wall.getBounds();
        scene.debugGraphics.lineStyle(1, 0xff00ff, 0.6);
        scene.debugGraphics.strokeRectShape(bounds);
        if (i < maxWallLabels) {
            const wallText = scene.add.text(bounds.x, bounds.y - 12, `Wall ${i}`, { font: "8px monospace", fill: "#ff00ff" })
                .setScrollFactor(0)
                .setDepth(1000);
            scene.debugLabels.push(wallText);
        }
    });
}

export function cleanupDebugOverlay(scene) {
    try {
        if (scene.debugGraphics) {
            scene.debugGraphics.destroy();
            scene.debugGraphics = null;
        }
    } catch (e) { }

    if (scene.debugLabels) {
        scene.debugLabels.forEach(l => {
            try { l.destroy(); } catch (e) { }
        });
        scene.debugLabels = [];
    }
}