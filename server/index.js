const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// --- SPIELE IMPORTE ---
const ticTacToe = require('./games/ticTacToe');
const battleship = require('./games/battleship');
const pingPong = require('./games/pingPong');
const tankDuel = require('./games/tankDuel');
const sumo = require('./games/sumo');
const hurdles = require('./games/hurdles');
const archery = require('./games/archery');
const airhockey = require('./games/airhockey');
const reaction = require('./games/reaction');
const balloons = require('./games/balloons');
const fallingSand = require('./games/fallingSand');
const cityCountryRiver = require('./games/cityCountryRiver');
const wordSnake = require('./games/wordSnake');
const hangman = require('./games/hangman'); // <--- WICHTIG: Hangman Import
const wordSearch = require('./games/wordSearch');
const memory = require('./games/memory');
const snake = require('./games/snake');
const colorMatch = require('./games/colorMatch');
const anagramHunt = require('./games/anagramHunt');
const quickQuiz = require('./games/quickQuiz');
const patternDuel = require('./games/patternDuel');
const catapult = require('./games/catapult');
const bombPass = require('./games/bombPass');

// RoomStore
const { joinRoom, leaveRoom, updateGameSelection, toggleReady, getAllLobbies, getRoom, addGameXP } = require('./roomStore');

const app = express();
app.use(cors());

