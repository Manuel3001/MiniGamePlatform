const rooms = {};

// joinRoom nun mit createSettings Parameter
function joinRoom(roomId, user, socketId, createSettings = {}) {
    if (!rooms[roomId]) {
        // Raum erstellen
        rooms[roomId] = {
            id: roomId,
            users: [],
            messages: [],
            gameSelections: {}, 
            // Hier speichern wir die Settings vom Ersteller
            settings: { 
                isPrivate: createSettings.isPrivate || false,
                creatorGames: createSettings.initialGames || [] 
            } 
        };
    }

    const room = rooms[roomId];
    const existingUser = room.users.find(u => u.socketId === socketId);
    
    if (!existingUser && room.users.length < 2) {
        room.users.push({
            socketId,
            username: user.username,
            avatar: user.avatar,
            points: 0,
            isReady: false
        });
    }

    return room;
}

function leaveRoom(socketId) {
    let affectedRoomId = null;
    let affectedRoom = null;

    for (const roomId in rooms) {
        const room = rooms[roomId];
        const index = room.users.findIndex(u => u.socketId === socketId);
        
        if (index !== -1) {
            room.users.splice(index, 1); 
            delete room.gameSelections[socketId]; 
            affectedRoomId = roomId;
            affectedRoom = room;

            // Wenn Raum leer ist, löschen
            if (room.users.length === 0) {
                delete rooms[roomId];
                return { roomId: roomId, room: null }; // Raum gelöscht
            }
            break;
        }
    }
    return { roomId: affectedRoomId, room: affectedRoom };
}

function getRoom(roomId) {
    return rooms[roomId];
}

function updateGameSelection(roomId, socketId, gameId) {
    if (rooms[roomId]) {
        rooms[roomId].gameSelections[socketId] = gameId;
        return rooms[roomId];
    }
    return null;
}

function toggleReady(roomId, socketId) {
    if (rooms[roomId]) {
        const user = rooms[roomId].users.find(u => u.socketId === socketId);
        if (user) {
            user.isReady = !user.isReady;
        }
        return rooms[roomId];
    }
    return null;
}

// Punkte verteilen
function addGameXP(roomId, winnerSocketId, loserSocketId) {
    const room = rooms[roomId];
    if (!room) return null;

    const winner = room.users.find(u => u.socketId === winnerSocketId);
    const loser = room.users.find(u => u.socketId === loserSocketId); 

    if (winner) winner.points += 1000;
    if (loser) loser.points += 100;
    
    return room;
}

// Liste aller Lobbies für JoinLobbyPage
function getAllLobbies() {
    return Object.values(rooms).map(r => {
        const creator = r.users[0];
        return {
            id: r.id,
            userCount: r.users.length,
            creatorName: creator ? creator.username : "Unknown",
            settings: r.settings || { isPrivate: false, creatorGames: [] } // Fallback
        };
    });
}

module.exports = { 
    joinRoom, 
    leaveRoom, 
    getRoom, 
    updateGameSelection, 
    toggleReady, 
    addGameXP, 
    getAllLobbies 
};