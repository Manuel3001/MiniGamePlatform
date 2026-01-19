// server/games/tankDuel.js

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const TANK_SIZE = 40;
const BULLET_SIZE = 8;
const TANK_SPEED = 4;
const BULLET_SPEED = 8;
const MAX_HP = 3;

// --- MAP DEFINITIONEN ---
// Jede Map braucht zwingend 4 Spawns (0+1 für Spieler, 2+3 für Bots)
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
            { x: 50, y: 50, angle: 0 },    // P1
            { x: 700, y: 500, angle: 180 }, // P2
            { x: 700, y: 50, angle: 90 },   // Bot 1
            { x: 50, y: 500, angle: 270 }   // Bot 2
        ]
    },
    {
        name: "The Cross",
        walls: [
            { x: 350, y: 100, w: 100, h: 400 }, // Dicker Balken Vertikal
            { x: 100, y: 250, w: 600, h: 100 }, // Dicker Balken Horizontal
            { x: 150, y: 150, w: 50, h: 50 },   // Deckung LO
            { x: 600, y: 150, w: 50, h: 50 },   // Deckung RO
            { x: 150, y: 400, w: 50, h: 50 },   // Deckung LU
            { x: 600, y: 400, w: 50, h: 50 }    // Deckung RU
        ],
        spawns: [
            { x: 50, y: 50, angle: 45 },
            { x: 700, y: 500, angle: 225 },
            { x: 700, y: 50, angle: 135 },
            { x: 50, y: 500, angle: 315 }
        ]
    },
    {
        name: "The Maze",
        walls: [
            // Außenwände (Lückenhaft)
            { x: 100, y: 0, w: 20, h: 200 },
            { x: 680, y: 400, w: 20, h: 200 },
            // Innen-Labyrinth
            { x: 200, y: 100, w: 400, h: 20 },
            { x: 200, y: 480, w: 400, h: 20 },
            { x: 200, y: 100, w: 20, h: 200 },
            { x: 580, y: 300, w: 20, h: 200 },
            { x: 380, y: 250, w: 40, h: 100 }  // Mitte
        ],
        spawns: [
            { x: 50, y: 280, angle: 0 },
            { x: 700, y: 280, angle: 180 },
            { x: 390, y: 50, angle: 90 },
            { x: 390, y: 520, angle: 270 }
        ]
    },
    {
        name: "Urban Chaos", // Viele kleine Blöcke ("Häuser")
        walls: [
            { x: 100, y: 100, w: 60, h: 60 },
            { x: 250, y: 100, w: 60, h: 60 },
            { x: 400, y: 100, w: 60, h: 60 },
            { x: 550, y: 100, w: 60, h: 60 },
            
            { x: 100, y: 440, w: 60, h: 60 },
            { x: 250, y: 440, w: 60, h: 60 },
            { x: 400, y: 440, w: 60, h: 60 },
            { x: 550, y: 440, w: 60, h: 60 },

            { x: 300, y: 250, w: 200, h: 100 } // Zentrum
        ],
        spawns: [
            { x: 50, y: 280, angle: 0 },
            { x: 700, y: 280, angle: 180 },
            { x: 380, y: 30, angle: 90 },
            { x: 380, y: 550, angle: 270 }
        ]
    }
];

