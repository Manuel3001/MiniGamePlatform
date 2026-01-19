// server/games/tankDuel.js

const GAME_WIDTH = 2000; // RIESIGE MAP
const GAME_HEIGHT = 2000;
const TANK_SIZE = 40;
const BULLET_SIZE = 8;
const TANK_SPEED = 5; // Etwas schneller
const BULLET_SPEED = 10;
const MAX_HP = 3;

// --- MAP GENERATOR ---
const MAPS = [
    {
        name: "Endless Desert",
        theme: "desert",
        // Wir generieren jetzt programmatisch mehr Wände für die große Map
        walls: generateWalls("desert"),
        spawns: [
            { x: 100, y: 100, angle: 45 },
            { x: 1900, y: 1900, angle: 225 },
            { x: 1900, y: 100, angle: 135 },
            { x: 100, y: 1900, angle: 315 }
        ]
    },
    {
        name: "Giant Forest",
        theme: "forest",
        walls: generateWalls("forest"),
        spawns: [
            { x: 100, y: 1000, angle: 0 },
            { x: 1900, y: 1000, angle: 180 },
            { x: 1000, y: 100, angle: 90 },
            { x: 1000, y: 1900, angle: 270 }
        ]
    },
    {
        name: "Cyber City",
        theme: "cyber",
        walls: generateWalls("cyber"),
        spawns: [
            { x: 200, y: 200, angle: 45 },
            { x: 1800, y: 1800, angle: 225 },
            { x: 1800, y: 200, angle: 135 },
            { x: 200, y: 1800, angle: 315 }
        ]
    }
];

// Hilfsfunktion um die große Map zu füllen
function generateWalls(theme) {
    const walls = [];
    // Außenmauern
    walls.push({ x: 0, y: 0, w: GAME_WIDTH, h: 20 }); // Oben
    walls.push({ x: 0, y: GAME_HEIGHT-20, w: GAME_WIDTH, h: 20 }); // Unten
    walls.push({ x: 0, y: 0, w: 20, h: GAME_HEIGHT }); // Links
    walls.push({ x: GAME_WIDTH-20, y: 0, w: 20, h: GAME_HEIGHT }); // Rechts

    // Zufällige Hindernisse (ca. 40 Stück)
    for(let i=0; i<40; i++) {
        const w = 60 + Math.random() * 100;
        const h = 60 + Math.random() * 100;
        const x = 100 + Math.random() * (GAME_WIDTH - 300);
        const y = 100 + Math.random() * (GAME_HEIGHT - 300);
        
        // Mitte etwas freier lassen für Action
        if (Math.abs(x - GAME_WIDTH/2) < 200 && Math.abs(y - GAME_HEIGHT/2) < 200) continue;

        walls.push({ x, y, w, h });
    }
    
    // Ein dickes Zentrum
    walls.push({ x: GAME_WIDTH/2 - 100, y: GAME_HEIGHT/2 - 100, w: 200, h: 200 });

    return walls;
}

