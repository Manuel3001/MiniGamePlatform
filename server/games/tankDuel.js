// server/games/tankDuel.js

const GAME_WIDTH = 1000; // Größer
const GAME_HEIGHT = 700; // Größer
const TANK_SIZE = 40;
const BULLET_SIZE = 8;
const TANK_SPEED = 4.5; // Etwas schneller für die große Map
const BULLET_SPEED = 9;
const MAX_HP = 3;

// --- MAP GENERATOR ---
// Wir erstellen Maps mit Themes
const MAPS = [
    {
        name: "Dusty Desert",
        theme: "desert",
        walls: [
            // Außenbegrenzung (optional, da wir Bounds checken, aber gut für Optik)
            { x: 200, y: 150, w: 50, h: 400 },
            { x: 750, y: 150, w: 50, h: 400 },
            { x: 400, y: 300, w: 200, h: 100 }, // Dicker Block Mitte
            { x: 100, y: 100, w: 80, h: 80 },
            { x: 820, y: 100, w: 80, h: 80 },
            { x: 100, y: 520, w: 80, h: 80 },
            { x: 820, y: 520, w: 80, h: 80 },
            // Kleine Streuung
            { x: 300, y: 100, w: 40, h: 40 },
            { x: 660, y: 560, w: 40, h: 40 },
            { x: 300, y: 560, w: 40, h: 40 },
            { x: 660, y: 100, w: 40, h: 40 }
        ],
        spawns: [
            { x: 50, y: 350, angle: 0 },
            { x: 900, y: 350, angle: 180 },
            { x: 500, y: 50, angle: 90 },
            { x: 500, y: 600, angle: 270 }
        ]
    },
    {
        name: "Deep Forest",
        theme: "forest",
        walls: [
            // Ein Labyrinth aus vielen kleinen Blöcken ("Bäume")
            { x: 150, y: 100, w: 40, h: 500 }, // Lange Reihe links
            { x: 810, y: 100, w: 40, h: 500 }, // Lange Reihe rechts
            
            { x: 300, y: 100, w: 400, h: 40 }, // Oben quer
            { x: 300, y: 560, w: 400, h: 40 }, // Unten quer
            
            { x: 350, y: 250, w: 60, h: 200 }, // Mitte Links
            { x: 590, y: 250, w: 60, h: 200 }, // Mitte Rechts
            
            // Ecken
            { x: 50, y: 50, w: 60, h: 60 },
            { x: 890, y: 50, w: 60, h: 60 },
            { x: 50, y: 590, w: 60, h: 60 },
            { x: 890, y: 590, w: 60, h: 60 }
        ],
        spawns: [
            { x: 50, y: 350, angle: 0 },
            { x: 900, y: 350, angle: 180 },
            { x: 250, y: 200, angle: 90 },
            { x: 750, y: 500, angle: 270 }
        ]
    },
    {
        name: "Neon Cyber",
        theme: "cyber",
        walls: [
            // Symmetrische Arena
            { x: 250, y: 200, w: 500, h: 20 }, // Strich
            { x: 250, y: 480, w: 500, h: 20 }, // Strich
            
            { x: 490, y: 100, w: 20, h: 150 }, // Vertikal Mitte Oben
            { x: 490, y: 450, w: 20, h: 150 }, // Vertikal Mitte Unten
            
            { x: 150, y: 300, w: 50, h: 100 },
            { x: 800, y: 300, w: 50, h: 100 },
            
            // Viele kleine Hindernisse
            { x: 350, y: 330, w: 40, h: 40 },
            { x: 610, y: 330, w: 40, h: 40 }
        ],
        spawns: [
            { x: 50, y: 50, angle: 45 },
            { x: 900, y: 600, angle: 225 },
            { x: 900, y: 50, angle: 135 },
            { x: 50, y: 600, angle: 315 }
        ]
    }
];

