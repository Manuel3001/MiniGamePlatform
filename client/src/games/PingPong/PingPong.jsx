import React, { useEffect, useState } from 'react';
import './PingPong.css';

const PingPong = ({ socket, roomId, gameState, mySocketId }) => {
  const { paddles, ball, winner, dimensions } = gameState;

  // Steuerung
  useEffect(() => {
      const handleKeyDown = (e) => {
          if (e.key === 'ArrowUp' || e.key === 'w') {
              socket.emit("pingpong_move", { roomId, direction: 'up' });
          } else if (e.key === 'ArrowDown' || e.key === 's') {
              socket.emit("pingpong_move", { roomId, direction: 'down' });
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [socket, roomId]);

  // Wir müssen wissen, welches Paddle "meins" ist
  const myPaddle = paddles[mySocketId];
  // Und welches dem Gegner gehört (einfach das andere)
  const opponentId = Object.keys(paddles).find(id => id !== mySocketId);
  const opponentPaddle = paddles[opponentId];

  // Helper zum Umrechnen von Spiel-Koordinaten (800x500) in % für CSS
  const toPctX = (val) => (val / dimensions.width) * 100 + '%';
  const toPctY = (val) => (val / dimensions.height) * 100 + '%';

  return (
    <div className="pong-container">
        <h2>Neon Ping Pong</h2>
        {winner && <div className="game-status win">{winner === mySocketId ? "VICTORY!" : "DEFEAT"}</div>}
        
        <div className="score-board">
            <div className="score me">ME: {myPaddle?.score || 0}</div>
            <div className="score enemy">OPP: {opponentPaddle?.score || 0}</div>
        </div>
        
        <div className="pong-field">
            {/* Mittellinie */}
            <div className="center-line"></div>

            {/* Paddles */}
            {Object.entries(paddles).map(([pid, p]) => (
                <div 
                    key={pid} 
                    className={`paddle ${pid === mySocketId ? 'my-paddle' : 'enemy-paddle'}`}
                    style={{ 
                        left: toPctX(p.x), 
                        top: toPctY(p.y),
                        height: '20%' // 100px von 500px = 20%
                    }}
                />
            ))}

            {/* Ball */}
            <div 
                className="ball"
                style={{
                    left: toPctX(ball.x),
                    top: toPctY(ball.y)
                }}
            />
        </div>
        
        <div className="controls-hint">Use ⬆️⬇️ or W/S to move</div>
    </div>
  );
};

export default PingPong;