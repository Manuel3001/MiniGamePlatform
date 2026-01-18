import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './GameRoom.css';
import GameManager from '../../components/GameManager';
import { AVAILABLE_GAMES, RANDOM_GAME_ID, getGameInfo } from '../../utils/gameList'; // Import

const GameRoom = ({ socket, userInfo }) => {
    // ... (Restlicher Code bleibt fast gleich, nur die Konstanten oben löschen)
    const { roomId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const chatEndRef = useRef(null);

    // --- STATE ---
    const [roomData, setRoomData] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState("");

    const [mySelectedGame, setMySelectedGame] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeGameState, setActiveGameState] = useState(null);
    const [currentGameId, setCurrentGameId] = useState(0);

    // --- SOCKET LISTENERS ---
    useEffect(() => {
        const initialGames = location.state?.initialGames || [];
        const isPrivate = location.state?.isPrivate || false;
        
        socket.emit("join_room", {
            roomId,
            user: userInfo,
            createSettings: { initialGames, isPrivate }
        });

        socket.on("room_update", (data) => setRoomData(data));
        socket.on("receive_message", (data) => setChatMessages((prev) => [...prev, data]));
        
        socket.on("game_started", ({ gameId, gameState }) => {
            console.log("GAME STARTED:", gameId);
            setCurrentGameId(gameId);
            setActiveGameState(gameState);
            setIsPlaying(true);
        });

        socket.on("game_update", (gameState) => setActiveGameState(gameState));
        socket.on("game_over", () => { setIsPlaying(false); setActiveGameState(null); });

        return () => {
            socket.emit("leave_room");
            socket.off("room_update");
            socket.off("receive_message");
            socket.off("game_started");
            socket.off("game_update");
            socket.off("game_over");
        };
    }, [roomId, socket, userInfo, location.state]);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!currentMessage.trim()) return;
        const messageData = {
            roomId,
            sender: userInfo.username,
            text: currentMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true
        };
        socket.emit("send_message", messageData);
        setCurrentMessage("");
    };

    const handleToggleReady = () => socket.emit("player_ready", { roomId });
    const handleLeave = () => { socket.emit("leave_room"); navigate('/home'); };
    const handleSelectGame = (gameId, isLocked) => {
        if (isLocked) return;
        setMySelectedGame(gameId);
        socket.emit("select_game", { roomId, gameId });
    }

    if (!roomData) return <div className="loading-screen">Joining Room...</div>;

    const sortedUsers = [...roomData.users].sort((a, b) => b.points - a.points);
    const myUser = roomData.users.find(u => u.username === userInfo.username);
    const opponent = roomData.users.find(u => u.username !== userInfo.username);
    const opponentGameId = opponent ? roomData.gameSelections[opponent.socketId] : null;

    // Wir nutzen jetzt die Hilfsfunktion aus gameList.js
    const opGameInfo = opponentGameId !== undefined ? getGameInfo(opponentGameId) : null;

    if (isPlaying && activeGameState) {
        return (
            <div className="gameroom-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <GameManager gameId={currentGameId} socket={socket} roomId={roomId} gameState={activeGameState} mySocketId={socket.id} />
            </div>
        );
    }

    return (
        <div className="gameroom-container">
            <div className="room-left">
                <div className="player-ranking-section">
                    <h3>Lobby Members - Ranklist <span style={{ color: '#e94560', fontSize: '0.8em' }}>(Room #{roomId})</span></h3>
                    <div className="ranking-list">
                        {sortedUsers.map((user, index) => (
                            <div key={index} className={`player-card ${index === 0 ? 'rank-1' : ''}`}>
                                <div className="rank-number">#{index + 1}</div>
                                <img src={user.avatar} className="player-avatar" alt="avatar" />
                                <div className="player-details">
                                    <span className="player-name">{user.username}</span>
                                    <span className="player-points">{user.points} XP</span>
                                </div>
                                <div className={`ready-indicator ${user.isReady ? 'ready' : 'not-ready'}`}>
                                    {user.isReady ? '✓ READY' : 'WAITING'}
                                </div>
                            </div>
                        ))}
                        {roomData.users.length < 2 && <div className="player-card waiting-card"><span className="player-name">Waiting for player...</span></div>}
                    </div>
                </div>

                <div className="chat-section">
                    <div className="chat-window">
                        {chatMessages.length === 0 && <div className="chat-empty">Start chatting...</div>}
                        {chatMessages.map((msg, i) => (
                            <div key={i} className={`chat-bubble ${msg.sender === userInfo.username ? 'my-msg' : 'other-msg'}`}>
                                <span className="chat-sender">{msg.sender}</span>
                                <span className="chat-text">{msg.text}</span>
                                <span className="chat-time">{msg.time}</span>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={handleSendMessage} className="chat-input-area">
                        <input type="text" placeholder="Type a message..." value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} />
                        <button type="submit">➤</button>
                    </form>
                </div>
            </div>

            <div className="room-right">
                <div className="game-selection-area">
                    <div className="my-selection-col">
                        <h3>Select Game</h3>
                        <div className="games-list-scroll">
                            <div className={`game-item-row random-opt ${mySelectedGame === RANDOM_GAME_ID ? 'selected' : ''}`} onClick={() => handleSelectGame(RANDOM_GAME_ID, false)}>
                                <div className="game-icon-small">?</div>
                                <span>Random Game</span>
                            </div>
                            {AVAILABLE_GAMES.map(game => (
                                <div key={game.id} className={`game-item-row ${mySelectedGame === game.id ? 'selected' : ''} ${game.isLocked ? 'locked-game' : ''}`} onClick={() => handleSelectGame(game.id, game.isLocked)}>
                                    <div className="game-icon-small">{game.icon}</div>
                                    <span>{game.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="opponent-selection-col">
                        <h3>Opponent wants:</h3>
                        <div className="opponent-choice-display">
                            {!opponent ? <span className="waiting-text">Waiting for opponent...</span> : opGameInfo ? (
                                <>
                                    <div className="big-game-icon">{opGameInfo.icon}</div>
                                    <span className="big-game-name">{opGameInfo.name}</span>
                                </>
                            ) : <span className="waiting-text">Thinking...</span>}
                        </div>
                    </div>
                </div>

                <div className="room-actions">
                    <button className="leave-btn" onClick={handleLeave}>Leave Room</button>
                    <button className={`ready-btn ${myUser?.isReady ? 'is-ready' : ''}`} onClick={handleToggleReady}>{myUser?.isReady ? 'CANCEL READY' : 'READY UP'}</button>
                </div>
            </div>
        </div>
    );
};

export default GameRoom;