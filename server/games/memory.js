// server/games/memory.js

const GRID_ROWS = 6;
const GRID_COLS = 6;
// Unicode Icons für maximale Kompatibilität
const ICONS = [
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊",
    "🐻", "🐼", "🐨", "🐯", "🦁", "🐮",
    "🐷", "🐸", "🐵", "🐔", "🐧", "🐦"
];

const createGameState = (users) => {
    // Karten mischen
    let deck = [...ICONS, ...ICONS]; // Verdoppeln für Paare
    deck = deck.sort(() => Math.random() - 0.5);

    const cards = deck.map((icon, index) => ({
        id: index,
        icon: icon,
        isFlipped: false,
        isMatched: false,
        owner: null
    }));

    return {
        players: users.map(u => u.socketId),
        scores: { [users[0].socketId]: 0, [users[1].socketId]: 0 },
        cards: cards,
        turnIndex: 0,
        flippedCards: [],
        isWaiting: false,
        resetTime: null, // Zeitstempel für das automatische Zudecken
        winner: null
    };
};

const handleFlip = (gameState, socketId, cardId) => {
    if (gameState.winner || gameState.isWaiting) return;

    const activePlayer = gameState.players[gameState.turnIndex];
    if (socketId !== activePlayer) return;

    const card = gameState.cards[cardId];
    if (card.isMatched || card.isFlipped) return;

    // Karte aufdecken
    card.isFlipped = true;
    gameState.flippedCards.push(cardId);

    // Wenn 2 Karten offen sind, prüfen
    if (gameState.flippedCards.length === 2) {
        const id1 = gameState.flippedCards[0];
        const id2 = gameState.flippedCards[1];
        const c1 = gameState.cards[id1];
        const c2 = gameState.cards[id2];

        if (c1.icon === c2.icon) {
            // MATCH!
            c1.isMatched = true;
            c2.isMatched = true;
            c1.owner = socketId;
            c2.owner = socketId;

            gameState.scores[socketId]++;
            gameState.flippedCards = []; // Reset für nächsten Zug (gleicher Spieler)

            checkWinner(gameState);
        } else {
            // KEIN MATCH
            // WICHTIG: Wir blockieren Inputs und setzen einen Timer für den Loop
            gameState.isWaiting = true;
            gameState.resetTime = Date.now() + 1500; // 1.5 Sekunden warten, dann zudecken
        }
    }
};

const updateLoop = (gameState) => {
    if (gameState.winner) return;

    // Prüfen ob Karten zugedeckt werden müssen (nach Fehlversuch)
    if (gameState.isWaiting && gameState.resetTime && Date.now() > gameState.resetTime) {
        const id1 = gameState.flippedCards[0];
        const id2 = gameState.flippedCards[1];

        // Karten wieder zudecken
        if (gameState.cards[id1]) gameState.cards[id1].isFlipped = false;
        if (gameState.cards[id2]) gameState.cards[id2].isFlipped = false;

        // Reset
        gameState.flippedCards = [];
        gameState.isWaiting = false;
        gameState.resetTime = null;

        // Zugwechsel erst JETZT, nachdem zugedeckt wurde
        gameState.turnIndex = (gameState.turnIndex + 1) % 2;
    }
};

const checkWinner = (gameState) => {
    const totalPairs = ICONS.length;
    const p1 = gameState.players[0];
    const p2 = gameState.players[1];
    const s1 = gameState.scores[p1];
    const s2 = gameState.scores[p2];

    if (s1 + s2 === totalPairs) {
        if (s1 > s2) gameState.winner = p1;
        else if (s2 > s1) gameState.winner = p2;
        else gameState.winner = "DRAW";
    }
};

module.exports = { createGameState, handleFlip, updateLoop };