const createGameState = (users) => {
    // 1. Map wählen
    const mapIndex = Math.floor(Math.random() * MAPS.length);
    const selectedMap = MAPS[mapIndex];

    const tanks = {};
    
    // 2. Spieler spawnen
    users.forEach((u, i) => {
        if (i < 2) { 
            const spawn = selectedMap.spawns[i] || { x: 50, y: 50, angle: 0 };
            tanks[u.socketId] = {
                x: spawn.x, y: spawn.y, angle: spawn.angle,
                hp: MAX_HP,
                color: i === 0 ? '#4dfff3' : '#ff2e63', // Neon Blau & Neon Rot
                variant: Math.floor(Math.random() * 3), // 0, 1 oder 2 (Verschiedene Designs)
                cooldown: 0,
                inputs: { x: 0, y: 0 },
                isBot: false,
                id: u.socketId
            };
        }
    });

    // 3. Bots spawnen (immer 2 Stück)
    for (let i = 1; i <= 2; i++) {
        const botId = `bot_${i}`;
        const spawnIdx = 1 + i;
        const spawn = selectedMap.spawns[spawnIdx] || { x: 500, y: 350, angle: 0 };

        tanks[botId] = {
            x: spawn.x, y: spawn.y, angle: spawn.angle,
            hp: MAX_HP,
            color: '#00e676', // Bot Grün
            variant: Math.floor(Math.random() * 3),
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
        mapTheme: selectedMap.theme, // WICHTIG für CSS
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
    // Kugel startet am Ende des Rohrs
    const startX = tank.x + TANK_SIZE/2 + (Math.cos(rad) * (TANK_SIZE/2 + 8));
    const startY = tank.y + TANK_SIZE/2 + (Math.sin(rad) * (TANK_SIZE/2 + 8));

    gameState.bullets.push({
        x: startX,
        y: startY,
        dx: Math.cos(rad) * BULLET_SPEED,
        dy: Math.sin(rad) * BULLET_SPEED,
        owner: socketId
    });

    tank.cooldown = 25; // Etwas schneller schießen
};

// --- SIMPLER BOT AI ---
const updateBots = (gameState) => {
    const tanks = gameState.tanks;
    const botIds = Object.keys(tanks).filter(id => tanks[id].isBot);

    botIds.forEach(botId => {
        const bot = tanks[botId];
        if (bot.hp <= 0) return;

        // Ziel suchen
        let target = null;
        let minDist = Infinity;
        
        Object.keys(tanks).forEach(otherId => {
            if (otherId !== botId && tanks[otherId].hp > 0) {
                const t = tanks[otherId];
                const dist = Math.sqrt(Math.pow(t.x - bot.x, 2) + Math.pow(t.y - bot.y, 2));
                if (dist < minDist) {
                    minDist = dist;
                    target = t;
                }
            }
        });

        bot.moveTimer--;
        if (bot.moveTimer <= 0) {
            // Neue Bewegung
            if (target && Math.random() < 0.65) { // 65% Verfolgen
                const dx = target.x - bot.x;
                const dy = target.y - bot.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist > 150) {
                    bot.inputs = { x: Math.round(dx/dist), y: Math.round(dy/dist) };
                } else {
                    bot.inputs = { x: 0, y: 0 }; // Stehenbleiben und schießen
                }
            } else {
                // Random
                const dirs = [-1, 0, 1];
                bot.inputs = { x: dirs[Math.floor(Math.random()*3)], y: dirs[Math.floor(Math.random()*3)] };
            }
            bot.moveTimer = 20 + Math.random() * 40;
        }

        // Zielen & Schießen
        if (target) {
            const dx = target.x - bot.x;
            const dy = target.y - bot.y;
            bot.angle = Math.atan2(dy, dx) * (180 / Math.PI);
            
            if (bot.cooldown <= 0 && Math.random() < 0.08) {
                handleShoot(gameState, botId);
            }
        } else if (bot.inputs.x !== 0 || bot.inputs.y !== 0) {
            bot.angle = Math.atan2(bot.inputs.y, bot.inputs.x) * (180 / Math.PI);
        }
    });
};

const checkCollision = (r1, r2) => {
    return (r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y);
};

const updatePhysics = (gameState) => {
    if (gameState.winner) return;

    updateBots(gameState);

    // Panzer
    Object.values(gameState.tanks).forEach(tank => {
        if (tank.hp <= 0) return;
        if (tank.cooldown > 0) tank.cooldown--;

        if (tank.inputs.x !== 0 || tank.inputs.y !== 0) {
            let speed = TANK_SPEED;
            if (tank.inputs.x !== 0 && tank.inputs.y !== 0) speed /= Math.sqrt(2);

            const nx = tank.x + tank.inputs.x * speed;
            const ny = tank.y + tank.inputs.y * speed;

            const rX = { x: nx, y: tank.y, w: TANK_SIZE, h: TANK_SIZE };
            const rY = { x: tank.x, y: ny, w: TANK_SIZE, h: TANK_SIZE };
            
            let cX = false, cY = false;

            // Wände
            gameState.walls.forEach(w => {
                if (checkCollision(rX, w)) cX = true;
                if (checkCollision(rY, w)) cY = true;
            });
            // Rand
            if (nx < 0 || nx + TANK_SIZE > GAME_WIDTH) cX = true;
            if (ny < 0 || ny + TANK_SIZE > GAME_HEIGHT) cY = true;

            if (!cX) tank.x = nx;
            if (!cY) tank.y = ny;
            
            if (tank.isBot && (cX || cY)) tank.moveTimer = 0; // Bot steckt fest -> neu entscheiden
        }
    });

    // Kugeln
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const b = gameState.bullets[i];
        b.x += b.dx;
        b.y += b.dy;
        let dead = false;

        if (b.x < 0 || b.x > GAME_WIDTH || b.y < 0 || b.y > GAME_HEIGHT) dead = true;
        if (!dead) {
            gameState.walls.forEach(w => {
                if (checkCollision({x:b.x, y:b.y, w:BULLET_SIZE, h:BULLET_SIZE}, w)) dead = true;
            });
        }

        if (!dead) {
            Object.keys(gameState.tanks).forEach(id => {
                const t = gameState.tanks[id];
                if (id !== b.owner && t.hp > 0) {
                    if (checkCollision({x:b.x, y:b.y, w:BULLET_SIZE, h:BULLET_SIZE}, {x:t.x, y:t.y, w:TANK_SIZE, h:TANK_SIZE})) {
                        dead = true;
                        t.hp--;
                        // Game Over Logik
                        if (t.hp <= 0 && !t.isBot) {
                            // Spieler tot -> Killer gewinnt
                            gameState.winner = b.owner.startsWith('bot') ? 'BOTS' : b.owner;
                        }
                        // Wenn alle Gegner (Bots und Spieler) tot sind
                        const aliveEnemies = Object.values(gameState.tanks).filter(e => e.id !== b.owner && e.hp > 0).length;
                        if (aliveEnemies === 0 && !gameState.tanks[b.owner].isBot) {
                            gameState.winner = b.owner;
                        }
                    }
                }
            });
        }
        if (dead) gameState.bullets.splice(i, 1);
    }
};

module.exports = { createGameState, handleInput, handleShoot, updatePhysics };