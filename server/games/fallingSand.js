// server/games/fallingSand.js

const GRID_SIZE = 12;
const DECAY_TIME = 2000; // 2 Sekunden bis der Block weg ist

const createGameState = (users) => {
    // 2 Ebenen erstellen. 0 = Oben, 1 = Unten
    // Zustand: 0 = Stabil, 1 = Wackelt (Timer läuft), 2 = Loch
    const layers = [
        Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill({ state: 0, triggerTime: 0 })),
        Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill({ state: 0, triggerTime: 0 }))
    ];

    return {
        players: users.map((u, index) => ({
            id: u.socketId,
            x: index === 0 ? 2 : 9, // Startpositionen
            y: index === 0 ? 2 : 9,
            layer: 0, // Alle starten oben
            alive: true,
            color: index === 0 ? '#4dfff3' : '#e94560'
        })),
        layers: layers, // Das Spielfeld
        winner: null,
        dimensions: { size: GRID_SIZE }
    };
};

const handleInput = (gameState, socketId, direction) => {
    if (gameState.winner) return;
    
    const player = gameState.players.find(p => p.id === socketId);
    if (!player || !player.alive) return;

    // Zielkoordinaten
    let nx = player.x;
    let ny = player.y;

    if (direction === 'UP') ny -= 1;
    if (direction === 'DOWN') ny += 1;
    if (direction === 'LEFT') nx -= 1;
    if (direction === 'RIGHT') nx += 1;

    // Grenzen prüfen
    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
        player.x = nx;
        player.y = ny;
        
        // Block aktivieren (Trigger Decay)
        triggerTile(gameState, player.layer, nx, ny);
    }
};

const triggerTile = (gameState, layerIdx, x, y) => {
    const tile = gameState.layers[layerIdx][y][x];
    // Nur aktivieren, wenn er noch stabil ist
    if (tile.state === 0) {
        // Wir müssen ein neues Objekt erstellen, um State Mutation für React/Socket korrekt zu haben
        gameState.layers[layerIdx][y][x] = {
            state: 1, // Warning
            triggerTime: Date.now() + DECAY_TIME
        };
    }
};

const updateLoop = (gameState) => {
    if (gameState.winner) return;

    const now = Date.now();

    // 1. Tiles aktualisieren (Zerfallen lassen)
    for (let l = 0; l < 2; l++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const tile = gameState.layers[l][y][x];
                if (tile.state === 1 && now >= tile.triggerTime) {
                    // Block wird zum Loch
                    gameState.layers[l][y][x] = { ...tile, state: 2 };
                }
            }
        }
    }

    // 2. Spieler Physik (Fallen)
    gameState.players.forEach(p => {
        if (!p.alive) return;

        // Auf welchem Tile steht er?
        // Achtung: Wenn er schon gefallen ist (layer > 1), ist er tot
        if (p.layer > 1) return;

        const currentTile = gameState.layers[p.layer][p.y][p.x];

        // Wenn das Tile unter ihm ein Loch ist (state 2)
        if (currentTile.state === 2) {
            p.layer += 1; // Fall eine Ebene tiefer
            
            // Wenn er jetzt ganz unten rausgefallen ist (Layer index 2 gibt es nicht)
            if (p.layer > 1) {
                p.alive = false;
                // Der ANDERE hat gewonnen
                const winner = gameState.players.find(other => other.id !== p.id);
                if (winner) gameState.winner = winner.id;
            } else {
                // Er ist auf Ebene 1 gelandet. 
                // Sofort den Block dort triggern, auf dem er gelandet ist!
                triggerTile(gameState, p.layer, p.x, p.y);
            }
        } else {
            // Er steht auf festem oder wackelndem Boden.
            // Sicherstellen, dass der Block getriggert ist (falls er drauf stehen bleibt)
            triggerTile(gameState, p.layer, p.x, p.y);
        }
    });
};

module.exports = { createGameState, handleInput, updateLoop };