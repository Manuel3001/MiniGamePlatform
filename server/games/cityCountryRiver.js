// server/games/cityCountryRiver.js

const CATEGORIES = ["Stadt", "Land", "Fluss", "Tier", "Name"];
const ROUNDS = 3;
const WRITE_TIME = 45; // Sekunden zum Schreiben
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const createGameState = (users) => {
    return {
        players: users.map(u => u.socketId),
        scores: { [users[0].socketId]: 0, [users[1].socketId]: 0 },
        round: 1,
        maxRounds: ROUNDS,
        
        // Phasen: 'LETTER_ANIM' -> 'WRITING' -> 'REVIEW' -> 'ROUND_END' -> 'GAME_OVER'
        phase: 'LETTER_ANIM', 
        currentLetter: null,
        timeLeft: 3, // Start-Countdown für Animation
        
        // Antworten der Spieler für die aktuelle Runde
        answers: { [users[0].socketId]: {}, [users[1].socketId]: {} },
        
        // Wer ist fertig mit Schreiben?
        finishedWriting: [],
        
        // Bewertungen: review[judgeId] = { categoryIndex: boolean } (true = akzeptiert)
        reviews: { [users[0].socketId]: {}, [users[1].socketId]: {} },
        finishedReviewing: [],
        
        roundResults: null, // Für die Anzeige am Rundenende
        winner: null
    };
};

const updateLoop = (gameState) => {
    if (gameState.winner) return;

    // --- PHASE 1: Buchstaben-Auswahl Animation ---
    if (gameState.phase === 'LETTER_ANIM') {
        // Wir wechseln den Buchstaben zufällig durch für den Effekt
        gameState.currentLetter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
        
        gameState.timeLeft -= 1/10; // 10 FPS Loop im Index.js
        if (gameState.timeLeft <= 0) {
            // Echten Buchstaben festlegen
            gameState.currentLetter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
            gameState.phase = 'WRITING';
            gameState.timeLeft = WRITE_TIME;
            // Antworten resetten
            gameState.answers = { [gameState.players[0]]: {}, [gameState.players[1]]: {} };
            gameState.finishedWriting = [];
        }
    }
    
    // --- PHASE 2: Schreiben ---
    else if (gameState.phase === 'WRITING') {
        gameState.timeLeft -= 1/10;
        if (gameState.timeLeft <= 0) {
            // Zeit abgelaufen -> Ab ins Review
            startReviewPhase(gameState);
        }
    }
};

const handleInput = (gameState, socketId, inputs) => {
    // Inputs ist ein Objekt: { 0: "Berlin", 1: "Belgien", ... } (Key ist Category Index)
    if (gameState.phase !== 'WRITING') return;
    
    gameState.answers[socketId] = inputs;
    
    if (!gameState.finishedWriting.includes(socketId)) {
        gameState.finishedWriting.push(socketId);
    }

    // Wenn beide fertig sind (oder "Fertig" geklickt haben), sofort weiter
    if (gameState.finishedWriting.length === 2) {
        startReviewPhase(gameState);
    }
};

const startReviewPhase = (gameState) => {
    gameState.phase = 'REVIEW';
    gameState.timeLeft = 0;
    // Reviews initialisieren (Standardmäßig alles als "Richtig" (true) vorselektieren, außer leere Felder)
    gameState.players.forEach(pid => {
        const opponentId = gameState.players.find(id => id !== pid);
        const oppAnswers = gameState.answers[opponentId];
        
        const initialReview = {};
        CATEGORIES.forEach((_, idx) => {
            // Wenn Antwort leer, dann automatisch falsch/false, sonst erst mal true
            const ans = oppAnswers[idx] || "";
            initialReview[idx] = ans.trim().length > 0;
        });
        gameState.reviews[pid] = initialReview;
    });
    gameState.finishedReviewing = [];
};

const handleReview = (gameState, socketId, reviewData) => {
    // reviewData: { 0: true, 1: false, ... } -> Bewertungen über den GEGNER
    if (gameState.phase !== 'REVIEW') return;

    gameState.reviews[socketId] = reviewData;

    if (!gameState.finishedReviewing.includes(socketId)) {
        gameState.finishedReviewing.push(socketId);
    }

    if (gameState.finishedReviewing.length === 2) {
        calculateScores(gameState);
    }
};

const calculateScores = (gameState) => {
    const p1 = gameState.players[0];
    const p2 = gameState.players[1];

    const p1Points = {};
    const p2Points = {};
    let p1RoundScore = 0;
    let p2RoundScore = 0;

    CATEGORIES.forEach((cat, idx) => {
        const ans1 = (gameState.answers[p1][idx] || "").trim().toUpperCase();
        const ans2 = (gameState.answers[p2][idx] || "").trim().toUpperCase();

        // Hat der Gegner (p2) die Antwort von p1 akzeptiert?
        const p1Valid = gameState.reviews[p2][idx] && ans1.length > 0 && ans1.startsWith(gameState.currentLetter);
        // Hat der Gegner (p1) die Antwort von p2 akzeptiert?
        const p2Valid = gameState.reviews[p1][idx] && ans2.length > 0 && ans2.startsWith(gameState.currentLetter);

        // Punkte Logik
        if (p1Valid) {
            if (p2Valid && ans1 === ans2) {
                p1Points[idx] = 5; // Gleiches Wort
                p1RoundScore += 5;
            } else {
                p1Points[idx] = 10; // Einzigartig (oder Gegner falsch)
                p1RoundScore += 10;
            }
        } else {
            p1Points[idx] = 0;
        }

        if (p2Valid) {
            if (p1Valid && ans1 === ans2) {
                p2Points[idx] = 5;
                p2RoundScore += 5;
            } else {
                p2Points[idx] = 10;
                p2RoundScore += 10;
            }
        } else {
            p2Points[idx] = 0;
        }
    });

    gameState.scores[p1] += p1RoundScore;
    gameState.scores[p2] += p2RoundScore;

    gameState.roundResults = {
        [p1]: { answers: gameState.answers[p1], points: p1Points, total: p1RoundScore },
        [p2]: { answers: gameState.answers[p2], points: p2Points, total: p2RoundScore }
    };

    gameState.phase = 'ROUND_END';
};

const nextRound = (gameState) => {
    if (gameState.round >= ROUNDS) {
        // Spielende
        const p1 = gameState.players[0];
        const p2 = gameState.players[1];
        if (gameState.scores[p1] > gameState.scores[p2]) gameState.winner = p1;
        else if (gameState.scores[p2] > gameState.scores[p1]) gameState.winner = p2;
        else gameState.winner = "DRAW";
    } else {
        gameState.round++;
        gameState.phase = 'LETTER_ANIM';
        gameState.timeLeft = 3;
        gameState.roundResults = null;
        gameState.finishedReviewing = [];
        gameState.finishedWriting = [];
    }
};

module.exports = { createGameState, updateLoop, handleInput, handleReview, nextRound, CATEGORIES };