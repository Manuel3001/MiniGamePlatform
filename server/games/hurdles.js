// server/games/hurdles.js

const TRACK_LENGTH = 10000; // Länge der Strecke in Pixeln
const GRAVITY = 1.5;
const JUMP_FORCE = 22;
const RUN_BOOST = 3; // Geschwindigkeit pro Tastendruck
const MAX_SPEED = 25; // Maximale Geschwindigkeit
const FRICTION = 0.96; // Luftwiderstand/Bodenreibung
const HURDLE_POSITIONS = [1500, 3000, 4500, 6000, 7500, 9000]; // Wo stehen die Hürden?
const HURDLE_WIDTH = 50;
const HURDLE_HEIGHT = 60; // Wie hoch muss man springen?

const createGameState = (users) => {
    return {
        players: users.map(u => u.socketId),
        runners: {
            [users[0].socketId]: { 
                x: 0, 
                y: 0, // Höhe (0 = Boden)
                vy: 0, // Vertikale Geschwindigkeit
                speed: 0, // Horizontale Geschwindigkeit
                color: '#4dfff3',
                finished: false,
                stumbled: false // Visuelles Feedback bei Kollision
            },
            [users[1].socketId]: { 
                x: 0, 
                y: 0, 
                vy: 0, 
                speed: 0, 
                color: '#e94560',
                finished: false,
                stumbled: false
            }
        },
        hurdles: HURDLE_POSITIONS,
        winner: null,
        trackLength: TRACK_LENGTH
    };
};

// Wird aufgerufen, wenn Spieler LEERTASTE drückt
const handleRun = (gameState, socketId) => {
    const runner = gameState.runners[socketId];
    if (runner && !runner.finished) {
        // Geschwindigkeit erhöhen, aber Cap beachten
        runner.speed = Math.min(MAX_SPEED, runner.speed + RUN_BOOST);
    }
};

// Wird aufgerufen, wenn Spieler ENTER drückt
const handleJump = (gameState, socketId) => {
    const runner = gameState.runners[socketId];
    if (runner && !runner.finished && runner.y === 0) { // Nur springen wenn am Boden
        runner.vy = JUMP_FORCE;
    }
};

const updatePhysics = (gameState) => {
    if (gameState.winner) return;

    Object.keys(gameState.runners).forEach(id => {
        const p = gameState.runners[id];
        if (p.finished) return;

        // 1. Horizontale Bewegung
        p.x += p.speed;
        p.speed *= FRICTION; // Langsamer werden wenn man nicht drückt

        // 2. Vertikale Bewegung (Sprung)
        p.y += p.vy;
        if (p.y > 0) {
            p.vy -= GRAVITY; // Schwerkraft zieht runter
        } else {
            p.y = 0;
            p.vy = 0;
        }

        // 3. Hürden-Kollision
        p.stumbled = false;
        // Wir prüfen, ob eine Hürde in der Nähe ist
        for (let hPos of HURDLE_POSITIONS) {
            // Ist der Spieler horizontal IN der Hürde?
            if (p.x + 40 > hPos && p.x < hPos + HURDLE_WIDTH) {
                // Ist der Spieler tief genug für eine Kollision?
                if (p.y < HURDLE_HEIGHT) {
                    // CRASH!
                    p.speed *= 0.2; // Massive Bremsung
                    p.stumbled = true;
                    // Kleiner Rückstoß damit man nicht in der Hürde klebt
                    if (p.x < hPos + 10) p.x = hPos - 10; 
                }
            }
        }

        // 4. Ziel erreicht?
        if (p.x >= TRACK_LENGTH) {
            p.finished = true;
            p.x = TRACK_LENGTH;
            if (!gameState.winner) {
                gameState.winner = id;
            }
        }
    });
};

module.exports = { createGameState, handleRun, handleJump, updatePhysics };