import React, { useEffect, useState, useRef } from 'react';
import './TankDuel.css';

const TankDuel = ({ socket, roomId, gameState, mySocketId }) => {
  const { tanks, bullets, walls, winner, dimensions } = gameState;
  const myTank = tanks[mySocketId];
  
  const keysPressed = useRef({});

  useEffect(() => {
      const calculateVector = () => {
          let dx = 0;
          let dy = 0;
          const k = keysPressed.current;

          if (k['w'] || k['arrowup']) dy -= 1;
          if (k['s'] || k['arrowdown']) dy += 1;
          if (k['a'] || k['arrowleft']) dx -= 1;
          if (k['d'] || k['arrowright']) dx += 1;

          return { x: dx, y: dy };
      };

      const handleKeyDown = (e) => {
          const key = e.key.toLowerCase();
          
          if (key === ' ') {
              socket.emit("tank_shoot", { roomId });
              return;
          }

          if (!keysPressed.current[key]) {
              keysPressed.current[key] = true;
              const vec = calculateVector();
              socket.emit("tank_input", { roomId, vector: vec });
          }
      };

      const handleKeyUp = (e) => {
          const key = e.key.toLowerCase();
          if (keysPressed.current[key]) {
              delete keysPressed.current[key];
              const vec = calculateVector();
              socket.emit("tank_input", { roomId, vector: vec });
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
      };
  }, [socket, roomId]);

  return (
    <div className="tank-container">
        <h2>Tank Duel Arena</h2>
        {winner && <div className="game-status win">{winner === mySocketId ? "VICTORY!" : "DEFEAT"}</div>}

        <div className="tank-hp-bar">
            {Object.values(tanks).map((tank, i) => (
                <div key={i} style={{ color: tank.color }}>
                   HP: {'♥'.repeat(tank.hp)}
                </div>
            ))}
        </div>

        <div className="tank-field" style={{ width: dimensions.width, height: dimensions.height }}>
            
            {/* Wände */}
            {walls.map((w, i) => (
                <div 
                    key={i} 
                    className="wall"
                    style={{ left: w.x, top: w.y, width: w.w, height: w.h }}
                />
            ))}

            {/* Panzer */}
            {Object.entries(tanks).map(([id, t]) => (
                <div 
                    key={id}
                    className={`tank ${id === mySocketId ? 'my-tank' : 'enemy-tank'}`}
                    style={{ 
                        left: t.x, 
                        top: t.y, 
                        transform: `rotate(${t.angle}deg)`,
                        borderColor: t.color
                    }}
                >
                    {/* NEU: Ketten */}
                    <div className="tank-tracks"></div>
                    
                    {/* Body */}
                    <div className="tank-body" style={{ backgroundColor: t.color }}>
                        {/* Kleines Detail auf dem Dach */}
                        <div className="tank-hatch"></div>
                    </div>
                    
                    {/* Rohr */}
                    <div className="tank-barrel"></div>
                </div>
            ))}

            {/* Kugeln */}
            {bullets.map((b, i) => (
                <div 
                    key={i}
                    className="bullet"
                    style={{ left: b.x, top: b.y }}
                />
            ))}
        </div>
        
        <div className="controls-hint">WASD to Move, SPACE to Shoot</div>
    </div>
  );
};

export default TankDuel;