// server/games/tankDuel.js

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const TANK_SIZE = 40;
const BULLET_SIZE = 8;
const TANK_SPEED = 4;
const BULLET_SPEED = 8;
const MAX_HP = 3;

// --- MAP DEFINITIONEN ---
const MAPS = [
    {
        name: "Classic",
        walls: [
            { x: 100, y: 100, w: 50, h: 200 },
            { x: 650, y: 300, w: 50, h: 200 },
            { x: 300, y: 200, w: 200, h: 50 },
            { x: 300, y: 350, w: 200, h: 50 },
            { x: 375, y: 100, w: 50, h: 50 },
            { x: 375, y: 450, w: 50, h: 50 }
        ],
        spawns: [
            { x: 50, y: 50, angle: 0 },   // P1
            { x: 700, y: 500, angle: 180 }, // P2
            { x: 700, y: 50, angle: 90 },   // Bot 1
            { x: 50, y: 500, angle: 270 }   // Bot 2
        ]
    },
    {
        name: "The Cross",
        walls: [
            { x: 350, y: 100, w: 100, h: 400 }, // Vertikal
            { x: 100, y: 250, w: 600, h: 100 }, // Horizontal
            { x: 100, y: 100, w: 50, h: 50 },   // Ecke LO
            { x: 650, y: 100, w: 50, h: 50 },   // Ecke RO
            { x: 100, y: 450, w: 50, h: 50 },   // Ecke LU
            { x: 650, y: 450, w: 50, h: 50 }    // Ecke RU
        ],
        spawns: [
            { x: 50, y: 50, angle: 45 },
            { x: 700, y: 500, angle: 225 },
            { x: 700, y: 50, angle: 135 },
            { x: 50, y: 500, angle: 315 }
        ]
    },
    {
        name: "Pillars",
        walls: [
            { x: 150, y: 150, w: 60, h: 60 },
            { x: 590, y: 150, w: 60, h: 60 },
            { x: 150, y: 390, w: 60, h: 60 },
            { x: 590, y: 390, w: 60, h: 60 },
            { x: 370, y: 270, w: 60, h: 60 }  // Mitte
        ],
        spawns: [
            { x: 50, y: 280, angle: 0 },
            { x: 700, y: 280, angle: 180 },
            { x: 380, y: 50, angle: 90 },
            { x: 380, y: 500, angle: 270 }
        ]
    }
];

const createGameState = (users) => {
    // Zufällige Map auswählen
    const mapIndex = Math.floor(Math.random() * MAPS.length);
    const selectedMap = MAPS[mapIndex];

    const tanks = {};
    
    // Spieler initialisieren (max 2)
    users.forEach((u, i) => {
        if (i < 2) { // Sicherstellen, dass wir max 2 Spieler spawnen
            tanks[u.socketId] = {
                x: selectedMap.spawns[i].x,
                y: selectedMap.spawns[i].y,
                angle: selectedMap.spawns[i].angle,
                hp: MAX_HP,
                color: i === 0 ? '#4dfff3' : '#e94560', // Cyan & Rot
                cooldown: 0,
                inputs: { x: 0, y: 0 },
                isBot: false
            };
        }
    });

    // 2 Bots hinzufügen
    for (let i = 1; i <= 2; i++) {
        const botId = `bot_${i}`;
        // Spawn Index verschieben (Spieler sind 0 und 1, Bots 2 und 3)
        const spawnIdx = 1 + i; 
        
        tanks[botId] = {
            x: selectedMap.spawns[spawnIdx] ? selectedMap.spawns[spawnIdx].x : 50,
            y: selectedMap.spawns[spawnIdx] ? selectedMap.spawns[spawnIdx].y : 50,
            angle: selectedMap.spawns[spawnIdx] ? selectedMap.spawns[spawnIdx].angle : 0,
            hp: MAX_HP,
            color: '#99ff99', // Grün für Bots
            cooldown: 0,
            inputs: { x: 0, y: 0 },
            isBot: true,
            // Bot spezifische Daten
            moveTimer: 0,
            targetAngle: 0
        };
    }

    return {
        players: users.map(u => u.socketId),
        tanks: tanks,
        bullets: [],
        walls: selectedMap.walls,
        mapName: selectedMap.name,
        winner: null,
        dimensions: { width: GAME_WIDTH, height: GAME_HEIGHT }
    };
};

