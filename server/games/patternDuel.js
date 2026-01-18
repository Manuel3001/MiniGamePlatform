// server/games/patternDuel.js

const COLORS = [0, 1, 2, 3];

const createGameState = (users) => {
    return {
        players: users.map(u => u.socketId),
        sequence: [], 
        turnIndex: 0, 
        stepIndex: 0,
        lastPressed: null,
        pressId: 0, // NEU: Damit wir auch gleiche Tasten hintereinander erkennen
        winner: null,
        msg: "Wait for opponent..."
    };
};

const handleInput = (gameState, socketId, btnIndex) => {
    if (gameState.winner) return;
    
    const activePlayer = gameState.players[gameState.turnIndex];
    if (socketId !== activePlayer) return;

    gameState.lastPressed = btnIndex;
    gameState.pressId = Date.now(); // NEU: Eindeutige ID für diesen Klick

    // Fall 1: Sequenz ist noch leer (Erster Zug überhaupt)
    if (gameState.sequence.length === 0) {
        gameState.sequence.push(btnIndex);
        gameState.msg = "First step added!";
        switchTurn(gameState);
        return;
    }

    // Fall 2: Spieler wiederholt die Sequenz
    if (gameState.stepIndex < gameState.sequence.length) {
        const expected = gameState.sequence[gameState.stepIndex];
        
        if (btnIndex === expected) {
            // Richtig!
            gameState.stepIndex++;
            gameState.msg = `Correct! (${gameState.stepIndex}/${gameState.sequence.length})`;
        } else {
            // Falsch!
            const winnerId = gameState.players.find(id => id !== socketId);
            gameState.winner = winnerId;
            gameState.msg = "WRONG PATTERN!";
        }
    } 
    // Fall 3: Spieler fügt neuen Schritt hinzu
    else {
        gameState.sequence.push(btnIndex);
        switchTurn(gameState);
    }
};

const switchTurn = (gameState) => {
    gameState.turnIndex = (gameState.turnIndex + 1) % 2;
    gameState.stepIndex = 0;
    gameState.msg = "Your turn! Repeat & Add.";
    // lastPressed wird NICHT resettet, damit man sieht was der Gegner gedrückt hat,
    // aber pressId bleibt alt, daher leuchtet es nicht nochmal auf.
};

module.exports = { createGameState, handleInput };