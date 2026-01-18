// server/games/pingPong.js

const GAME_WIDTH = 800;
const GAME_HEIGHT = 500;
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;
const BALL_SIZE = 10;
const WIN_SCORE = 5; // Wer zuerst 5 Punkte hat, gewinnt

const createGameState = (users) => {
    return {
        players: users.map(u => u.socketId),
        // Spieler 1 (Links), Spieler 2 (Rechts)
        paddles: {
            [users[0].socketId]: { y: 200, x: 20, score: 0, side: 'left' },
            [users[1].socketId]: { y: 200, x: GAME_WIDTH - 30, score: 0, side: 'right' }
        },
        ball: {
            x: GAME_WIDTH / 2,
            y: GAME_HEIGHT / 2,
            dx: 6 * (Math.random() > 0.5 ? 1 : -1), // Zufällige Startrichtung
            dy: 6 * (Math.random() > 0.5 ? 1 : -1)
        },
        winner: null,
        dimensions: { width: GAME_WIDTH, height: GAME_HEIGHT }
    };
};

const movePaddle = (gameState, socketId, direction) => {
    const paddle = gameState.paddles[socketId];
    if (!paddle) return;

    const speed = 25; // Pixel pro Tastendruck (oder Tick)

    if (direction === 'up') {
        paddle.y = Math.max(0, paddle.y - speed);
    } else if (direction === 'down') {
        paddle.y = Math.min(GAME_HEIGHT - PADDLE_HEIGHT, paddle.y + speed);
    }
};

// Diese Funktion wird vom Server Loop aufgerufen (z.B. alle 50ms)
const updatePhysics = (gameState) => {
    if (gameState.winner) return gameState;

    const ball = gameState.ball;

    // 1. Ball Bewegung
    ball.x += ball.dx;
    ball.y += ball.dy;

    // 2. Wand-Kollision (Oben/Unten)
    if (ball.y <= 0 || ball.y + BALL_SIZE >= GAME_HEIGHT) {
        ball.dy *= -1;
    }

    // 3. Paddle Kollisionen
    // Einfache Box-Kollision prüfen
    Object.values(gameState.paddles).forEach(paddle => {
        // Prüfen ob Ball und Paddle sich überschneiden
        if (
            ball.x < paddle.x + PADDLE_WIDTH &&
            ball.x + BALL_SIZE > paddle.x &&
            ball.y < paddle.y + PADDLE_HEIGHT &&
            ball.y + BALL_SIZE > paddle.y
        ) {
            // Richtung umkehren und etwas schneller werden
            ball.dx *= -1.05; 
            
            // Verhindern, dass der Ball im Paddle "stecken" bleibt
            if (paddle.side === 'left') {
                ball.x = paddle.x + PADDLE_WIDTH + 2;
            } else {
                ball.x = paddle.x - BALL_SIZE - 2;
            }
        }
    });

    // 4. Tor erzielt? (Links/Rechts raus)
    if (ball.x < 0) {
        // Punkt für Spieler Rechts
        const rightPlayerId = Object.keys(gameState.paddles).find(id => gameState.paddles[id].side === 'right');
        gameState.paddles[rightPlayerId].score += 1;
        resetBall(gameState);
    } else if (ball.x > GAME_WIDTH) {
        // Punkt für Spieler Links
        const leftPlayerId = Object.keys(gameState.paddles).find(id => gameState.paddles[id].side === 'left');
        gameState.paddles[leftPlayerId].score += 1;
        resetBall(gameState);
    }

    // 5. Sieg prüfen
    Object.keys(gameState.paddles).forEach(socketId => {
        if (gameState.paddles[socketId].score >= WIN_SCORE) {
            gameState.winner = socketId;
        }
    });

    return gameState;
};

const resetBall = (gameState) => {
    gameState.ball.x = GAME_WIDTH / 2;
    gameState.ball.y = GAME_HEIGHT / 2;
    // Richtung zufällig, Geschwindigkeit zurücksetzen
    gameState.ball.dx = 6 * (Math.random() > 0.5 ? 1 : -1);
    gameState.ball.dy = 6 * (Math.random() > 0.5 ? 1 : -1);
};

module.exports = { createGameState, movePaddle, updatePhysics };