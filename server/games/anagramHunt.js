// server/games/anagramHunt.js

const WORDS = [
    "BANANE", "GITARRE", "FENSTER", "ANANAS", "ELEFANT", "RAKETE", "KOFFER",
    "SPIEGEL", "TOMATE", "PAPIER", "HIMMEL", "WASSER", "FLASCHE", "MONITOR",
    "MAUSPAD", "TASTATUR", "KRATZER", "LAMPE", "SCHUH", "SOCKEN", "BRILLE"
];

const ROUNDS_TO_WIN = 5; // Wer zuerst 5 Punkte hat

const createGameState = (users) => {
    return {
        players: users.map(u => u.socketId),
        scores: { [users[0].socketId]: 0, [users[1].socketId]: 0 },
        
        currentWord: "",
        scrambledWord: "",
        
        round: 1,
        winner: null,
        
        // Status für UI-Feedback
        lastWinner: null, // Wer hat die letzte Runde gewonnen?
        isWaiting: false // Kurze Pause zwischen Wörtern
    };
};

const nextRound = (gameState) => {
    // Neues Wort wählen
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    gameState.currentWord = word;
    gameState.scrambledWord = shuffleWord(word);
    gameState.isWaiting = false;
    gameState.lastWinner = null;
};

// Hilfsfunktion: Wort mischen
const shuffleWord = (word) => {
    let arr = word.split('');
    // Sicherstellen, dass es nicht identisch mit dem Original ist
    let shuffled;
    do {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        shuffled = arr.join('');
    } while (shuffled === word && word.length > 1);
    
    return shuffled;
};

const handleInput = (gameState, socketId, guess) => {
    if (gameState.winner || gameState.isWaiting) return;

    const input = guess.trim().toUpperCase();

    if (input === gameState.currentWord) {
        // Richtig!
        gameState.scores[socketId]++;
        gameState.lastWinner = socketId;
        gameState.isWaiting = true;

        // Check Win Condition
        if (gameState.scores[socketId] >= ROUNDS_TO_WIN) {
            gameState.winner = socketId;
        } else {
            // Nächste Runde verzögert starten (wird vom Client oder Loop getriggert? 
            // Loop ist besser für Timing)
            gameState.nextRoundTime = Date.now() + 2000; // 2 Sekunden Pause
        }
    }
};

const updateLoop = (gameState) => {
    // Erstes Wort initialisieren, falls noch nicht geschehen
    if (!gameState.currentWord && !gameState.winner) {
        nextRound(gameState);
    }

    // Pause managen
    if (gameState.isWaiting && gameState.nextRoundTime && Date.now() > gameState.nextRoundTime) {
        nextRound(gameState);
        gameState.nextRoundTime = null;
    }
};

module.exports = { createGameState, updateLoop, handleInput };