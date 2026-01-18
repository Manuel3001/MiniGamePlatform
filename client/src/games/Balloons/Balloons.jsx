import React, { useRef } from 'react';
import './Balloons.css';

const Balloons = ({ socket, roomId, gameState, mySocketId }) => {
  const { balloons, scores, timeLeft, winner, dimensions } = gameState;
  const boardRef = useRef(null);

  const handlePointerDown = (e) => {
      if (winner || !boardRef.current) return;
      e.preventDefault(); // Kein Text-Select

      // Mausposition berechnen
      const rect = boardRef.current.getBoundingClientRect();
      const scaleX = dimensions.width / rect.width;
      const scaleY = dimensions.height / rect.height;

      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      socket.emit("balloon_click", { roomId, pos: { x, y } });
  };

  return (
    <div className="balloons-container">
        {/* HUD */}
        <div className="bloon-hud">
             <div className="bloon-score me">
                 <div className="label">YOU</div>
                 <div className="val">{scores[mySocketId]}</div>
             </div>
             
             <div className="bloon-timer">
                 <div className="clock-icon">⏰</div>
                 <div>{Math.ceil(timeLeft)}s</div>
             </div>

             <div className="bloon-score opp">
                 <div className="label">OPP</div>
                 <div className="val">{scores[Object.keys(scores).find(id => id !== mySocketId)]}</div>
             </div>
        </div>

        {winner && <div className="game-status win">{winner === mySocketId || winner === 'DRAW' ? (winner === 'DRAW' ? "DRAW!" : "VICTORY!") : "DEFEAT"}</div>}

        {/* Spielfeld */}
        <div 
            className="bloon-field"
            ref={boardRef}
            onPointerDown={handlePointerDown}
            style={{ width: dimensions.width, height: dimensions.height }}
        >
            {/* Hintergrundwolken */}
            <div className="bg-cloud b-c1"></div>
            <div className="bg-cloud b-c2"></div>

            {/* Die Ballons */}
            {balloons.map(b => (
                <div 
                    key={b.id}
                    className="balloon-wrapper"
                    style={{ left: b.x, top: b.y }}
                >
                    <div 
                        className="balloon-body" 
                        style={{ backgroundColor: b.color, boxShadow: `inset -10px -10px 20px rgba(0,0,0,0.3), inset 5px 5px 10px rgba(255,255,255,0.4)` }}
                    ></div>
                    <div className="balloon-string"></div>
                </div>
            ))}
        </div>
        
        <div className="controls-hint">POP THE BALLOONS FAST!</div>
    </div>
  );
};

export default Balloons;