const createGameState = (users) => {
    const mapIndex = Math.floor(Math.random() * MAPS.length);
    const selectedMap = MAPS[mapIndex];

    const tanks = {};
    
    // Spieler
    users.forEach((u, i) => {
        if (i < 2) { 
            const spawn = selectedMap.spawns[i];
            tanks[u.socketId] = {
                x: spawn.x, y: spawn.y, angle: spawn.angle,
                hp: MAX_HP,
                color: i === 0 ? '#4dfff3' : '#ff2e63',
                variant: Math.floor(Math.random() * 3),
                cooldown: 0,
                inputs: { x: 0, y: 0 },
                isBot: false,
                id: u.socketId
            };
        }
    });

    // Bots (2 Stück)
    for (let i = 1; i <= 2; i++) {
        const botId = `bot_${i}`;
        const spawnIdx = 1 + i;
        const spawn = selectedMap.spawns[spawnIdx] || { x: 1000, y: 1000, angle: 0 };

        tanks[botId] = {
            x: spawn.x, y: spawn.y, angle: spawn.angle,
            hp: MAX_HP,
            color: '#00e676',
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
        mapTheme: selectedMap.theme,
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
    const startX = tank.x + TANK_SIZE/2 + (Math.cos(rad) * (TANK_SIZE/2 + 8));
    const startY = tank.y + TANK_SIZE/2 + (Math.sin(rad) * (TANK_SIZE/2 + 8));

    gameState.bullets.push({
        x: startX,
        y: startY,
        dx: Math.cos(rad) * BULLET_SPEED,
        dy: Math.sin(rad) * BULLET_SPEED,
        owner: socketId
    });

    tank.cooldown = 25;
};

// --- BOT AI ---
const updateBots = (gameState) => {
    const tanks = gameState.tanks;
    const botIds = Object.keys(tanks).filter(id => tanks[id].isBot);

    botIds.forEach(botId => {
        const bot = tanks[botId];
        if (bot.hp <= 0) return;

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
            if (target && Math.random() < 0.7) { 
                const dx = target.x - bot.x;
                const dy = target.y - bot.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist > 300) { // Mehr Abstand auf großer Map
                    bot.inputs = { x: Math.round(dx/dist), y: Math.round(dy/dist) };
                } else {
                    bot.inputs = { x: 0, y: 0 };
                }
            } else {
                const dirs = [-1, 0, 1];
                bot.inputs = { x: dirs[Math.floor(Math.random()*3)], y: dirs[Math.floor(Math.random()*3)] };
            }
            bot.moveTimer = 40 + Math.random() * 40;
        }

        if (target) {
            const dx = target.x - bot.x;
            const dy = target.y - bot.y;
            bot.angle = Math.atan2(dy, dx) * (180 / Math.PI);
            if (bot.cooldown <= 0 && Math.random() < 0.05) handleShoot(gameState, botId);
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
            gameState.walls.forEach(w => {
                if (checkCollision(rX, w)) cX = true;
                if (checkCollision(rY, w)) cY = true;
            });
            if (nx < 0 || nx + TANK_SIZE > GAME_WIDTH) cX = true;
            if (ny < 0 || ny + TANK_SIZE > GAME_HEIGHT) cY = true;

            if (!cX) tank.x = nx;
            if (!cY) tank.y = ny;
            if (tank.isBot && (cX || cY)) tank.moveTimer = 0;
        }
    });

    // Kugeln
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const b = gameState.bullets[i];
        b.x += b.dx;
        b.y += b.dy;
        let dead = false;
        if (b.x < 0 || b.x > GAME_WIDTH || b.y < 0 || b.y > GAME_HEIGHT) dead = true;
        if (!dead) gameState.walls.forEach(w => {
            if (checkCollision({x:b.x, y:b.y, w:BULLET_SIZE, h:BULLET_SIZE}, w)) dead = true;
        });

        if (!dead) {
            Object.keys(gameState.tanks).forEach(id => {
                const t = gameState.tanks[id];
                if (id !== b.owner && t.hp > 0) {
                    if (checkCollision({x:b.x, y:b.y, w:BULLET_SIZE, h:BULLET_SIZE}, {x:t.x, y:t.y, w:TANK_SIZE, h:TANK_SIZE})) {
                        dead = true;
                        t.hp--;
                        if (t.hp <= 0 && !t.isBot) gameState.winner = b.owner.startsWith('bot') ? 'BOTS' : b.owner;
                        const aliveEnemies = Object.values(gameState.tanks).filter(e => e.id !== b.owner && e.hp > 0).length;
                        if (aliveEnemies === 0 && !gameState.tanks[b.owner].isBot) gameState.winner = b.owner;
                    }
                }
            });
        }
        if (dead) gameState.bullets.splice(i, 1);
    }
};

module.exports = { createGameState, handleInput, handleShoot, updatePhysics };