const handleInput = (gameState, socketId, inputVector) => {
    const tank = gameState.tanks[socketId];
    if (tank && !tank.isBot) {
        tank.inputs = inputVector;
        if (inputVector.x !== 0 || inputVector.y !== 0) {
            const rad = Math.atan2(inputVector.y, inputVector.x);
            tank.angle = rad * (180 / Math.PI);
        }
    }
};

const handleShoot = (gameState, socketId) => {
    const tank = gameState.tanks[socketId];
    if (!tank || tank.cooldown > 0) return;

    const rad = tank.angle * (Math.PI / 180);
    const startX = tank.x + TANK_SIZE/2 + (Math.cos(rad) * (TANK_SIZE/2 + 5));
    const startY = tank.y + TANK_SIZE/2 + (Math.sin(rad) * (TANK_SIZE/2 + 5));

    gameState.bullets.push({
        x: startX,
        y: startY,
        dx: Math.cos(rad) * BULLET_SPEED,
        dy: Math.sin(rad) * BULLET_SPEED,
        owner: socketId
    });

    tank.cooldown = 30; 
};

// --- BOT AI LOGIC ---
const updateBots = (gameState) => {
    const tanks = gameState.tanks;
    const botIds = Object.keys(tanks).filter(id => tanks[id].isBot);
    const humanIds = Object.keys(tanks).filter(id => !tanks[id].isBot);

    botIds.forEach(botId => {
        const bot = tanks[botId];
        if (bot.hp <= 0) return; // Toter Bot tut nichts

        // 1. Ziel finden (nächster Spieler oder anderer Bot)
        let target = null;
        let minDist = Infinity;

        // Suche nach lebenden Feinden (Spieler bevorzugt)
        const potentialTargets = Object.keys(tanks).filter(id => id !== botId && tanks[id].hp > 0);
        
        potentialTargets.forEach(tid => {
            const t = tanks[tid];
            const dx = t.x - bot.x;
            const dy = t.y - bot.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < minDist) {
                minDist = dist;
                target = t;
            }
        });

        // 2. Bewegung
        bot.moveTimer--;
        if (bot.moveTimer <= 0) {
            // Zufällige neue Bewegung alle paar Frames
            if (Math.random() < 0.3 && target) {
                // Versuche zum Gegner zu fahren
                const dx = target.x - bot.x;
                const dy = target.y - bot.y;
                // Normalisieren
                const length = Math.sqrt(dx*dx + dy*dy);
                if (length > 100) { // Nicht zu nah ranfahren
                     bot.inputs = { 
                        x: Math.round(dx / length), 
                        y: Math.round(dy / length) 
                    };
                } else {
                    // Wenn zu nah, fahr weg oder bleib stehen
                    bot.inputs = { x: 0, y: 0 };
                }
            } else {
                // Zufallsbewegung (Patrouille)
                const dirs = [-1, 0, 1];
                bot.inputs = {
                    x: dirs[Math.floor(Math.random() * 3)],
                    y: dirs[Math.floor(Math.random() * 3)]
                };
            }
            bot.moveTimer = 20 + Math.floor(Math.random() * 40);
        }

        // Winkel zum Ziel berechnen
        if (target) {
            const dx = target.x - bot.x;
            const dy = target.y - bot.y;
            const targetRad = Math.atan2(dy, dx);
            const targetDeg = targetRad * (180 / Math.PI);
            bot.angle = targetDeg; // Bot zielt immer perfekt (simple AI)

            // 3. Schießen
            // Wenn Cooldown bereit und einigermaßen ausgerichtet
            if (bot.cooldown <= 0 && Math.random() < 0.05) { // 5% Chance pro Frame zu schießen wenn bereit
                handleShoot(gameState, botId);
            }
        } else if (bot.inputs.x !== 0 || bot.inputs.y !== 0) {
             // Wenn kein Ziel, schau in Fahrtrichtung
             const rad = Math.atan2(bot.inputs.y, bot.inputs.x);
             bot.angle = rad * (180 / Math.PI);
        }
    });
};

const checkCollision = (rect1, rect2) => {
    return (
        rect1.x < rect2.x + rect2.w &&
        rect1.x + rect1.w > rect2.x &&
        rect1.y < rect2.y + rect2.h &&
        rect1.y + rect1.h > rect2.y
    );
};

