// server/games/snake.js

const GRID_SIZE = 20;

const createGameState = (users) => {
    // Startpositionen: P1 links oben, P2 rechts unten
    const p1Start = [{ x: 2, y: 2 }, { x: 2, y: 1 }, { x: 2, y: 0 }]; // Kopf ist Index 0
    const p2Start = [{ x: 17, y: 17 }, { x: 17, y: 18 }, { x: 17, y: 19 }];

    return {
        players: users.map(u => u.socketId),
        snakes: {
            [users[0].socketId]: { body: p1Start, dir: { x: 0, y: 1 }, nextDir: { x: 0, y: 1 }, color: '#4dfff3', alive: true },
            [users[1].socketId]: { body: p2Start, dir: { x: 0, y: -1 }, nextDir: { x: 0, y: -1 }, color: '#ff5252', alive: true }
        },
        food: spawnFood(p1Start, p2Start),
        winner: null,
        gridSize: GRID_SIZE
    };
};

const spawnFood = (body1, body2) => {
    let valid = false;
    let x, y;
    while (!valid) {
        x = Math.floor(Math.random() * GRID_SIZE);
        y = Math.floor(Math.random() * GRID_SIZE);
        
        // Nicht auf Schlange spawnen
        const onS1 = body1.some(b => b.x === x && b.y === y);
        const onS2 = body2.some(b => b.x === x && b.y === y);
        if (!onS1 && !onS2) valid = true;
    }
    return { x, y };
};

const handleInput = (gameState, socketId, dir) => {
    if (gameState.winner) return;
    
    const snake = gameState.snakes[socketId];
    if (!snake || !snake.alive) return;

    // Verhindern, dass man direkt in die entgegengesetzte Richtung lenkt (Selbstmord)
    if (snake.dir.x === 1 && dir.x === -1) return;
    if (snake.dir.x === -1 && dir.x === 1) return;
    if (snake.dir.y === 1 && dir.y === -1) return;
    if (snake.dir.y === -1 && dir.y === 1) return;

    snake.nextDir = dir;
};

const updateLoop = (gameState) => {
    if (gameState.winner) return;

    const p1Id = gameState.players[0];
    const p2Id = gameState.players[1];
    const s1 = gameState.snakes[p1Id];
    const s2 = gameState.snakes[p2Id];

    // 1. Bewegung anwenden
    if (s1.alive) moveSnake(s1);
    if (s2.alive) moveSnake(s2);

    // 2. Kollisionen prüfen
    checkCollision(gameState, s1, s2, p1Id, p2Id);
    
    // 3. Fressen prüfen
    checkFood(gameState, s1);
    checkFood(gameState, s2);
};

const moveSnake = (snake) => {
    snake.dir = snake.nextDir;
    const head = snake.body[0];
    const newHead = { x: head.x + snake.dir.x, y: head.y + snake.dir.y };
    
    snake.body.unshift(newHead); // Neuer Kopf
    snake.body.pop(); // Schwanz entfernen (wird bei Essen korrigiert)
};

const checkCollision = (gameState, s1, s2, id1, id2) => {
    const head1 = s1.body[0];
    const head2 = s2.body[0];

    // Wand Kollision
    if (head1.x < 0 || head1.x >= GRID_SIZE || head1.y < 0 || head1.y >= GRID_SIZE) s1.alive = false;
    if (head2.x < 0 || head2.x >= GRID_SIZE || head2.y < 0 || head2.y >= GRID_SIZE) s2.alive = false;

    // Selbstkollision
    if (onBody(head1, s1.body, 1)) s1.alive = false; // Index 1 start, da 0 der Kopf ist
    if (onBody(head2, s2.body, 1)) s2.alive = false;

    // Gegnerkollision (Kopf in Körper des anderen)
    if (onBody(head1, s2.body, 0)) s1.alive = false;
    if (onBody(head2, s1.body, 0)) s2.alive = false;
    
    // Kopf-an-Kopf Crash (beide tot)
    if (head1.x === head2.x && head1.y === head2.y) {
        s1.alive = false;
        s2.alive = false;
    }

    // Gewinner ermitteln
    if (!s1.alive && !s2.alive) gameState.winner = "DRAW";
    else if (!s1.alive) gameState.winner = id2;
    else if (!s2.alive) gameState.winner = id1;
};

const checkFood = (gameState, snake) => {
    if (!snake.alive) return;
    const head = snake.body[0];
    
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
        // Wachsen: Schwanz verdoppeln (einfach letztes Element nochmal pushen, oder pop verhindern in move)
        // Einfacher: Wir fügen ein Element hinten an (an der alten Position, aber die haben wir gerade nicht).
        // Besser: Wir markieren "growing".
        // Simpleste Lösung für hier: Einfach letzte Position nochmal anhängen (wird im nächsten Frame glattgezogen)
        const tail = snake.body[snake.body.length - 1];
        snake.body.push({ ...tail });
        
        // Neues Essen
        const p1Body = gameState.snakes[gameState.players[0]].body;
        const p2Body = gameState.snakes[gameState.players[1]].body;
        gameState.food = spawnFood(p1Body, p2Body);
    }
};

const onBody = (pos, body, startIndex) => {
    for (let i = startIndex; i < body.length; i++) {
        if (pos.x === body[i].x && pos.y === body[i].y) return true;
    }
    return false;
};

module.exports = { createGameState, updateLoop, handleInput };