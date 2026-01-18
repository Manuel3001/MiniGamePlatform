// server/games/airhockey.js

const BOARD_WIDTH = 800;
const BOARD_HEIGHT = 500;
const PUCK_RADIUS = 15;
const MALLET_RADIUS = 25;
const GOAL_SIZE = 160; 
const GAME_DURATION = 120; // 2 Minuten

const createGameState = (users) => {
    return {
        players: users.map(u => u.socketId),
        timeLeft: GAME_DURATION,
        scores: { [users[0].socketId]: 0, [users[1].socketId]: 0 },
        puck: {
            x: BOARD_WIDTH / 2,
            y: BOARD_HEIGHT / 2,
            vx: 0,
            vy: 0,
            radius: PUCK_RADIUS
        },
        mallets: {
            [users[0].socketId]: { x: 100, y: BOARD_HEIGHT/2, radius: MALLET_RADIUS, color: '#4dfff3', side: 'left' },
            [users[1].socketId]: { x: BOARD_WIDTH - 100, y: BOARD_HEIGHT/2, radius: MALLET_RADIUS, color: '#e94560', side: 'right' }
        },
        winner: null,
        dimensions: { width: BOARD_WIDTH, height: BOARD_HEIGHT }
    };
};

const handleInput = (gameState, socketId, mousePos) => {
    const mallet = gameState.mallets[socketId];
    if (!mallet) return;

    let targetX = mousePos.x;
    let targetY = mousePos.y;

    // Spielfeld Grenzen Y
    targetY = Math.max(MALLET_RADIUS, Math.min(BOARD_HEIGHT - MALLET_RADIUS, targetY));

    // Eigene Hälfte Grenzen X
    if (mallet.side === 'left') {
        targetX = Math.max(MALLET_RADIUS, Math.min((BOARD_WIDTH / 2) - MALLET_RADIUS, targetX));
    } else {
        targetX = Math.max((BOARD_WIDTH / 2) + MALLET_RADIUS, Math.min(BOARD_WIDTH - MALLET_RADIUS, targetX));
    }

    mallet.x = targetX;
    mallet.y = targetY;
};

const resetPuck = (gameState, scorerSide) => {
    gameState.puck.x = BOARD_WIDTH / 2;
    gameState.puck.y = BOARD_HEIGHT / 2;
    // Puck fliegt sanft zum Verlierer
    gameState.puck.vx = scorerSide === 'left' ? 4 : -4; 
    gameState.puck.vy = 0;
};

const updatePhysics = (gameState) => {
    if (gameState.winner) return;

    // Zeit
    gameState.timeLeft -= 1/30;
    if (gameState.timeLeft <= 0) {
        gameState.timeLeft = 0;
        const ids = Object.keys(gameState.scores);
        if (gameState.scores[ids[0]] > gameState.scores[ids[1]]) gameState.winner = ids[0];
        else if (gameState.scores[ids[1]] > gameState.scores[ids[0]]) gameState.winner = ids[1];
        else gameState.winner = "DRAW";
        return;
    }

    const puck = gameState.puck;

    // Puck bewegen
    puck.x += puck.vx;
    puck.y += puck.vy;

    // Ganz leichte Reibung (damit er nicht ewig gleitet, aber kaum merklich bremst)
    puck.vx *= 0.998;
    puck.vy *= 0.998;

    // Wandkollision Y (Oben/Unten)
    if (puck.y - puck.radius <= 0) {
        puck.y = puck.radius;
        puck.vy = Math.abs(puck.vy); // Sicherstellen, dass er nach unten fliegt
    } else if (puck.y + puck.radius >= BOARD_HEIGHT) {
        puck.y = BOARD_HEIGHT - puck.radius;
        puck.vy = -Math.abs(puck.vy); // Sicherstellen, dass er nach oben fliegt
    }

    // Wandkollision X (Links/Rechts) + Tore
    const goalTop = (BOARD_HEIGHT / 2) - (GOAL_SIZE / 2);
    const goalBottom = (BOARD_HEIGHT / 2) + (GOAL_SIZE / 2);

    if (puck.x - puck.radius <= 0) {
        if (puck.y > goalTop && puck.y < goalBottom) {
            // Tor Rechts
            const rightPlayer = Object.values(gameState.mallets).find(m => m.side === 'right');
            const rightId = Object.keys(gameState.mallets).find(key => gameState.mallets[key] === rightPlayer);
            gameState.scores[rightId]++;
            resetPuck(gameState, 'right');
            return;
        } else {
            puck.x = puck.radius;
            puck.vx *= -1;
        }
    }
    else if (puck.x + puck.radius >= BOARD_WIDTH) {
        if (puck.y > goalTop && puck.y < goalBottom) {
            // Tor Links
            const leftPlayer = Object.values(gameState.mallets).find(m => m.side === 'left');
            const leftId = Object.keys(gameState.mallets).find(key => gameState.mallets[key] === leftPlayer);
            gameState.scores[leftId]++;
            resetPuck(gameState, 'left');
            return;
        } else {
            puck.x = BOARD_WIDTH - puck.radius;
            puck.vx *= -1;
        }
    }

    // --- NEUE VEREINFACHTE KOLLISIONSLOGIK ---
    Object.values(gameState.mallets).forEach(mallet => {
        const dx = puck.x - mallet.x;
        const dy = puck.y - mallet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDist = puck.radius + mallet.radius;

        if (distance < minDist) {
            // 1. Position korrigieren (Puck aus dem Schläger drücken)
            const overlap = minDist - distance;
            // Normalisierter Vektor vom Schläger zum Puck
            let nx = dx / distance;
            let ny = dy / distance;

            // Push ausführen
            puck.x += nx * overlap;
            puck.y += ny * overlap;

            // 2. "Arcade Physik": Winkel glätten
            // Wir verringern die Y-Komponente künstlich, damit der Ball "gerader" fliegt
            // Faktor 0.5 bedeutet: Nur halbe seitliche Ablenkung
            ny *= 0.5; 

            // Vektor neu normalisieren nach der Glättung
            const newLen = Math.sqrt(nx*nx + ny*ny);
            nx /= newLen;
            ny /= newLen;

            // 3. Feste Geschwindigkeit setzen (statt Impulserhaltung)
            // Das macht das Spiel vorhersehbarer und spaßiger
            const SHOT_SPEED = 14; 
            
            puck.vx = nx * SHOT_SPEED;
            puck.vy = ny * SHOT_SPEED;

            // 4. Mindest-Vorwärtsdrang garantieren
            // Wenn Spieler Links schlägt, muss der Ball nach rechts fliegen (vx > 0)
            // Wenn Spieler Rechts schlägt, muss der Ball nach links fliegen (vx < 0)
            // Das verhindert "Rückwärts-Glitches"
            if (mallet.side === 'left' && puck.vx < 3) {
                puck.vx = 3 + Math.abs(puck.vy); // Erzwinge Rechts-Drall
            }
            if (mallet.side === 'right' && puck.vx > -3) {
                puck.vx = -3 - Math.abs(puck.vy); // Erzwinge Links-Drall
            }
        }
    });
};

module.exports = { createGameState, handleInput, updatePhysics };