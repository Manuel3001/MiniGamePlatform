// server/games/wordSnake.js

const START_WORDS = ["APFEL", "HAUS", "KATZE", "SONNE", "BUCH", "TISCH", "STUHL", "MOND", "WASSER", "FEUER"];
const INITIAL_TIME = 60; // Sekunden

const createGameState = (users) => {
    const startWord = START_WORDS[Math.floor(Math.random() * START_WORDS.length)];
    
    return {
        players: users.map(u => u.socketId),
        // Zeitkonten für beide Spieler
        timeBanks: { [users[0].socketId]: INITIAL_TIME, [users[1].socketId]: INITIAL_TIME },
        
        turnIndex: 0, // Wer ist dran?
        
        usedWords: [startWord], // Liste aller Wörter
        lastWord: startWord,
        requiredLetter: startWord.slice(-1), // Letzter Buchstabe
        
        status: 'PLAYING', // 'PLAYING', 'GAME_OVER'
        winner: null,
        
        message: "", // Fehlermeldungen (z.B. "Word already used")
        msgTarget: null // Wer soll die Nachricht sehen?
    };
};

const updateLoop = (gameState) => {
    if (gameState.winner) return;

    // Zeit des aktiven Spielers abziehen
    const activePlayer = gameState.players[gameState.turnIndex];
    
    // Wir ziehen hier z.B. 0.1s pro Tick ab (je nach Interval im index.js)
    gameState.timeBanks[activePlayer] -= 0.1;

    // Zeit abgelaufen?
    if (gameState.timeBanks[activePlayer] <= 0) {
        gameState.timeBanks[activePlayer] = 0;
        gameState.status = 'GAME_OVER';
        
        // Der ANDERE hat gewonnen
        const winnerId = gameState.players[(gameState.turnIndex + 1) % 2];
        gameState.winner = winnerId;
    }
};

const handleInput = (gameState, socketId, word) => {
    if (gameState.winner) return;

    const activePlayer = gameState.players[gameState.turnIndex];
    
    // Ist der Spieler dran?
    if (socketId !== activePlayer) return;

    const input = word.trim().toUpperCase();

    // Validierung 1: Wortlänge
    if (input.length < 2) {
        setError(gameState, socketId, "Too short!");
        return;
    }

    // Validierung 2: Startbuchstabe
    if (input.charAt(0) !== gameState.requiredLetter) {
        setError(gameState, socketId, `Must start with '${gameState.requiredLetter}'!`);
        return;
    }

    // Validierung 3: Schon benutzt?
    if (gameState.usedWords.includes(input)) {
        setError(gameState, socketId, "Word already used!");
        return;
    }

    // GÜLTIG!
    gameState.usedWords.push(input);
    gameState.lastWord = input;
    gameState.requiredLetter = input.slice(-1);
    
    // Zugwechsel
    gameState.turnIndex = (gameState.turnIndex + 1) % 2;
    gameState.message = ""; // Fehler löschen
};

const setError = (gameState, socketId, msg) => {
    gameState.message = msg;
    gameState.msgTarget = socketId;
    // Nachricht nach 2 Sekunden löschen (optional, aber UI regelt das meist besser)
};

module.exports = { createGameState, updateLoop, handleInput };