import React, { useRef } from 'react';
import './AirHockey.css';

const AirHockey = ({ socket, roomId, gameState, mySocketId }) => {
  const { mallets, puck, scores, timeLeft, winner, dimensions } = gameState;
  const boardRef = useRef(null);

  const handleMouseMove = (e) => {
      if (winner || !boardRef.current) return;

      // Berechne Mausposition relativ zum Spielfeld (Canvas/Div)
      const rect = boardRef.current.getBoundingClientRect();
      
      // Skalierungsfaktor falls CSS das Feld kleiner macht als die interne Logik (800x500)
      const scaleX = dimensions.width / rect.width;
      const scaleY = dimensions.height / rect.height;

      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      socket.emit("airhockey_move", { roomId, pos: { x, y } });
  };

  // Formatierung der Zeit (MM:SS)
  const formatTime = (seconds) => {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="airhockey-container">
        {/* HUD */}
        <div className="ah-hud">
            <div className="ah-score p1">{Object.values(scores)[0]}</div>
            <div className="ah-timer-box">
                <div className="ah-timer-label">TIME</div>
                <div className="ah-timer-val">{formatTime(timeLeft)}</div>
            </div>
            <div className="ah-score p2">{Object.values(scores)[1]}</div>
        </div>

        {winner && <div className="game-status win">{winner === mySocketId || winner === "DRAW" ? (winner === "DRAW" ? "DRAW!" : "VICTORY!") : "DEFEAT"}</div>}

        {/* Das Spielfeld */}
        <div 
            className="ah-board"
            ref={boardRef}
            onMouseMove={handleMouseMove}
            style={{ width: dimensions.width, height: dimensions.height }}
        >
            {/* Markierungen auf dem Feld */}
            <div className="ah-center-line"></div>
            <div className="ah-center-circle"></div>
            <div className="ah-goal-area left"></div>
            <div className="ah-goal-area right"></div>

            {/* Objekte rendern */}
            {Object.entries(mallets).map(([id, m]) => (
                <div 
                    key={id}
                    className={`ah-mallet ${id === mySocketId ? 'me' : ''}`}
                    style={{
                        left: m.x,
                        top: m.y,
                        width: m.radius * 2,
                        height: m.radius * 2,
                        backgroundColor: m.color,
                        boxShadow: `0 0 20px ${m.color}`
                    }}
                >
                    {/* Griff */}
                    <div className="ah-mallet-handle"></div>
                </div>
            ))}

            <div 
                className="ah-puck"
                style={{
                    left: puck.x,
                    top: puck.y,
                    width: puck.radius * 2,
                    height: puck.radius * 2
                }}
            ></div>
        </div>
        
        <div className="controls-hint">Use your MOUSE to control the striker!</div>
    </div>
  );
};

export default AirHockey;