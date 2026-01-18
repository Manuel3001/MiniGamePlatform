// server/games/balloons.js

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const DURATION = 30; // 30 Sekunden
const BALLOON_RADIUS = 30;

const COLORS = ['#ff5252', '#448aff', '#69f0ae', '#ffd740', '#e040fb'];

const createGameState = (users) => {
    return {
        players: users.map(u => u.socketId),
        scores: { [users[0].socketId]: 0, [users[1].socketId]: 0 },
        timeLeft: DURATION,
        
        // Liste der aktiven Ballons
        balloons: [], // { id, x, y, speed, color }
        nextBalloonId: 0,
        
        winner: null,
        dimensions: { width: GAME_WIDTH, height: GAME_HEIGHT }
    };
};

const spawnBalloon = (gameState) => {
    // Zufällige X Position (mit Randabstand)
    const x = Math.random() * (GAME_WIDTH - 100) + 50;
    
    gameState.balloons.push({
        id: gameState.nextBalloonId++,
        x: x,
        y: GAME_HEIGHT + 50, // Startet unterhalb des Sichtfelds
        speed: Math.random() * 3 + 2, // Geschwindigkeit 2-5
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        popped: false // Für Animations-Flag (optional)
    });
};

const updateLoop = (gameState) => {
    if (gameState.winner) return;

    // Zeit
    gameState.timeLeft -= 1/30;
    if (gameState.timeLeft <= 0) {
        gameState.timeLeft = 0;
        const p1 = gameState.players[0];
        const p2 = gameState.players[1];
        if (gameState.scores[p1] > gameState.scores[p2]) gameState.winner = p1;
        else if (gameState.scores[p2] > gameState.scores[p1]) gameState.winner = p2;
        else gameState.winner = "DRAW";
        return;
    }

    // Ballons spawnen (ca. alle 20 Ticks = 1.5 Ballons pro Sekunde im Schnitt)
    if (Math.random() < 0.08) {
        spawnBalloon(gameState);
    }

    // Ballons bewegen
    for (let i = gameState.balloons.length - 1; i >= 0; i--) {
        const b = gameState.balloons[i];
        b.y -= b.speed;

        // Wenn oben raus -> löschen
        if (b.y < -100) {
            gameState.balloons.splice(i, 1);
        }
    }
};

const handleClick = (gameState, socketId, { x, y }) => {
    if (gameState.winner) return;

    // Prüfen, ob ein Ballon getroffen wurde
    // Wir iterieren rückwärts, damit wir die vordersten Ballons zuerst treffen
    for (let i = gameState.balloons.length - 1; i >= 0; i--) {
        const b = gameState.balloons[i];
        
        // Distanz check (Kreis)
        // Hitbox etwas größer als Grafik für besseres Gefühl
        const dx = x - b.x;
        const dy = y - b.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < BALLOON_RADIUS + 10) {
            // Treffer!
            gameState.scores[socketId]++;
            // Ballon entfernen
            gameState.balloons.splice(i, 1);
            return; // Nur einen pro Klick
        }
    }
};

module.exports = { createGameState, updateLoop, handleClick };