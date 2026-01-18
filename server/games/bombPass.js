// server/games/bombPass.js

const createGameState = (users) => {
    // Explosion zwischen 40s und 80s
    const explodeDelay = (40 + Math.random() * 40) * 1000;
    
    return {
        players: users.map(u => u.socketId),
        bombHolder: users[0].socketId, // P1 startet mit Bombe
        
        explosionTime: Date.now() + explodeDelay,
        gameOver: false,
        winner: null,
        
        currentProblem: generateMathProblem(1), // Level 1
        level: 1,
        
        msg: "Solve to pass the bomb!"
    };
};

const generateMathProblem = (level) => {
    let a, b, op, ans;
    const ops = ['+', '-', '*'];
    
    if (level <= 3) {
        // Einfach
        a = Math.floor(Math.random() * 10) + 1;
        b = Math.floor(Math.random() * 10) + 1;
        op = ops[Math.floor(Math.random() * 2)]; // Nur + oder -
    } else if (level <= 6) {
        // Mittel
        a = Math.floor(Math.random() * 20) + 5;
        b = Math.floor(Math.random() * 20) + 5;
        op = ops[Math.floor(Math.random() * 3)];
    } else {
        // Schwer
        a = Math.floor(Math.random() * 50) + 10;
        b = Math.floor(Math.random() * 50) + 10;
        op = ops[Math.floor(Math.random() * 3)];
    }

    if (op === '+') ans = a + b;
    if (op === '-') { 
        if (a < b) [a, b] = [b, a]; // Keine negativen Ergebnisse
        ans = a - b; 
    }
    if (op === '*') {
        if (level < 5) { a = Math.floor(Math.random()*10); b = Math.floor(Math.random()*10); } // Kleines 1x1
        ans = a * b;
    }

    return { text: `${a} ${op} ${b} = ?`, answer: ans };
};

const handleInput = (gameState, socketId, input) => {
    if (gameState.winner) return;
    
    // Nur der Bombenhalter darf lösen
    if (socketId !== gameState.bombHolder) return;

    if (parseInt(input) === gameState.currentProblem.answer) {
        // Richtig! Bombe weitergeben
        const opponent = gameState.players.find(id => id !== socketId);
        gameState.bombHolder = opponent;
        
        // Level erhöhen & neue Aufgabe
        gameState.level++;
        gameState.currentProblem = generateMathProblem(gameState.level);
        gameState.msg = "PASSED! New problem coming...";
    }
};

const updateLoop = (gameState) => {
    if (gameState.winner) return;

    if (Date.now() >= gameState.explosionTime) {
        // BOOM!
        gameState.gameOver = true;
        // Wer die Bombe hat, verliert
        const loser = gameState.bombHolder;
        const winner = gameState.players.find(id => id !== loser);
        gameState.winner = winner;
        gameState.msg = "BOOM! You exploded.";
    }
};

module.exports = { createGameState, updateLoop, handleInput };