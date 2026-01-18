// server/games/wordSearch.js

const GRID_SIZE = 15; // <--- Geändert von 20 auf 15
const DURATION = 30; 
const WORD_LIST = [
    "REACT", "SOCKET", "NODE", "SERVER", "CLIENT", "HOOK", "STATE", "PROPS",
    "LINUX", "JAVA", "PYTHON", "HTML", "CSS", "DESIGN", "LOGIC", "MOUSE",
    "KEYBOARD", "SCREEN", "CODE", "BUG", "DATA", "WIFI", "CLOUD", "API"
];

const createGameState = (users) => {
    // Gitter generieren
    const { grid, hiddenWords } = generateGrid(WORD_LIST, GRID_SIZE);

    return {
        players: users.map(u => u.socketId),
        scores: { [users[0].socketId]: 0, [users[1].socketId]: 0 },
        timeLeft: DURATION,
        
        grid: grid, 
        hiddenWords: hiddenWords, 
        
        foundWords: {}, 
        
        winner: null
    };
};

const generateGrid = (words, size) => {
    let grid = Array(size).fill(null).map(() => Array(size).fill(''));
    let hiddenWords = {};

    // Wörter platzieren
    for (let word of words) {
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 100) {
            const dir = Math.floor(Math.random() * 3); // 0=H, 1=V, 2=Diagonal
            const len = word.length;
            let row, col, dr = 0, dc = 0;

            if (dir === 0) { // Horizontal
                row = Math.floor(Math.random() * size);
                col = Math.floor(Math.random() * (size - len));
                dr = 0; dc = 1;
            } else if (dir === 1) { // Vertikal
                row = Math.floor(Math.random() * (size - len));
                col = Math.floor(Math.random() * size);
                dr = 1; dc = 0;
            } else { // Diagonal
                row = Math.floor(Math.random() * (size - len));
                col = Math.floor(Math.random() * (size - len));
                dr = 1; dc = 1;
            }

            // Check ob Platz frei
            let fits = true;
            for (let i = 0; i < len; i++) {
                const cell = grid[row + i * dr][col + i * dc];
                if (cell !== '' && cell !== word[i]) {
                    fits = false; break;
                }
            }

            if (fits) {
                for (let i = 0; i < len; i++) {
                    grid[row + i * dr][col + i * dc] = word[i];
                }
                hiddenWords[word] = { 
                    start: {x: col, y: row}, 
                    end: {x: col + (len-1)*dc, y: row + (len-1)*dr} 
                };
                placed = true;
            }
            attempts++;
        }
    }

    // Rest auffüllen
    const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for(let r=0; r<size; r++){
        for(let c=0; c<size; c++){
            if(grid[r][c] === '') grid[r][c] = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
        }
    }

    return { grid, hiddenWords };
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

const handleSelection = (gameState, socketId, selection) => {
    if (gameState.winner) return;
    
    const { start, end } = selection;
    const dx = Math.sign(end.x - start.x);
    const dy = Math.sign(end.y - start.y);
    
    const isHorz = start.y === end.y;
    const isVert = start.x === end.x;
    const isDiag = Math.abs(end.x - start.x) === Math.abs(end.y - start.y);

    if (!isHorz && !isVert && !isDiag) return;

    let word = "";
    let x = start.x;
    let y = start.y;
    
    const len = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) + 1;
    
    for(let i=0; i<len; i++) {
        word += gameState.grid[y][x];
        x += dx;
        y += dy;
    }
    
    const reversed = word.split("").reverse().join("");
    
    let foundKey = null;
    if (gameState.hiddenWords[word]) foundKey = word;
    else if (gameState.hiddenWords[reversed]) foundKey = reversed;

    if (foundKey) {
        if (!gameState.foundWords[foundKey]) {
            gameState.foundWords[foundKey] = socketId;
            gameState.scores[socketId]++;
        }
    }
};

module.exports = { createGameState, updateLoop, handleSelection };