const createGameState = (users) => {
    // 1. Zufällige Map wählen
    const mapIndex = Math.floor(Math.random() * MAPS.length);
    const selectedMap = MAPS[mapIndex];

    const tanks = {};
    
    // 2. Spieler platzieren (P1 auf Spawn 0, P2 auf Spawn 1)
    users.forEach((u, i) => {
        if (i < 2) { 
            const spawn = selectedMap.spawns[i] || { x: 50, y: 50, angle: 0 };
            tanks[u.socketId] = {
                x: spawn.x,
                y: spawn.y,
                angle: spawn.angle,
                hp: MAX_HP,
                color: i === 0 ? '#4dfff3' : '#e94560', // Cyan & Rot
                cooldown: 0,
                inputs: { x: 0, y: 0 },
                isBot: false,
                id: u.socketId // ID speichern für einfachere Logik
            };
        }
    });

    // 3. Bots platzieren (Bot 1 auf Spawn 2, Bot 2 auf Spawn 3)
    for (let i = 1; i <= 2; i++) {
        const botId = `bot_${i}`;
        const spawnIdx = 1 + i; // Index 2 und 3
        const spawn = selectedMap.spawns[spawnIdx] || { x: 400, y: 300, angle: 0 }; // Fallback Mitte

        tanks[botId] = {
            x: spawn.x,
            y: spawn.y,
            angle: spawn.angle,
            hp: MAX_HP,
            color: '#76ff03', // Hellgrün für Bots
            cooldown: 0,
            inputs: { x: 0, y: 0 },
            isBot: true,
            id: botId,
            moveTimer: 0
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
    if (!tank || tank.hp <= 0 || tank.cooldown > 0) return;

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

// --- BOT AI ---
const updateBots = (gameState) => {
    const tanks = gameState.tanks;
    const botIds = Object.keys(tanks).filter(id => tanks[id].isBot);

    botIds.forEach(botId => {
        const bot = tanks[botId];
        if (bot.hp <= 0) return; 

        // Ziel finden (Nächster lebender Panzer, egal ob Spieler oder Bot)
        let target = null;
        let minDist = Infinity;
        
        Object.keys(tanks).forEach(otherId => {
            if (otherId !== botId && tanks[otherId].hp > 0) {
                const t = tanks[otherId];
                const dx = t.x - bot.x;
                const dy = t.y - bot.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < minDist) {
                    minDist = dist;
                    target = t;
                }
            }
        });

        bot.moveTimer--;
        if (bot.moveTimer <= 0) {
            // Neue Entscheidung treffen
            if (target && Math.random() < 0.7) { // 70% Chance zum Ziel zu fahren
                const dx = target.x - bot.x;
                const dy = target.y - bot.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist > 150) { // Fahr ran
                    bot.inputs = { 
                        x: Math.round(dx/dist), 
                        y: Math.round(dy/dist) 
                    };
                } else { // Bleib stehen / weich aus
                    bot.inputs = { x: 0, y: 0 };
                }
            } else {
                // Random Patrol
                const dirs = [-1, 0, 1];
                bot.inputs = {
                    x: dirs[Math.floor(Math.random() * 3)],
                    y: dirs[Math.floor(Math.random() * 3)]
                };
            }
            bot.moveTimer = 30 + Math.random() * 30;
        }

        // Zielen
        if (target) {
            const dx = target.x - bot.x;
            const dy = target.y - bot.y;
            bot.angle = Math.atan2(dy, dx) * (180 / Math.PI);

            // Schießen wenn ausgerichtet und Cooldown fertig
            if (bot.cooldown <= 0 && Math.random() < 0.05) {
                handleShoot(gameState, botId);
            }
        } else if (bot.inputs.x !== 0 || bot.inputs.y !== 0) {
            // In Fahrtrichtung schauen wenn kein Ziel
            bot.angle = Math.atan2(bot.inputs.y, bot.inputs.x) * (180 / Math.PI);
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

    updateBots(gameState);

    // Panzer bewegen
    Object.values(gameState.tanks).forEach(tank => {
        if (tank.hp <= 0) return;

        if (tank.cooldown > 0) tank.cooldown--;

        if (tank.inputs.x !== 0 || tank.inputs.y !== 0) {
            let moveSpeed = TANK_SPEED;
            if (tank.inputs.x !== 0 && tank.inputs.y !== 0) {
                moveSpeed = TANK_SPEED / Math.sqrt(2);
            }

            const newX = tank.x + tank.inputs.x * moveSpeed;
            const newY = tank.y + tank.inputs.y * moveSpeed;

            const rectX = { x: newX, y: tank.y, w: TANK_SIZE, h: TANK_SIZE };
            const rectY = { x: tank.x, y: newY, w: TANK_SIZE, h: TANK_SIZE };
            
            let colX = false;
            let colY = false;

            // Wand Kollision
            gameState.walls.forEach(wall => {
                if (checkCollision(rectX, wall)) colX = true;
                if (checkCollision(rectY, wall)) colY = true;
            });

            // Map Grenzen
            if (newX < 0 || newX + TANK_SIZE > GAME_WIDTH) colX = true;
            if (newY < 0 || newY + TANK_SIZE > GAME_HEIGHT) colY = true;

            if (!colX) tank.x = newX;
            if (!colY) tank.y = newY;
            
            // Bot bleibt stecken? Neue Richtung suchen
            if (tank.isBot && (colX || colY)) tank.moveTimer = 0;
        }
    });

    // Kugeln bewegen
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const b = gameState.bullets[i];
        b.x += b.dx;
        b.y += b.dy;

        let destroyed = false;

        // Grenzen
        if (b.x < 0 || b.x > GAME_WIDTH || b.y < 0 || b.y > GAME_HEIGHT) destroyed = true;
        
        // Wände
        if (!destroyed) {
            gameState.walls.forEach(wall => {
                if (checkCollision({ x: b.x, y: b.y, w: BULLET_SIZE, h: BULLET_SIZE }, wall)) destroyed = true;
            });
        }

        // Treffer
        if (!destroyed) {
            Object.keys(gameState.tanks).forEach(id => {
                const tank = gameState.tanks[id];
                if (id !== b.owner && tank.hp > 0) {
                    if (checkCollision({ x: b.x, y: b.y, w: BULLET_SIZE, h: BULLET_SIZE }, { x: tank.x, y: tank.y, w: TANK_SIZE, h: TANK_SIZE })) {
                        destroyed = true;
                        tank.hp--;
                        
                        // Sieg-Bedingung: Nur noch 1 Team/Spieler übrig?
                        // Einfachheitshalber: Wer einen killt, bekommt Punkte? 
                        // Hier: Wenn ein SPIELER stirbt, ist Game Over.
                        if (tank.hp <= 0 && !tank.isBot) {
                            // Wenn P1 stirbt, gewinnt der Schütze (auch wenns ein Bot war)
                            gameState.winner = b.owner.startsWith('bot') ? "BOTS" : b.owner;
                        }
                        // Wenn Bot stirbt, einfach weiter spielen (er ist dann inaktiv)
                        
                        // Check ob alle Gegner tot sind (für den Spieler)
                        const aliveEnemies = Object.values(gameState.tanks).filter(t => t.id !== b.owner && t.hp > 0).length;
                        if (aliveEnemies === 0 && !gameState.tanks[b.owner].isBot) {
                            gameState.winner = b.owner;
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