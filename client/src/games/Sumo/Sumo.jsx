import React, { useEffect, useRef } from 'react';
import './Sumo.css';

const Sumo = ({ socket, roomId, gameState, mySocketId }) => {
  const { entities, winner, arenaRadius } = gameState;
  
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
          
          // Mash Button (Space)
          if (key === ' ') {
              if (!e.repeat) { // Verhindert, dass Gedrückthalten zählt
                  socket.emit("sumo_mash", { roomId });
              }
              // Space soll nicht scrollen
              e.preventDefault(); 
              return;
          }

          if (!keysPressed.current[key]) {
              keysPressed.current[key] = true;
              const vec = calculateVector();
              socket.emit("sumo_input", { roomId, vector: vec });
          }
      };

      const handleKeyUp = (e) => {
          const key = e.key.toLowerCase();
          if (keysPressed.current[key]) {
              delete keysPressed.current[key];
              const vec = calculateVector();
              socket.emit("sumo_input", { roomId, vector: vec });
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
    <div className="sumo-container">
        <h2>SUMO SMASH</h2>
        {winner && <div className="game-status win">{winner === mySocketId ? "VICTORY!" : "DEFEAT"}</div>}
        
        <div className="controls-hint">
            Mash <strong>SPACE</strong> for Power! Move with <strong>WASD</strong>
        </div>

        {/* Die Arena ist zentriert. Wir nutzen transform, um 0,0 in die Mitte zu legen */}
        <div className="sumo-arena" style={{ width: arenaRadius * 2, height: arenaRadius * 2 }}>
            <div className="arena-circle"></div>
            
            {/* Spieler rendern */}
            {Object.entries(entities).map(([id, p]) => (
                <div 
                    key={id}
                    className={`sumo-player ${id === mySocketId ? 'me' : 'enemy'}`}
                    style={{
                        backgroundColor: p.color,
                        // Position relativ zur Mitte (Radius) berechnen
                        left: (p.x + arenaRadius) + 'px',
                        top: (p.y + arenaRadius) + 'px',
                        // Größe pulsiert mit Energie
                        transform: `translate(-50%, -50%) scale(${1 + p.energy/150})`
                    }}
                >
                    <div className="energy-bar">
                        <div className="energy-fill" style={{ width: p.energy + '%' }}></div>
                    </div>
                    {/* Mawashi (Gürtel) Indikator für Richtung (einfachheitshalber ein Strich) */}
                    <div className="mawashi"></div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default Sumo;