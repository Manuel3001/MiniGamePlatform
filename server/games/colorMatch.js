// server/games/colorMatch.js

const DURATION = 30; // Sekunden

const COLORS = [
    { name: "RED", hex: "#ff5252" },
    { name: "BLUE", hex: "#448aff" },
    { name: "GREEN", hex: "#69f0ae" },
    { name: "YELLOW", hex: "#ffd740" },
    { name: "PURPLE", hex: "#e040fb" },
    { name: "ORANGE", hex: "#ffab40" } // Extra Farbe für Verwirrung
];

const createGameState = (users) => {
    const p1 = users[0].socketId;
    const p2 = users[1].socketId;

    return {
        players: [p1, p2],
        scores: { [p1]: 0, [p2]: 0 },
        timeLeft: DURATION,
        
        // Aktuelle Aufgabe pro Spieler
        tasks: {
            [p1]: generateTask(),
            [p2]: generateTask()
        },
        
        winner: null
    };
};

const generateTask = () => {
    // 50% Chance auf Match
    const isMatch = Math.random() < 0.5;
    
    // Zufälliges Wort wählen
    const wordObj = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    let colorObj;
    if (isMatch) {
        colorObj = wordObj;
    } else {
        // Andere Farbe wählen
        const others = COLORS.filter(c => c.name !== wordObj.name);
        colorObj = others[Math.floor(Math.random() * others.length)];
    }

    return {
        word: wordObj.name, // Was da steht (z.B. "RED")
        color: colorObj.hex, // Die Farbe der Schrift
        isMatch: isMatch
    };
};

const handleInput = (gameState, socketId, answer) => {
    // answer: boolean (true = JA, false = NEIN)
    if (gameState.winner) return;

    const task = gameState.tasks[socketId];
    if (!task) return;

    if (task.isMatch === answer) {
        // Richtig
        gameState.scores[socketId] += 10;
    } else {
        // Falsch
        gameState.scores[socketId] -= 5;
    }
    
    // Sofort neue Aufgabe generieren
    gameState.tasks[socketId] = generateTask();
};

const updateLoop = (gameState) => {
    if (gameState.winner) return;

    gameState.timeLeft -= 1/10;
    
    if (gameState.timeLeft <= 0) {
        gameState.timeLeft = 0;
        const p1 = gameState.players[0];
        const p2 = gameState.players[1];
        
        if (gameState.scores[p1] > gameState.scores[p2]) gameState.winner = p1;
        else if (gameState.scores[p2] > gameState.scores[p1]) gameState.winner = p2;
        else gameState.winner = "DRAW";
    }
};

module.exports = { createGameState, updateLoop, handleInput };