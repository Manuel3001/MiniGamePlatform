import React, { useEffect, useRef, useState } from 'react';
import './TankDuel.css';

const TankDuel = ({ socket, roomId, gameState, mySocketId }) => {
  const { tanks, bullets, walls, winner, dimensions, mapName, mapTheme } = gameState;
  const myTank = tanks[mySocketId];
  
  const keysPressed = useRef({});

  // Viewport Größe (Fenstergröße des Spielers)
  const VIEWPORT_W = 800;
  const VIEWPORT_H = 600;

  // Kamera Position berechnen
  const [camera, setCamera] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (myTank) {
        // Kamera zentriert auf den Panzer
        let cx = -myTank.x + VIEWPORT_W / 2;
        let cy = -myTank.y + VIEWPORT_H / 2;

        // Grenzen (nicht aus der Map schauen)
        const minX = -(dimensions.width - VIEWPORT_W);
        const minY = -(dimensions.height - VIEWPORT_H);
        
        cx = Math.min(0, Math.max(minX, cx));
        cy = Math.min(0, Math.max(minY, cy));

        setCamera({ x: cx, y: cy });
    }
  }, [myTank, dimensions]);

  // Input Handling
  useEffect(() => {
      const calculateVector = () => {
          let dx = 0; let dy = 0;
          const k = keysPressed.current;
          if (k['w'] || k['arrowup']) dy -= 1;
          if (k['s'] || k['arrowdown']) dy += 1;
          if (k['a'] || k['arrowleft']) dx -= 1;
          if (k['d'] || k['arrowright']) dx += 1;
          return { x: dx, y: dy };
      };

      const handleKeyDown = (e) => {
          const key = e.key.toLowerCase();
          if (key === ' ') { socket.emit("tank_shoot", { roomId }); return; }
          if (!keysPressed.current[key]) {
              keysPressed.current[key] = true;
              socket.emit("tank_input", { roomId, vector: calculateVector() });
          }
      };
      const handleKeyUp = (e) => {
          const key = e.key.toLowerCase();
          if (keysPressed.current[key]) {
              delete keysPressed.current[key];
              socket.emit("tank_input", { roomId, vector: calculateVector() });
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
      };
  }, [socket, roomId]);

  // Minimap Skalierung
  const MM_SCALE = 0.1; // 10% der Größe
  const MM_W = dimensions.width * MM_SCALE;
  const MM_H = dimensions.height * MM_SCALE;

  return (
    <div className="tank-container">
        <h2>Tank Duel - {mapName}</h2>
        {winner && <div className="game-status">{winner === mySocketId ? "VICTORY!" : "GAME OVER"}</div>}

        <div className="tank-hp-bar">
            {Object.values(tanks).map((tank, i) => (
                <div key={i} style={{ color: tank.color }}>
                   {tank.isBot ? "BOT" : "P"}: {'♥'.repeat(tank.hp)}
                </div>
            ))}
        </div>

        {/* HAUPT SPIELFELD (VIEWPORT) */}
        <div className="tank-viewport" style={{ width: VIEWPORT_W, height: VIEWPORT_H }}>
            
            {/* DIE GROSSE WELT (wird verschoben) */}
            <div 
                className={`tank-field theme-${mapTheme || 'classic'}`} 
                style={{ 
                    width: dimensions.width, 
                    height: dimensions.height,
                    transform: `translate(${camera.x}px, ${camera.y}px)`
                }}
            >
                {/* Wände */}
                {walls.map((w, i) => (
                    <div key={i} className="wall" style={{ left: w.x, top: w.y, width: w.w, height: w.h }} />
                ))}

                {/* Panzer */}
                {Object.entries(tanks).map(([id, t]) => (
                    <div 
                        key={id}
                        className={`tank ${id === mySocketId ? 'my-tank' : 'enemy-tank'} variant-${t.variant || 0}`}
                        style={{ left: t.x, top: t.y, transform: `rotate(${t.angle}deg)` }}
                    >
                        <div className="tank-tracks"></div>
                        <div className="tank-body" style={{ backgroundColor: t.color }}></div>
                        <div className="tank-barrel"></div>
                    </div>
                ))}

                {/* Kugeln */}
                {bullets.map((b, i) => (
                    <div key={i} className="bullet" style={{ left: b.x, top: b.y }} />
                ))}
            </div>

            {/* MINIMAP (Absolut oben rechts im Viewport) */}
            <div className="minimap" style={{ width: MM_W, height: MM_H }}>
                {/* Minimap Wände */}
                {walls.map((w, i) => (
                    <div key={i} className="mm-wall" style={{ left: w.x * MM_SCALE, top: w.y * MM_SCALE, width: w.w * MM_SCALE, height: w.h * MM_SCALE }} />
                ))}
                {/* Minimap Panzer */}
                {Object.values(tanks).map((t, i) => t.hp > 0 && (
                    <div key={i} className="mm-tank" style={{ left: t.x * MM_SCALE, top: t.y * MM_SCALE, backgroundColor: t.color }} />
                ))}
                {/* Viewport Rahmen auf Minimap */}
                <div className="mm-viewport-frame" style={{
                    left: -camera.x * MM_SCALE,
                    top: -camera.y * MM_SCALE,
                    width: VIEWPORT_W * MM_SCALE,
                    height: VIEWPORT_H * MM_SCALE
                }}></div>
            </div>

        </div>
        
        <div className="controls-hint">WASD to Move, SPACE to Shoot</div>
    </div>
  );
};

export default TankDuel;