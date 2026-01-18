import React, { useEffect } from 'react';
import './Snake.css';

const Snake = ({ socket, roomId, gameState, mySocketId }) => {
  const { snakes, food, gridSize, winner, players } = gameState;
  
  // Deine Schlange & Farbe finden
  const mySnake = snakes[mySocketId];
  // Fallback Farbe, falls noch nicht geladen
  const myColor = mySnake ? mySnake.color : '#fff'; 

  // Steuerung
  useEffect(() => {
      const handleKeyDown = (e) => {
          let dir = null;
          const k = e.key;
          if (k === 'ArrowUp' || k === 'w' || k === 'W') dir = { x: 0, y: -1 };
          if (k === 'ArrowDown' || k === 's' || k === 'S') dir = { x: 0, y: 1 };
          if (k === 'ArrowLeft' || k === 'a' || k === 'A') dir = { x: -1, y: 0 };
          if (k === 'ArrowRight' || k === 'd' || k === 'D') dir = { x: 1, y: 0 };
          
          if (dir) socket.emit("snake_dir", { roomId, dir });
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [socket, roomId]);

  // Grid rendern
  const cellSize = 20; 
  const boardSize = gridSize * cellSize;

  return (
    <div className="snake-container">
        {/* --- NEU: Identitäts-Anzeige --- */}
        <div className="snake-identity">
            You are the <span className="snake-dot" style={{backgroundColor: myColor}}></span> Snake
        </div>

        {winner && <div className="snake-overlay">{winner === mySocketId ? "VICTORY!" : winner === "DRAW" ? "DRAW!" : "GAME OVER"}</div>}
        
        <div className="snake-board" style={{ width: boardSize, height: boardSize }}>
            {/* Essen */}
            <div 
                className="snake-food"
                style={{ 
                    left: food.x * cellSize, 
                    top: food.y * cellSize,
                    width: cellSize, height: cellSize 
                }}
            >🍎</div>

            {/* Schlangen */}
            {players.map(pid => {
                const s = snakes[pid];
                if (!s) return null;
                const isMe = pid === mySocketId;
                
                return s.body.map((segment, i) => (
                    <div 
                        key={`${pid}-${i}`}
                        className={`snake-segment ${isMe ? 'me' : 'opp'}`}
                        style={{
                            left: segment.x * cellSize,
                            top: segment.y * cellSize,
                            width: cellSize, height: cellSize,
                            backgroundColor: i === 0 ? (isMe ? '#fff' : '#ccc') : s.color, // Kopf heller
                            zIndex: i === 0 ? 2 : 1
                        }}
                    >
                        {i === 0 && (
                            <div className="snake-eyes">
                                <div className="eye"></div><div className="eye"></div>
                            </div>
                        )}
                    </div>
                ));
            })}
        </div>
        
        <div className="snake-controls-hint">Use WASD or Arrows</div>
    </div>
  );
};

export default Snake;