// server/games/battleship.js

const SHIPS = [
    { name: 'Carrier', size: 5, id: 'C' },
    { name: 'Battleship', size: 4, id: 'B' },
    { name: 'Cruiser', size: 3, id: 'R' },
    { name: 'Submarine', size: 3, id: 'S' },
    { name: 'Destroyer', size: 2, id: 'D' }
];

const createGameState = (users) => {
    return {
        phase: 'SETUP',
        currentPlayerIndex: 0,
        players: users.map(u => u.socketId),
        boards: {
            [users[0].socketId]: Array(10).fill(null).map(() => Array(10).fill(null)),
            [users[1].socketId]: Array(10).fill(null).map(() => Array(10).fill(null))
        },
        shots: {
            [users[0].socketId]: Array(10).fill(null).map(() => Array(10).fill(null)),
            [users[1].socketId]: Array(10).fill(null).map(() => Array(10).fill(null))
        },
        shipsSet: { [users[0].socketId]: false, [users[1].socketId]: false },
        winner: null,
        abilities: {
            [users[0].socketId]: { satellite: 2, torpedo: 4 },
            [users[1].socketId]: { satellite: 2, torpedo: 4 }
        }
    };
};

const placeShip = (gameState, socketId, { row, col, orientation }) => {
    const board = gameState.boards[socketId];
    
    // Welche Schiffe stehen schon auf dem Brett?
    const placedIds = new Set(board.flat().filter(cell => cell !== null));
    // Finde das erste Schiff aus der Liste, das noch NICHT auf dem Brett ist
    const nextShip = SHIPS.find(s => !placedIds.has(s.id));
    
    if (!nextShip) return false;

    const shipSize = nextShip.size;

    // Validierung
    for (let i = 0; i < shipSize; i++) {
        const r = orientation === 'H' ? row : row + i;
        const c = orientation === 'H' ? col + i : col;
        
        if (r >= 10 || c >= 10 || board[r][c] !== null) {
            return false; 
        }
    }

    // Platzieren
    for (let i = 0; i < shipSize; i++) {
        const r = orientation === 'H' ? row : row + i;
        const c = orientation === 'H' ? col + i : col;
        board[r][c] = nextShip.id;
    }
    return true;
};

// Hilfsfunktion: Prüft und markiert zerstörte Schiffe
const updateSunkShips = (enemyBoard, myShots) => {
    SHIPS.forEach(ship => {
        const shipCoords = [];
        for(let r=0; r<10; r++) {
            for(let c=0; c<10; c++) {
                if (enemyBoard[r][c] === ship.id) {
                    shipCoords.push({r, c});
                }
            }
        }

        if (shipCoords.length > 0) {
            const allHit = shipCoords.every(coord => 
                myShots[coord.r][coord.c] === 'HIT' || myShots[coord.r][coord.c] === 'SUNK'
            );

            if (allHit) {
                shipCoords.forEach(coord => {
                    myShots[coord.r][coord.c] = 'SUNK';
                });
            }
        }
    });
};

const checkWin = (board, shots) => {
    for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
            if (board[r][c] !== null && shots[r][c] !== 'HIT' && shots[r][c] !== 'SUNK') {
                return false; 
            }
        }
    }
    return true;
};

const handleAttack = (gameState, socketId, { row, col, type, axis }) => {
    const opponentId = gameState.players.find(id => id !== socketId);
    const enemyBoard = gameState.boards[opponentId];
    const myShots = gameState.shots[socketId];
    
    // Munition prüfen
    if (type !== 'normal') {
        if (gameState.abilities[socketId][type] <= 0) return gameState; 
        gameState.abilities[socketId][type]--;
    }

    let hitMade = false;

    if (type === 'satellite') {
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (r >= 0 && r < 10 && c >= 0 && c < 10) {
                    if (myShots[r][c] === null) {
                        myShots[r][c] = enemyBoard[r][c] !== null ? 'Tb_SHIP' : 'Tb_WATER'; 
                    }
                }
            }
        }
    } 
    else if (type === 'torpedo') {
        // --- HIER IST DIE ÄNDERUNG ---
        if (axis === 'row') {
            for (let c = 0; c < 10; c++) {
                // Prüfen ob Schiff da ist UND ob es nicht bereits gesunken ist
                if (enemyBoard[row][c] !== null) {
                    // Wenn das Schiff an dieser Stelle schon als 'SUNK' markiert ist -> Durchfliegen
                    if (myShots[row][c] === 'SUNK') {
                        continue; 
                    }

                    // Ansonsten: Treffer!
                    myShots[row][c] = 'HIT';
                    hitMade = true;
                    break; // Torpedo explodiert
                } else {
                    // Nur Wasser markieren, wenn wir nicht gerade durch ein Wrack geflogen sind
                    if (myShots[row][c] !== 'SUNK') {
                        myShots[row][c] = 'MISS';
                    }
                }
            }
        } else { // col
            for (let r = 0; r < 10; r++) {
                if (enemyBoard[r][col] !== null) {
                    if (myShots[r][col] === 'SUNK') {
                        continue; 
                    }

                    myShots[r][col] = 'HIT';
                    hitMade = true;
                    break;
                } else {
                    if (myShots[r][col] !== 'SUNK') {
                        myShots[r][col] = 'MISS';
                    }
                }
            }
        }
    }
    else { // Normaler Schuss
        const currentCell = myShots[row][col];
        if (currentCell === 'HIT' || currentCell === 'MISS' || currentCell === 'SUNK') return gameState; 

        if (enemyBoard[row][col] !== null) {
            myShots[row][col] = 'HIT';
            hitMade = true; 
        } else {
            myShots[row][col] = 'MISS';
        }
    }

    // Zerstörte Schiffe prüfen
    updateSunkShips(enemyBoard, myShots);

    if (checkWin(enemyBoard, myShots)) {
        gameState.winner = socketId;
    } else {
        if (!hitMade) {
            gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % 2;
        }
    }

    return gameState;
};

module.exports = { createGameState, placeShip, handleAttack, SHIPS };