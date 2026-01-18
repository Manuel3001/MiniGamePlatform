// server/games/archery.js

const GRAVITY = 0.5;
const MAX_POWER = 25; // Maximale Abschussgeschwindigkeit
const GROUND_Y = 450; // Bodenhöhe

const createGameState = (users) => {
    return {
        players: users.map(u => u.socketId),
        currentPlayerIndex: 0,
        scores: { [users[0].socketId]: 0, [users[1].socketId]: 0 },
        arrowsLeft: { [users[0].socketId]: 3, [users[1].socketId]: 3 }, // Schüsse pro Spiel
        
        // Umgebungsvariablen
        targetDist: 600 + Math.random() * 200, // Ziel ist 600-800px entfernt
        wind: (Math.random() - 0.5) * 0.8, // Windkraft (-0.4 bis +0.4)
        
        // Letzter Schuss für Animation (Pfad, Treffer)
        lastShot: null, 
        
        winner: null,
        gameOver: false
    };
};

const calculateTrajectory = (angle, power, wind, startX, startY, targetX) => {
    const path = [];
    let x = startX;
    let y = startY;
    
    // Geschwindigkeit zerlegen
    const rad = angle * (Math.PI / 180);
    let vx = Math.cos(rad) * power;
    let vy = -Math.sin(rad) * power; // Negativ, weil Y=0 oben ist

    let hitScore = 0;
    let hit = false;

    // Simulationsschleife (max 200 Schritte damit Server nicht hängt)
    for (let i = 0; i < 300; i++) {
        path.push({ x, y });

        // Physik anwenden
        x += vx;
        y += vy;
        vy += GRAVITY;     // Schwerkraft
        vx += wind * 0.1;  // Windwiderstand/Beschleunigung

        // Bodenkollision
        if (y >= GROUND_Y) {
            y = GROUND_Y;
            path.push({ x, y });
            break;
        }

        // Zielkollision (Ziel ist bei targetX, Höhe ca. 400-450)
        // Zielscheibe ist ca. 80px hoch (von 370 bis 450)
        // Bullseye ist bei 410
        if (Math.abs(x - targetX) < 10 && y > 370 && y < 450) {
            // Treffer!
            hit = true;
            // Punkte berechnen je nach Höhe (Bullseye = 410)
            const distFromCenter = Math.abs(y - 410);
            
            if (distFromCenter < 10) hitScore = 50; // Bullseye
            else if (distFromCenter < 25) hitScore = 25;
            else hitScore = 10;
            
            path.push({ x, y });
            break;
        }
    }

    return { path, hitScore };
};

const handleShoot = (gameState, socketId, { angle, power }) => {
    if (gameState.winner || socketId !== gameState.players[gameState.currentPlayerIndex]) return;
    
    // Munition prüfen
    if (gameState.arrowsLeft[socketId] <= 0) return;

    // Startposition (Links für Spieler 1, Rechts für Spieler 2??)
    // Vereinfachung: Beide schießen von Links nach Rechts auf das gleiche Ziel, nacheinander.
    const startX = 50;
    const startY = 400; // Schulterhöhe

    // Flugbahn berechnen
    // Wir skalieren Power (0-100 Input -> 0-MAX_POWER)
    const truePower = (power / 100) * MAX_POWER;
    
    const result = calculateTrajectory(angle, truePower, gameState.wind, startX, startY, gameState.targetDist);

    // Score updaten
    gameState.scores[socketId] += result.hitScore;
    gameState.arrowsLeft[socketId]--;

    // Ergebnis für Frontend speichern
    gameState.lastShot = {
        playerId: socketId,
        path: result.path,
        score: result.hitScore
    };

    // Nächster Spieler oder Rundenende?
    // Wind ändern für den nächsten Schuss (macht es schwieriger!)
    gameState.wind = (Math.random() - 0.5) * 0.8;
    
    // Nächster Spieler ist dran
    const p1 = gameState.players[0];
    const p2 = gameState.players[1];
    
    // Wenn beide keine Pfeile mehr haben -> Game Over
    if (gameState.arrowsLeft[p1] === 0 && gameState.arrowsLeft[p2] === 0) {
        // Gewinner ermitteln
        if (gameState.scores[p1] > gameState.scores[p2]) gameState.winner = p1;
        else if (gameState.scores[p2] > gameState.scores[p1]) gameState.winner = p2;
        else gameState.winner = "DRAW"; // Unentschieden
        gameState.gameOver = true;
    } else {
        // Spieler wechseln, solange der andere noch Pfeile hat
        // Wenn der aktuelle keine mehr hat, bleibt der andere dran? 
        // Einfacher: Wir wechseln strikt. Wenn einer leer ist, wird er übersprungen.
        let nextIndex = (gameState.currentPlayerIndex + 1) % 2;
        if (gameState.arrowsLeft[gameState.players[nextIndex]] === 0) {
            // Wenn der Nächste leer ist, bleibe ich dran (falls ich noch habe)
            // Aber eigentlich endet das Spiel dann oben im if-Block, da beide 0 sind.
            // Also einfach wechseln.
        }
        gameState.currentPlayerIndex = nextIndex;
    }
    
    return gameState;
};

module.exports = { createGameState, handleShoot };