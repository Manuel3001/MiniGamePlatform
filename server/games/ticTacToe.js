// server/games/ticTacToe.js

const createGameState = (users) => {
    return {
        board: Array(10).fill(null).map(() => Array(10).fill(null)), // 10x10 Grid
        currentPlayerIndex: 0, // 0 = Spieler 1, 1 = Spieler 2
        players: users.map(u => u.socketId), // Wer spielt mit?
        symbols: { [users[0].socketId]: 'X', [users[1].socketId]: 'O' },
        winner: null,
        isDraw: false
    };
};

const checkWin = (board, row, col, symbol) => {
    const directions = [
        [0, 1],  // Horizontal
        [1, 0],  // Vertikal
        [1, 1],  // Diagonal \
        [1, -1]  // Diagonal /
    ];

    for (let [dx, dy] of directions) {
        let count = 1;

        // In eine Richtung schauen
        for (let i = 1; i < 5; i++) {
            const r = row + dy * i;
            const c = col + dx * i;
            if (r >= 0 && r < 10 && c >= 0 && c < 10 && board[r][c] === symbol) count++;
            else break;
        }

        // In die entgegengesetzte Richtung schauen
        for (let i = 1; i < 5; i++) {
            const r = row - dy * i;
            const c = col - dx * i;
            if (r >= 0 && r < 10 && c >= 0 && c < 10 && board[r][c] === symbol) count++;
            else break;
        }

        if (count >= 5) return true;
    }
    return false;
};

const handleMove = (gameState, socketId, moveData) => {
    const { row, col } = moveData;
    
    // Prüfungen: Ist der Spieler dran? Ist das Feld leer? Gibt es schon einen Sieger?
    const playerSocket = gameState.players[gameState.currentPlayerIndex];
    if (socketId !== playerSocket || gameState.winner || gameState.board[row][col]) {
        return gameState; // Ungültiger Zug -> Nichts ändern
    }

    const symbol = gameState.symbols[socketId];
    
    // Zug setzen
    gameState.board[row][col] = symbol;

    // Auf Sieg prüfen
    if (checkWin(gameState.board, row, col, symbol)) {
        gameState.winner = socketId;
    } else {
        // Unentschieden prüfen (Board voll)
        const isFull = gameState.board.every(row => row.every(cell => cell !== null));
        if (isFull) gameState.isDraw = true;
        
        // Nächster Spieler
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % 2;
    }

    return gameState;
};

module.exports = { createGameState, handleMove };