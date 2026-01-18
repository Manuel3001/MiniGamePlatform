// server/games/sumo.js

const ARENA_RADIUS = 300; // Radius des Rings
const PLAYER_RADIUS = 30;
const MAX_ENERGY = 100;
const FRICTION = 0.9;
const MOVE_ACCEL = 0.8;

const createGameState = (users) => {
    return {
        players: users.map(u => u.socketId),
        // Startpositionen: Links und Rechts vom Zentrum
        entities: {
            [users[0].socketId]: { 
                x: -100, y: 0, 
                vx: 0, vy: 0, 
                energy: 0, // Durch Button-Mashing aufgebaut
                color: '#4dfff3',
                inputs: { x: 0, y: 0 }
            },
            [users[1].socketId]: { 
                x: 100, y: 0, 
                vx: 0, vy: 0, 
                energy: 0, 
                color: '#e94560',
                inputs: { x: 0, y: 0 }
            }
        },
        winner: null,
        arenaRadius: ARENA_RADIUS
    };
};

const handleInput = (gameState, socketId, vector) => {
    const entity = gameState.entities[socketId];
    if (entity) {
        entity.inputs = vector;
    }
};

const handleMash = (gameState, socketId) => {
    const entity = gameState.entities[socketId];
    if (entity) {
        // Energie erhöhen (Max 100)
        entity.energy = Math.min(MAX_ENERGY, entity.energy + 15);
    }
};

const updatePhysics = (gameState) => {
    if (gameState.winner) return;

    const ids = Object.keys(gameState.entities);
    const p1 = gameState.entities[ids[0]];
    const p2 = gameState.entities[ids[1]];

    // 1. Bewegung & Physik für jeden Spieler
    ids.forEach(id => {
        const p = gameState.entities[id];

        // Beschleunigung durch Input
        // Wer mehr Energie hat, bewegt sich etwas schneller/explosiver
        const speedMod = 1 + (p.energy / 200); 
        p.vx += p.inputs.x * MOVE_ACCEL * speedMod;
        p.vy += p.inputs.y * MOVE_ACCEL * speedMod;

        // Reibung (bremst ab)
        p.vx *= FRICTION;
        p.vy *= FRICTION;

        // Position updaten
        p.x += p.vx;
        p.y += p.vy;

        // Energie verfällt langsam (man muss ständig drücken)
        p.energy = Math.max(0, p.energy - 1);
    });

    // 2. Kollision zwischen Spielern
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const minDist = PLAYER_RADIUS * 2;

    if (dist < minDist) {
        // Kollisions-Vektor (Normalisiert)
        const nx = dx / dist;
        const ny = dy / dist;

        // Überlappung korrigieren (damit sie nicht ineinander stecken)
        const overlap = minDist - dist;
        const pushX = nx * overlap * 0.5;
        const pushY = ny * overlap * 0.5;
        p1.x -= pushX;
        p1.y -= pushY;
        p2.x += pushX;
        p2.y += pushY;

        // Impuls-Austausch (Der Sumo-Push!)
        // Der Spieler mit mehr Energie schiebt den anderen stärker weg
        // Formel: Basis-Rückstoß + Energie-Bonus
        
        const forceBase = 5;
        const p1Push = forceBase + (p1.energy * 0.2);
        const p2Push = forceBase + (p2.energy * 0.2);

        // Wir schubsen die Spieler in entgegengesetzte Richtungen
        p1.vx -= nx * p2Push; // p1 wird von p2 weggeschoben
        p1.vy -= ny * p2Push;
        
        p2.vx += nx * p1Push; // p2 wird von p1 weggeschoben
        p2.vy += ny * p1Push;
        
        // Energie verlieren beim Aufprall
        p1.energy *= 0.5;
        p2.energy *= 0.5;
    }

    // 3. Win Condition: Wer ist draußen?
    // Wir prüfen den Abstand zum Zentrum (0,0)
    ids.forEach(id => {
        const p = gameState.entities[id];
        const distFromCenter = Math.sqrt(p.x*p.x + p.y*p.y);
        
        // Wenn der Spieler komplett draußen ist (Radius + Toleranz)
        if (distFromCenter > ARENA_RADIUS + PLAYER_RADIUS) {
            // Der ANDERE hat gewonnen
            const winnerId = ids.find(winnerId => winnerId !== id);
            gameState.winner = winnerId;
        }
    });
};

module.exports = { createGameState, handleInput, handleMash, updatePhysics };