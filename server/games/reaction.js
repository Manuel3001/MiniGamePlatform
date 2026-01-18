// server/games/reaction.js

const WIN_SCORE = 5;

const createGameState = (users) => {
    return {
        players: users.map(u => u.socketId),
        scores: { [users[0].socketId]: 0, [users[1].socketId]: 0 },
        
        // Status: 'WAITING' (Rot), 'GREEN' (Grün), 'BLUE' (Fake/Blau), 'RESULT'
        status: 'WAITING', 
        message: 'WAIT FOR GREEN...',
        
        roundWinner: null,
        winner: null,
        
        // Zufällige Verzögerung
        nextEventTime: Date.now() + Math.random() * 4000 + 2000 
    };
};

// Polling Loop
const updateLoop = (gameState) => {
    if (gameState.winner) return;

    const now = Date.now();

    // 1. Reset Logik (nach Runde oder nach überstandenem Blue-Fake)
    if (gameState.resetTime && now > gameState.resetTime) {
        // Zurücksetzen auf Warten
        gameState.status = 'WAITING';
        gameState.roundWinner = null;
        gameState.message = 'WAIT FOR GREEN...';
        gameState.nextEventTime = now + Math.random() * 4000 + 2000;
        
        delete gameState.resetTime;
        delete gameState.isBlueReset;
    }

    // 2. Event auslösen (Wenn Zeit abgelaufen und wir warten)
    if (gameState.status === 'WAITING' && now >= gameState.nextEventTime) {
        
        // Entscheiden: Grün (Start) oder Blau (Fake)?
        // 35% Chance auf Blau
        if (Math.random() < 0.35) {
            gameState.status = 'BLUE';
            gameState.message = 'DONT CLICK!';
            // Der Fake dauert 1.5 Sekunden, dann geht es zurück zu Rot (ohne Punktverlust)
            gameState.resetTime = now + 1500;
            gameState.isBlueReset = true; 
        } else {
            gameState.status = 'GREEN';
            gameState.message = 'CLICK NOW!';
        }
        
        // EventTime löschen, damit es nicht dauernd triggert
        gameState.nextEventTime = Infinity; 
    }
};

const handleClick = (gameState, socketId) => {
    if (gameState.winner) return;
    if (gameState.status === 'RESULT') return; 

    const opponentId = gameState.players.find(id => id !== socketId);

    // A) Zu früh geklickt (Rot)
    if (gameState.status === 'WAITING') {
        endRound(gameState, opponentId, 'FALSE START! Opponent +1');
        gameState.scores[opponentId]++; // Gegner kriegt Punkt
    } 
    // B) Richtig geklickt (Grün)
    else if (gameState.status === 'GREEN') {
        endRound(gameState, socketId, 'FASTEST FINGER!');
        gameState.scores[socketId]++;
    }
    // C) Falsch geklickt (Blau) - NEU
    else if (gameState.status === 'BLUE') {
        // Wer bei Blau klickt, wird bestraft
        gameState.scores[socketId]--; // Minuspunkt
        endRound(gameState, opponentId, 'TRICKED! -1 Point');
        // Runde endet zugunsten des Gegners (da man selbst raus ist)
    }
    
    checkWin(gameState);
};

const endRound = (gameState, winnerId, msg) => {
    gameState.status = 'RESULT';
    gameState.roundWinner = winnerId;
    gameState.message = msg;
    // Kurze Pause bis zur nächsten Runde
    gameState.resetTime = Date.now() + 2500;
};

const checkWin = (gameState) => {
    const p1 = gameState.players[0];
    const p2 = gameState.players[1];
    
    // Check auf Sieg (5 Punkte)
    if (gameState.scores[p1] >= WIN_SCORE) gameState.winner = p1;
    else if (gameState.scores[p2] >= WIN_SCORE) gameState.winner = p2;
};

module.exports = { createGameState, handleClick, updateLoop };