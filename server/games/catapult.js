// server/games/catapult.js

const GRAVITY = 0.5;
const GROUND_Y = 500;
const MAP_WIDTH = 2000; // Breite Map

const createGameState = (users) => {
    return {
        players: users.map(u => u.socketId),
        // Positionen weit auseinander
        positions: { 
            [users[0].socketId]: { x: 150, y: GROUND_Y - 40 }, 
            [users[1].socketId]: { x: MAP_WIDTH - 150, y: GROUND_Y - 40 } 
        },
        lives: { [users[0].socketId]: 3, [users[1].socketId]: 3 }, // 3 Leben
        
        turnIndex: 0,
        projectile: null, 
        explosion: null, // {x, y} für Effekt
        lastPath: [], // Pfad des letzten Schusses für Ghost-Trail
        currentPath: [], // Pfad des aktuellen Schusses

        winner: null,
        message: "Adjust Angle & Power!"
    };
};

// server/games/catapult.js

// ... (Konstanten und createGameState bleiben gleich)

const handleShoot = (gameState, socketId, { angle, power }) => {
    if (gameState.winner || gameState.projectile) return;
    
    const activePlayer = gameState.players[gameState.turnIndex];
    if (socketId !== activePlayer) return;

    // Winkel begrenzen
    const safeAngle = Math.max(0, Math.min(90, angle));
    const safePower = Math.max(0, Math.min(150, power)); 

    let rad = (safeAngle * Math.PI) / 180;
    let vx = Math.cos(rad) * safePower * 0.4; 
    let vy = -Math.sin(rad) * safePower * 0.4; 

    const startPos = gameState.positions[socketId];
    
    // START-OFFSET BERECHNEN
    let spawnX, spawnY;

    // Spieler 1 (Index 0) schießt nach Rechts. Sein Korb ist links am Katapult.
    if (gameState.turnIndex === 0) {
        spawnX = startPos.x - 25; // Verschiebung nach links zum Korb
        spawnY = startPos.y - 90; // Verschiebung nach oben (Hügel+Burg+Katapult)
    } 
    // Spieler 2 (Index 1) schießt nach Links. Sein Katapult ist gespiegelt, Korb rechts.
    else {
        vx = -vx;
        spawnX = startPos.x + 25; // Verschiebung nach rechts zum Korb
        spawnY = startPos.y - 90; 
    }

    gameState.projectile = { x: spawnX, y: spawnY, vx, vy };
    
    // WICHTIG: Pfad muss auch dort starten
    gameState.currentPath = [{x: spawnX, y: spawnY}]; 
    
    gameState.explosion = null; 
    gameState.message = "FIRE!";
};

// ... (updateLoop und Rest der Datei bleiben gleich) ...

const updateLoop = (gameState) => {
    if (gameState.winner) return;

    const proj = gameState.projectile;
    if (proj) {
        // Physik
        proj.x += proj.vx;
        proj.y += proj.vy;
        proj.vy += GRAVITY;

        // Pfad speichern (nur alle paar Frames um Daten zu sparen, hier jeden Frame ok)
        gameState.currentPath.push({x: proj.x, y: proj.y});

        // Kollision Boden
        if (proj.y >= GROUND_Y) {
            triggerExplosion(gameState, proj.x, GROUND_Y);
            nextTurn(gameState, "MISS!");
            return;
        }
        
        // Kollision Wände (Links/Rechts)
        if (proj.x < -100 || proj.x > MAP_WIDTH + 100) {
            nextTurn(gameState, "OUT OF BOUNDS!");
            return;
        }

        // Kollision Gegner
        const opponentId = gameState.players[(gameState.turnIndex + 1) % 2];
        const oppPos = gameState.positions[opponentId];
        
        // Hitbox ca 60x60
        if (Math.abs(proj.x - oppPos.x) < 50 && Math.abs(proj.y - oppPos.y) < 60) {
            triggerExplosion(gameState, oppPos.x, oppPos.y);
            
            gameState.lives[opponentId] -= 1;
            
            if (gameState.lives[opponentId] <= 0) {
                gameState.lives[opponentId] = 0;
                gameState.winner = gameState.players[gameState.turnIndex];
                gameState.message = "VICTORY!";
            } else {
                nextTurn(gameState, "HIT! -1 LIFE");
            }
        }
    }
};

const triggerExplosion = (gameState, x, y) => {
    gameState.explosion = { x, y };
    gameState.projectile = null;
    gameState.lastPath = [...gameState.currentPath]; // Pfad sichern
    gameState.currentPath = [];
};

const nextTurn = (gameState, msg) => {
    gameState.turnIndex = (gameState.turnIndex + 1) % 2;
    gameState.message = msg;
    gameState.projectile = null;
    if (!gameState.explosion) {
         // Falls Out of Bounds, trotzdem Pfad speichern
         gameState.lastPath = [...gameState.currentPath];
         gameState.currentPath = [];
    }
};

module.exports = { createGameState, handleShoot, updateLoop };