// server/games/hangman.js

const WORDS = [
    "ELEFANT", "GITARRE", "FLUGZEUG", "COMPUTER", "SCHMETTERLING", 
    "FUSSBALL", "KRANKENHAUS", "BIBLIOTHEK", "DONNERWETTER", "ACHTERBAHN",
    "SCHNEEMANN", "TASCHENLAMPE", "REGENBOGEN", "FEUERWEHR", "ZAHNARZT",
    "KANGURU", "LEUCHTTURM", "SCHLUESSEL", "HIMBEERE", "UNIVERSUM"
];

const MAX_LIVES = 5;

const createGameState = (users) => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    
    return {
        players: users.map(u => u.socketId),
        word: word, // Das geheime Wort (Server-side only theoretisch, aber wir senden es maskiert)
        maskedWord: Array(word.length).fill("_"), // Was die Spieler sehen
        
        lives: { [users[0].socketId]: MAX_LIVES, [users[1].socketId]: MAX_LIVES },
        guessedLetters: [], // Liste aller geratenen Buchstaben
        
        turnIndex: 0, // Wer ist dran?
        winner: null,
        gameOverMsg: ""
    };
};

const handleGuessLetter = (gameState, socketId, letter) => {
    if (gameState.winner) return;
    
    // Ist Spieler dran?
    const activePlayer = gameState.players[gameState.turnIndex];
    if (socketId !== activePlayer) return;

    // Buchstabe schon geraten?
    if (gameState.guessedLetters.includes(letter)) return;

    gameState.guessedLetters.push(letter);

    // Ist Buchstabe im Wort?
    let found = false;
    for (let i = 0; i < gameState.word.length; i++) {
        if (gameState.word[i] === letter) {
            gameState.maskedWord[i] = letter;
            found = true;
        }
    }

    if (found) {
        // Richtig geraten!
        // Prüfen ob Wort komplett
        if (!gameState.maskedWord.includes("_")) {
            gameState.winner = socketId;
            gameState.gameOverMsg = "CORRECT GUESS!";
        }
        // Bei richtigem Rateversuch darf man oft nochmal, 
        // aber im Duell ist Wechseln oft spannender. 
        // Wir machen: Richtig = Noch ein Zug.
    } else {
        // Falsch geraten!
        gameState.lives[socketId]--;
        // Zugwechsel
        gameState.turnIndex = (gameState.turnIndex + 1) % 2;
        
        // Prüfen ob tot
        if (gameState.lives[socketId] <= 0) {
            // Dieser Spieler ist raus. Hat der andere noch Leben?
            const opponentId = gameState.players.find(id => id !== socketId);
            if (gameState.lives[opponentId] > 0) {
                gameState.winner = opponentId; // Gegner gewinnt durch K.O.
                gameState.gameOverMsg = "OPPONENT ELIMINATED!";
            } else {
                // Beide tot (sehr unwahrscheinlich bei abwechselnd, aber möglich)
                gameState.winner = "DRAW";
                gameState.gameOverMsg = "BOTH DIED!";
            }
        }
    }
};

const handleSolveWord = (gameState, socketId, guess) => {
    if (gameState.winner) return;
    
    const activePlayer = gameState.players[gameState.turnIndex];
    if (socketId !== activePlayer) return;

    if (guess.toUpperCase() === gameState.word) {
        // GEWONNEN!
        // Wort aufdecken
        gameState.maskedWord = gameState.word.split("");
        gameState.winner = socketId;
        gameState.gameOverMsg = "WORD SOLVED!";
    } else {
        // FALSCH! Strafe: 1 Leben weg (oder 2? Wir machen 1)
        gameState.lives[socketId]--;
        gameState.turnIndex = (gameState.turnIndex + 1) % 2;
        
        if (gameState.lives[socketId] <= 0) {
            const opponentId = gameState.players.find(id => id !== socketId);
            gameState.winner = opponentId;
            gameState.gameOverMsg = "OPPONENT ELIMINATED!";
        }
    }
};

module.exports = { createGameState, handleGuessLetter, handleSolveWord };