const updatePhysics = (gameState) => {
    if (gameState.winner) return;

    // AI Update
    updateBots(gameState);

    // 1. Panzer bewegen (Spieler & Bots)
    Object.values(gameState.tanks).forEach(tank => {
        if (tank.hp <= 0) return; // Tote Panzer bewegen sich nicht

        if (tank.cooldown > 0) tank.cooldown--;

        if (tank.inputs.x !== 0 || tank.inputs.y !== 0) {
            let moveSpeed = TANK_SPEED;
            if (tank.inputs.x !== 0 && tank.inputs.y !== 0) {
                moveSpeed = TANK_SPEED / Math.sqrt(2);
            }

            const newX = tank.x + tank.inputs.x * moveSpeed;
            const newY = tank.y + tank.inputs.y * moveSpeed;

            const tankRectX = { x: newX, y: tank.y, w: TANK_SIZE, h: TANK_SIZE };
            const tankRectY = { x: tank.x, y: newY, w: TANK_SIZE, h: TANK_SIZE };
            
            let collisionX = false;
            let collisionY = false;

            gameState.walls.forEach(wall => {
                if (checkCollision(tankRectX, wall)) collisionX = true;
                if (checkCollision(tankRectY, wall)) collisionY = true;
            });

            if (newX < 0 || newX + TANK_SIZE > GAME_WIDTH) collisionX = true;
            if (newY < 0 || newY + TANK_SIZE > GAME_HEIGHT) collisionY = true;

            if (!collisionX) tank.x = newX;
            if (!collisionY) tank.y = newY;
            
            // Bei Bots: Wenn Kollision, ändere Richtung beim nächsten Frame
            if ((collisionX || collisionY) && tank.isBot) {
                tank.moveTimer = 0; // Trigger new move decision
            }
        }
    });

    // 2. Kugeln bewegen
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const b = gameState.bullets[i];
        b.x += b.dx;
        b.y += b.dy;

        let destroyed = false;

        // Wand
        if (b.x < 0 || b.x > GAME_WIDTH || b.y < 0 || b.y > GAME_HEIGHT) {
            destroyed = true;
        } else {
            gameState.walls.forEach(wall => {
                if (checkCollision({ x: b.x, y: b.y, w: BULLET_SIZE, h: BULLET_SIZE }, wall)) {
                    destroyed = true;
                }
            });
        }

        // Treffer
        if (!destroyed) {
            Object.keys(gameState.tanks).forEach(socketId => {
                // Panzer muss leben um getroffen zu werden
                const tank = gameState.tanks[socketId];
                if (socketId !== b.owner && tank.hp > 0) { 
                    if (checkCollision({ x: b.x, y: b.y, w: BULLET_SIZE, h: BULLET_SIZE }, { x: tank.x, y: tank.y, w: TANK_SIZE, h: TANK_SIZE })) {
                        destroyed = true;
                        tank.hp--;
                        // Win Condition: Last Man Standing (oder erster Kill in diesem einfachen Modus)
                        // Um das Spiel spannend zu machen, lassen wir es laufen bis einer stirbt, 
                        // oder wenn es ein Bot ist, einfach weiterlaufen bis ein Spieler gewinnt?
                        // Simple Logik: Wenn ein MENSCH stirbt, verliert er. Wenn ein Bot stirbt, ist er weg.
                        
                        if (tank.hp <= 0) {
                            // Wenn ein Spieler stirbt, hat der Schütze gewonnen (vereinfacht)
                            // Oder: Game Over wenn nur noch 1 Team übrig ist.
                            // Wir behalten die alte "First Blood wins" Logik für schnelle Runden,
                            // aber ignorieren Bot-Tode für das Spielende, außer es war der letzte Gegner.
                            
                            if (!tank.isBot) {
                                // Ein Spieler ist gestorben -> Der Killer gewinnt
                                gameState.winner = b.owner; 
                            } else {
                                // Ein Bot ist gestorben. Prüfen ob noch Bots da sind?
                                // Für jetzt: Spiel geht weiter, Bot ist weg.
                                // Optional: Wenn der Spieler alle Bots besiegt, gewinnt er.
                            }
                        }
                    }
                }
            });
        }

        if (destroyed) {
            gameState.bullets.splice(i, 1);
        }
    }
};

module.exports = { createGameState, handleInput, handleShoot, updatePhysics };