const server = http.createServer(app);
// ÄNDERUNG 2:
const io = new Server(server, {
    cors: {
        // Das Sternchen "*" bedeutet: "Erlaube Zugriff von JEDER Webseite".
        // Das ist wichtig, weil dein Frontend auf Vercel laufen wird.
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

const activeGames = {};

const broadcastLobbyList = () => io.emit("lobbies_update", getAllLobbies());

const cleanupGame = (roomId) => {
    if (activeGames[roomId]) {
        if (activeGames[roomId].interval) clearInterval(activeGames[roomId].interval);
        delete activeGames[roomId];
    }
};

// Safe Send (Interval entfernen)
const sendGameUpdate = (roomId, gameState) => {
    if (!gameState) return;
    const { interval, ...safeState } = gameState;
    io.to(roomId).emit("game_update", safeState);
};

io.on('connection', (socket) => {
    // Lobby Logik
    socket.on("request_lobbies", () => socket.emit("lobbies_update", getAllLobbies()));

    socket.on("join_room", (data) => {
        const updatedRoom = joinRoom(data.roomId, data.user, socket.id, data.createSettings);
        socket.join(data.roomId);
        io.to(data.roomId).emit("room_update", updatedRoom);
        broadcastLobbyList();
    });

    socket.on("send_message", (data) => io.to(data.roomId).emit("receive_message", data));

    socket.on("select_game", ({ roomId, gameId }) => {
        const updatedRoom = updateGameSelection(roomId, socket.id, gameId);
        if (updatedRoom) {
            io.to(roomId).emit("room_update", updatedRoom);
            broadcastLobbyList();
        }
    });

    socket.on("player_ready", ({ roomId }) => {
        const updatedRoom = toggleReady(roomId, socket.id);
        if (updatedRoom) {
            io.to(roomId).emit("room_update", updatedRoom);
            const allReady = updatedRoom.users.length === 2 && updatedRoom.users.every(u => u.isReady);

            if (allReady) {
                const hostSocketId = updatedRoom.users[0].socketId;
                const selectedGameId = updatedRoom.gameSelections[hostSocketId];
                let gameId = selectedGameId !== undefined ? parseInt(selectedGameId) : 0;

                let initialGameState = null;
                let intervalId = null;

                // --- GAME FACTORY ---
                if (gameId === 0) {
                    initialGameState = ticTacToe.createGameState(updatedRoom.users);
                    initialGameState.type = 'TICTACTOE';
                }
                else if (gameId === 1) {
                    initialGameState = battleship.createGameState(updatedRoom.users);
                    initialGameState.type = 'BATTLESHIP';
                }
                else if (gameId === 2) {
                    initialGameState = pingPong.createGameState(updatedRoom.users);
                    initialGameState.type = 'PINGPONG';
                    intervalId = setInterval(() => {
                        const g = activeGames[roomId];
                        if (g && g.type === 'PINGPONG') {
                            pingPong.updatePhysics(g);
                            sendGameUpdate(roomId, g);
                            if (g.winner) { clearInterval(intervalId); handleGameEnd(roomId, g, g.players); }
                        } else clearInterval(intervalId);
                    }, 33);
                }
                else if (gameId === 3) {
                    initialGameState = tankDuel.createGameState(updatedRoom.users);
                    initialGameState.type = 'TANKDUEL';
                    intervalId = setInterval(() => {
                        const g = activeGames[roomId];
                        if (g && g.type === 'TANKDUEL') {
                            tankDuel.updatePhysics(g);
                            sendGameUpdate(roomId, g);
                            if (g.winner) { clearInterval(intervalId); handleGameEnd(roomId, g, g.players); }
                        } else clearInterval(intervalId);
                    }, 33);
                }
                else if (gameId === 4) {
                    initialGameState = sumo.createGameState(updatedRoom.users);
                    initialGameState.type = 'SUMO';
                    intervalId = setInterval(() => {
                        const g = activeGames[roomId];
                        if (g && g.type === 'SUMO') {
                            sumo.updatePhysics(g);
                            sendGameUpdate(roomId, g);
                            if (g.winner) { clearInterval(intervalId); handleGameEnd(roomId, g, g.players); }
                        } else clearInterval(intervalId);
                    }, 33);
                }
                else if (gameId === 5) {
                    initialGameState = hurdles.createGameState(updatedRoom.users);
                    initialGameState.type = 'HURDLES';
                    intervalId = setInterval(() => {
                        const g = activeGames[roomId];
                        if (g && g.type === 'HURDLES') {
                            hurdles.updatePhysics(g);
                            sendGameUpdate(roomId, g);
                            if (g.winner) { clearInterval(intervalId); handleGameEnd(roomId, g, g.players); }
                        } else clearInterval(intervalId);
                    }, 33);
                }
                else if (gameId === 6) {
                    initialGameState = archery.createGameState(updatedRoom.users);
                    initialGameState.type = 'ARCHERY';
                }
                else if (gameId === 7) {
                    initialGameState = airhockey.createGameState(updatedRoom.users);
                    initialGameState.type = 'AIRHOCKEY';
                    intervalId = setInterval(() => {
                        const g = activeGames[roomId];
                        if (g && g.type === 'AIRHOCKEY') {
                            airhockey.updatePhysics(g);
                            sendGameUpdate(roomId, g);
                            if (g.winner) { clearInterval(intervalId); handleGameEnd(roomId, g, g.players); }
                        } else clearInterval(intervalId);
                    }, 33);
                }
                else if (gameId === 8) {
                    initialGameState = reaction.createGameState(updatedRoom.users);
                    initialGameState.type = 'REACTION';
                    intervalId = setInterval(() => {
                        const g = activeGames[roomId];
                        if (g && g.type === 'REACTION') {
                            reaction.updateLoop(g);
                            sendGameUpdate(roomId, g);
                            if (g.winner) { clearInterval(intervalId); handleGameEnd(roomId, g, g.players); }
                        } else clearInterval(intervalId);
                    }, 50);
                }
                else if (gameId === 9) {
                    initialGameState = balloons.createGameState(updatedRoom.users);
                    initialGameState.type = 'BALLOONS';
                    intervalId = setInterval(() => {
                        const g = activeGames[roomId];
                        if (g && g.type === 'BALLOONS') {
                            balloons.updateLoop(g);
                            sendGameUpdate(roomId, g);
                            if (g.winner) { clearInterval(intervalId); handleGameEnd(roomId, g, g.players); }
                        } else clearInterval(intervalId);
                    }, 33);
                }
                else if (gameId === 10) {
                    initialGameState = fallingSand.createGameState(updatedRoom.users);
                    initialGameState.type = 'FALLINGSAND';
                    intervalId = setInterval(() => {
                        const g = activeGames[roomId];
                        if (g && g.type === 'FALLINGSAND') {
                            fallingSand.updateLoop(g);
                            sendGameUpdate(roomId, g);
                            if (g.winner) { clearInterval(intervalId); handleGameEnd(roomId, g, g.players); }
                        } else clearInterval(intervalId);
                    }, 100);
                }
                else if (gameId === 11) {
                    initialGameState = cityCountryRiver.createGameState(updatedRoom.users);
                    initialGameState.type = 'CITYCOUNTRY';
                    intervalId = setInterval(() => {
                        const g = activeGames[roomId];
                        if (g && g.type === 'CITYCOUNTRY') {
                            cityCountryRiver.updateLoop(g);
                            sendGameUpdate(roomId, g);
                            if (g.winner) { clearInterval(intervalId); handleGameEnd(roomId, g, g.players); }
                        } else clearInterval(intervalId);
                    }, 100);
                }
                else if (gameId === 12) {
                    initialGameState = wordSnake.createGameState(updatedRoom.users);
                    initialGameState.type = 'WORDSNAKE';
                    intervalId = setInterval(() => {
                        const g = activeGames[roomId];
                        if (g && g.type === 'WORDSNAKE') {
                            wordSnake.updateLoop(g);
                            sendGameUpdate(roomId, g);
                            if (g.winner) { clearInterval(intervalId); handleGameEnd(roomId, g, g.players); }
                        } else clearInterval(intervalId);
                    }, 100);
                }
                else if (gameId === 13) { // --- HANGMAN (NEU) ---
                    initialGameState = hangman.createGameState(updatedRoom.users);
                    initialGameState.type = 'HANGMAN';
                    // Kein Loop nötig, da rundenbasiert, aber wir senden initial
                }

                else if (gameId === 14) { // --- WORD SEARCH (NEU) ---
                    initialGameState = wordSearch.createGameState(updatedRoom.users);
                    initialGameState.type = 'WORDSEARCH';
                    intervalId = setInterval(() => {
                        const g = activeGames[roomId];
                        if (g && g.type === 'WORDSEARCH') {
                            wordSearch.updateLoop(g);
                            sendGameUpdate(roomId, g);
                            if (g.winner) { clearInterval(intervalId); handleGameEnd(roomId, g, g.players); }
                        } else clearInterval(intervalId);
                    }, 100);
                }
                else if (gameId === 15) { // --- MEMORY (NEU) ---
                    initialGameState = memory.createGameState(updatedRoom.users);
                    initialGameState.type = 'MEMORY';
                    intervalId = setInterval(() => {
                        const g = activeGames[roomId];
                        if (g && g.type === 'MEMORY') {
                            memory.updateLoop(g);
                            // Wichtig: Wir senden Updates regelmäßig, damit das "Zudecken" ankommt
                            sendGameUpdate(roomId, g);
                            if (g.winner) { clearInterval(intervalId); handleGameEnd(roomId, g, g.players); }
                        } else clearInterval(intervalId);
                    }, 100);
                }

                else if (gameId === 16) { // --- SNAKE (NEU) ---
                    initialGameState = snake.createGameState(updatedRoom.users);
                    initialGameState.type = 'SNAKE';
                    intervalId = setInterval(() => {
                        const g = activeGames[roomId];
                        if (g && g.type === 'SNAKE') {
                            snake.updateLoop(g);
                            sendGameUpdate(roomId, g);
                            if (g.winner) { clearInterval(intervalId); handleGameEnd(roomId, g, g.players); }
                        } else clearInterval(intervalId);
                    }, 150); // Speed: Alle 150ms ein Schritt
                }

                else if (gameId === 17) { // --- COLOR MATCH (NEU) ---
                    initialGameState = colorMatch.createGameState(updatedRoom.users);
                    initialGameState.type = 'COLORMATCH';
                    intervalId = setInterval(() => {
                        const g = activeGames[roomId];
                        if (g && g.type === 'COLORMATCH') {
                            colorMatch.updateLoop(g);
                            sendGameUpdate(roomId, g);
                            if (g.winner) { clearInterval(intervalId); handleGameEnd(roomId, g, g.players); }
                        } else clearInterval(intervalId);
                    }, 100);
                }

                else if (gameId === 18) { // --- ANAGRAM HUNT (NEU) ---
                    initialGameState = anagramHunt.createGameState(updatedRoom.users);
                    initialGameState.type = 'ANAGRAM';
                    intervalId = setInterval(() => {
                        const g = activeGames[roomId];
                        if (g && g.type === 'ANAGRAM') {
                            anagramHunt.updateLoop(g);
                            sendGameUpdate(roomId, g);
                            if (g.winner) { clearInterval(intervalId); handleGameEnd(roomId, g, g.players); }
                        } else clearInterval(intervalId);
                    }, 100);
                }

                else if (gameId === 19) { // --- QUICK QUIZ (NEU) ---
                    initialGameState = quickQuiz.createGameState(updatedRoom.users);
                    initialGameState.type = 'QUIZ';
                    intervalId = setInterval(() => {
                        const g = activeGames[roomId];
                        if (g && g.type === 'QUIZ') {
                            quickQuiz.updateLoop(g);
                            sendGameUpdate(roomId, g);
                            if (g.winner) { clearInterval(intervalId); handleGameEnd(roomId, g, g.players); }
                        } else clearInterval(intervalId);
                    }, 100);
                }

                else if (gameId === 20) { // PATTERN DUEL
                    initialGameState = patternDuel.createGameState(updatedRoom.users);
                    initialGameState.type = 'PATTERN';
                }
                else if (gameId === 21) { // CATAPULT
                    initialGameState = catapult.createGameState(updatedRoom.users);
                    initialGameState.type = 'CATAPULT';
                    intervalId = setInterval(() => {
                        const g = activeGames[roomId];
                        if (g && g.type === 'CATAPULT') {
                            catapult.updateLoop(g);
                            sendGameUpdate(roomId, g);
                            if (g.winner) { clearInterval(intervalId); handleGameEnd(roomId, g, g.players); }
                        } else clearInterval(intervalId);
                    }, 50); // Physik Loop
                }
                else if (gameId === 22) { // BOMB PASS
                    initialGameState = bombPass.createGameState(updatedRoom.users);
                    initialGameState.type = 'BOMB';
                    intervalId = setInterval(() => {
                        const g = activeGames[roomId];
                        if (g && g.type === 'BOMB') {
                            bombPass.updateLoop(g);
                            // WICHTIG: explosionTime nicht an Client senden, um Cheaten zu verhindern?
                            // Wir senden es, damit der Client ticken kann, aber manipulieren es leicht oder Client zeigt nur Ticken an.
                            // Einfacher: Wir senden alles.
                            sendGameUpdate(roomId, g);
                            if (g.winner) { clearInterval(intervalId); handleGameEnd(roomId, g, g.players); }
                        } else clearInterval(intervalId);
                    }, 100);
                }

                if (intervalId) initialGameState.interval = intervalId;
                activeGames[roomId] = initialGameState;

                // Initial Send
                const { interval, ...safeInitialState } = initialGameState;
                io.to(roomId).emit("game_started", { gameId, gameState: safeInitialState });
            }
        }
    });

    // --- EVENT HANDLERS ---

    // Login
    socket.on("login_user", (userData) => {
        // Nur Logging, da User-Objekt eh bei join_room mitkommt
        // console.log("Login:", userData);
    });

    // 0: TicTacToe
    socket.on("make_move", (d) => { if (activeGames[d.roomId]?.type === 'TICTACTOE') { const n = ticTacToe.handleMove(activeGames[d.roomId], socket.id, d.moveData); sendGameUpdate(d.roomId, n); if (n.winner || n.isDraw) handleGameEnd(d.roomId, n, activeGames[d.roomId].players); } });

    // 1: Battleship
    socket.on("battleship_place_ship", (d) => { if (activeGames[d.roomId]?.type === 'BATTLESHIP' && battleship.placeShip(activeGames[d.roomId], socket.id, d.placement)) sendGameUpdate(d.roomId, activeGames[d.roomId]); });
    socket.on("battleship_finalize_setup", (d) => { const g = activeGames[d.roomId]; if (g) { g.shipsSet[socket.id] = true; if (Object.values(g.shipsSet).every(v => v)) g.phase = 'PLAYING'; sendGameUpdate(d.roomId, g); } });
    socket.on("battleship_attack", (d) => { if (activeGames[d.roomId]?.type === 'BATTLESHIP') { const n = battleship.handleAttack(activeGames[d.roomId], socket.id, d.attackData); sendGameUpdate(d.roomId, n); if (n.winner) handleGameEnd(d.roomId, n, activeGames[d.roomId].players); } });

    // 2-7: Action Games
    socket.on("pingpong_move", (d) => { if (activeGames[d.roomId]?.type === 'PINGPONG') pingPong.movePaddle(activeGames[d.roomId], socket.id, d.direction); });
    socket.on("tank_input", (d) => { if (activeGames[d.roomId]?.type === 'TANKDUEL') tankDuel.handleInput(activeGames[d.roomId], socket.id, d.vector); });
    socket.on("tank_shoot", (d) => { if (activeGames[d.roomId]?.type === 'TANKDUEL') tankDuel.handleShoot(activeGames[d.roomId], socket.id); });
    socket.on("sumo_input", (d) => { if (activeGames[d.roomId]?.type === 'SUMO') sumo.handleInput(activeGames[d.roomId], socket.id, d.vector); });
    socket.on("sumo_mash", (d) => { if (activeGames[d.roomId]?.type === 'SUMO') sumo.handleMash(activeGames[d.roomId], socket.id); });
    socket.on("hurdles_run", (d) => { if (activeGames[d.roomId]?.type === 'HURDLES') hurdles.handleRun(activeGames[d.roomId], socket.id); });
    socket.on("hurdles_jump", (d) => { if (activeGames[d.roomId]?.type === 'HURDLES') hurdles.handleJump(activeGames[d.roomId], socket.id); });
    socket.on("archery_shoot", (d) => { if (activeGames[d.roomId]?.type === 'ARCHERY') { archery.handleShoot(activeGames[d.roomId], socket.id, d.shotData); sendGameUpdate(d.roomId, activeGames[d.roomId]); if (activeGames[d.roomId].winner) handleGameEnd(d.roomId, activeGames[d.roomId], activeGames[d.roomId].players); } });
    socket.on("airhockey_move", (d) => { if (activeGames[d.roomId]?.type === 'AIRHOCKEY') airhockey.handleInput(activeGames[d.roomId], socket.id, d.pos); });

    // 8-10: Reaction, Balloons, Sand
    socket.on("reaction_click", (d) => { if (activeGames[d.roomId]?.type === 'REACTION') { reaction.handleClick(activeGames[d.roomId], socket.id); sendGameUpdate(d.roomId, activeGames[d.roomId]); if (activeGames[d.roomId].winner) handleGameEnd(d.roomId, activeGames[d.roomId], activeGames[d.roomId].players); } });
    socket.on("balloon_click", (d) => { if (activeGames[d.roomId]?.type === 'BALLOONS') { balloons.handleClick(activeGames[d.roomId], socket.id, d.pos); sendGameUpdate(d.roomId, activeGames[d.roomId]); if (activeGames[d.roomId].winner) handleGameEnd(d.roomId, activeGames[d.roomId], activeGames[d.roomId].players); } });
    socket.on("fallingsand_move", (d) => { const g = activeGames[d.roomId]; if (g && g.type === 'FALLINGSAND') fallingSand.handleInput(g, socket.id, d.direction); });

    // 11: City Country River
    socket.on("city_submit", (d) => { const g = activeGames[d.roomId]; if (g && g.type === 'CITYCOUNTRY') { cityCountryRiver.handleInput(g, socket.id, d.inputs); sendGameUpdate(d.roomId, g); } });
    socket.on("city_review", (d) => { const g = activeGames[d.roomId]; if (g && g.type === 'CITYCOUNTRY') { cityCountryRiver.handleReview(g, socket.id, d.reviewData); sendGameUpdate(d.roomId, g); } });
    socket.on("city_next", (d) => { const g = activeGames[d.roomId]; if (g && g.type === 'CITYCOUNTRY') { cityCountryRiver.nextRound(g); sendGameUpdate(d.roomId, g); if (g.winner) handleGameEnd(d.roomId, g, g.players); } });

    // 12: Word Snake
    socket.on("word_submit", (d) => { const g = activeGames[d.roomId]; if (g && g.type === 'WORDSNAKE') { wordSnake.handleInput(g, socket.id, d.word); sendGameUpdate(d.roomId, g); if (g.winner) handleGameEnd(d.roomId, g, g.players); } });

    // 13: Hangman (HIER WAR DAS PROBLEM)
    socket.on("hangman_guess", (d) => {
        const g = activeGames[d.roomId];
        if (g && g.type === 'HANGMAN') {
            if (d.type === 'LETTER') hangman.handleGuessLetter(g, socket.id, d.value);
            if (d.type === 'WORD') hangman.handleSolveWord(g, socket.id, d.value);
            sendGameUpdate(d.roomId, g);
            if (g.winner) handleGameEnd(d.roomId, g, g.players);
        }
    });
    // Game 14: Word Search
    socket.on("wordsearch_select", (d) => {
        const g = activeGames[d.roomId];
        if (g && g.type === 'WORDSEARCH') {
            wordSearch.handleSelection(g, socket.id, d.selection);
            sendGameUpdate(d.roomId, g);
            if (g.winner) handleGameEnd(d.roomId, g, g.players);
        }
    });

    // Game 15: Memory
    socket.on("memory_flip", (d) => {
        const g = activeGames[d.roomId];
        if (g && g.type === 'MEMORY') {
            memory.handleFlip(g, socket.id, d.cardId);
            sendGameUpdate(d.roomId, g);
            if (g.winner) handleGameEnd(d.roomId, g, g.players);
        }
    });

    // Game 16: Snake
    socket.on("snake_dir", (d) => {
        const g = activeGames[d.roomId];
        if (g && g.type === 'SNAKE') {
            snake.handleInput(g, socket.id, d.dir);
        }
    });

    // Game 17: Color Match
    socket.on("colormatch_answer", (d) => {
        const g = activeGames[d.roomId];
        if (g && g.type === 'COLORMATCH') {
            colorMatch.handleInput(g, socket.id, d.answer);
            sendGameUpdate(d.roomId, g); // Sofort Update für neue Aufgabe
            if (g.winner) handleGameEnd(d.roomId, g, g.players);
        }
    });

    // Game 18: Anagram Hunt
    socket.on("anagram_submit", (d) => {
        const g = activeGames[d.roomId];
        if (g && g.type === 'ANAGRAM') {
            anagramHunt.handleInput(g, socket.id, d.guess);
            sendGameUpdate(d.roomId, g);
            if (g.winner) handleGameEnd(d.roomId, g, g.players);
        }
    });

    // Game 19: Quick Quiz
    socket.on("quiz_answer", (d) => {
        const g = activeGames[d.roomId];
        if (g && g.type === 'QUIZ') {
            quickQuiz.handleInput(g, socket.id, d.answerIndex);
            sendGameUpdate(d.roomId, g); // Direktes Feedback (z.B. "Waiting for opp")
        }
    });

    // Game 20: Pattern
    socket.on("pattern_click", (d) => { const g = activeGames[d.roomId]; if (g && g.type === 'PATTERN') { patternDuel.handleInput(g, socket.id, d.btnIndex); sendGameUpdate(d.roomId, g); if (g.winner) handleGameEnd(d.roomId, g, g.players); } });

    // Game 21: Catapult
    socket.on("catapult_shoot", (d) => { const g = activeGames[d.roomId]; if (g && g.type === 'CATAPULT') { catapult.handleShoot(g, socket.id, d.params); sendGameUpdate(d.roomId, g); } });

    // Game 22: Bomb
    socket.on("bomb_solve", (d) => { const g = activeGames[d.roomId]; if (g && g.type === 'BOMB') { bombPass.handleInput(g, socket.id, d.answer); sendGameUpdate(d.roomId, g); if (g.winner) handleGameEnd(d.roomId, g, g.players); } });

    // Cleanup
    const handleGameEnd = (roomId, finalState, players) => {
        if (finalState.winner) {
            const roomWithXP = addGameXP(roomId, finalState.winner, players.find(p => p !== finalState.winner));
            if (roomWithXP) io.to(roomId).emit("room_update", roomWithXP);
        }
        if (activeGames[roomId]?.interval) clearInterval(activeGames[roomId].interval);
        setTimeout(() => {
            cleanupGame(roomId);
            const room = getRoom(roomId);
            if (room) { room.users.forEach(u => u.isReady = false); io.to(roomId).emit("room_update", room); }
            io.to(roomId).emit("game_over");
        }, 3000);
    };

    socket.on("disconnect", () => {
        const { roomId, room } = leaveRoom(socket.id);
        if (roomId) { cleanupGame(roomId); io.to(roomId).emit("room_update", room); io.to(roomId).emit("game_over"); }
        broadcastLobbyList();
    });
    socket.on("leave_room", () => {
        const { roomId, room } = leaveRoom(socket.id);
        socket.leave(roomId);
        if (roomId) { cleanupGame(roomId); io.to(roomId).emit("room_update", room); io.to(roomId).emit("game_over"); }
        broadcastLobbyList();
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});