// server/games/tankDuel.js

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const TANK_SIZE = 40;
const BULLET_SIZE = 8;
const TANK_SPEED = 4;
const BULLET_SPEED = 8;
const MAX_HP = 3; // 3 Treffer zum Sieg

// Einfaches Level-Layout (1 = Mauer, 0 = Boden)
// Wir machen ein paar Hindernisse in die Mitte
const WALLS = [
    { x: 100, y: 100, w: 50, h: 200 },
    { x: 650, y: 300, w: 50, h: 200 },
    { x: 300, y: 200, w: 200, h: 50 },
    { x: 300, y: 350, w: 200, h: 50 },
    { x: 375, y: 100, w: 50, h: 50 }, // Mitte oben
    { x: 375, y: 450, w: 50, h: 50 }  // Mitte unten
];

const createGameState = (users) => {
    return {
        players: users.map(u => u.socketId),
        tanks: {
            [users[0].socketId]: { 
                x: 50, y: 50, 
                angle: 0, // 0 = Rechts, 90 = Unten, etc.
                hp: MAX_HP, 
                color: '#4dfff3',
                cooldown: 0,
                inputs: { x: 0, y: 0 } // Aktuelle Eingabe (-1, 0, 1)
            },
            [users[1].socketId]: { 
                x: GAME_WIDTH - 90, y: GAME_HEIGHT - 90, 
                angle: 180, 
                hp: MAX_HP, 
                color: '#e94560',
                cooldown: 0,
                inputs: { x: 0, y: 0 }
            }
        },
        bullets: [], // { x, y, dx, dy, owner }
        walls: WALLS,
        winner: null,
        dimensions: { width: GAME_WIDTH, height: GAME_HEIGHT }
    };
};

const handleInput = (gameState, socketId, inputVector) => {
    const tank = gameState.tanks[socketId];
    if (tank) {
        tank.inputs = inputVector; // { x: -1/0/1, y: -1/0/1 }
        
        // Winkel berechnen, wenn Bewegung stattfindet
        if (inputVector.x !== 0 || inputVector.y !== 0) {
            // Math.atan2 gibt Bogenmaß zurück -> in Grad umwandeln
            const rad = Math.atan2(inputVector.y, inputVector.x);
            tank.angle = rad * (180 / Math.PI);
        }
    }
};

const handleShoot = (gameState, socketId) => {
    const tank = gameState.tanks[socketId];
    if (!tank || tank.cooldown > 0) return;

    // Kugel spawnen in Blickrichtung
    const rad = tank.angle * (Math.PI / 180);
    // Startposition: Mitte des Panzers + etwas Abstand in Blickrichtung
    const startX = tank.x + TANK_SIZE/2 + (Math.cos(rad) * (TANK_SIZE/2 + 5));
    const startY = tank.y + TANK_SIZE/2 + (Math.sin(rad) * (TANK_SIZE/2 + 5));

    gameState.bullets.push({
        x: startX,
        y: startY,
        dx: Math.cos(rad) * BULLET_SPEED,
        dy: Math.sin(rad) * BULLET_SPEED,
        owner: socketId
    });

    tank.cooldown = 30; // ca. 1 Sekunde Cooldown bei 30 FPS
};

// Kollisionserkennung Rechteck vs Rechteck
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

    // 1. Panzer bewegen
    Object.values(gameState.tanks).forEach(tank => {
        // Cooldown verringern
        if (tank.cooldown > 0) tank.cooldown--;

        // Bewegung anwenden
        if (tank.inputs.x !== 0 || tank.inputs.y !== 0) {
            // Normalisierung für diagonale Bewegung (damit man nicht schneller ist)
            let moveSpeed = TANK_SPEED;
            if (tank.inputs.x !== 0 && tank.inputs.y !== 0) {
                moveSpeed = TANK_SPEED / Math.sqrt(2);
            }

            const newX = tank.x + tank.inputs.x * moveSpeed;
            const newY = tank.y + tank.inputs.y * moveSpeed;

            // Kollisionscheck: Neue Position validieren
            const tankRectX = { x: newX, y: tank.y, w: TANK_SIZE, h: TANK_SIZE };
            const tankRectY = { x: tank.x, y: newY, w: TANK_SIZE, h: TANK_SIZE };
            
            let collisionX = false;
            let collisionY = false;

            // Wände prüfen
            gameState.walls.forEach(wall => {
                if (checkCollision(tankRectX, wall)) collisionX = true;
                if (checkCollision(tankRectY, wall)) collisionY = true;
            });

            // Rand prüfen
            if (newX < 0 || newX + TANK_SIZE > GAME_WIDTH) collisionX = true;
            if (newY < 0 || newY + TANK_SIZE > GAME_HEIGHT) collisionY = true;

            if (!collisionX) tank.x = newX;
            if (!collisionY) tank.y = newY;
        }
    });

    // 2. Kugeln bewegen
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const b = gameState.bullets[i];
        b.x += b.dx;
        b.y += b.dy;

        let destroyed = false;

        // Wandkollision
        if (b.x < 0 || b.x > GAME_WIDTH || b.y < 0 || b.y > GAME_HEIGHT) {
            destroyed = true;
        } else {
            // Hindernisse
            gameState.walls.forEach(wall => {
                if (checkCollision({ x: b.x, y: b.y, w: BULLET_SIZE, h: BULLET_SIZE }, wall)) {
                    destroyed = true;
                }
            });
        }

        // Spieler Treffer
        if (!destroyed) {
            Object.keys(gameState.tanks).forEach(socketId => {
                if (socketId !== b.owner) { // Nicht sich selbst treffen
                    const tank = gameState.tanks[socketId];
                    if (checkCollision({ x: b.x, y: b.y, w: BULLET_SIZE, h: BULLET_SIZE }, { x: tank.x, y: tank.y, w: TANK_SIZE, h: TANK_SIZE })) {
                        destroyed = true;
                        tank.hp--;
                        if (tank.hp <= 0) {
                            gameState.winner = b.owner; // Der Schütze gewinnt
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