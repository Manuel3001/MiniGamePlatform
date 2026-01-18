import React, { useState, useEffect } from 'react';
import './Catapult.css';

const GRAVITY = 0.5;

const Catapult = ({ socket, roomId, gameState, mySocketId }) => {
  const { positions, lives, projectile, explosion, turnIndex, players, winner, message, lastPath } = gameState;
  
  const isMyTurn = players[turnIndex] === mySocketId;
  const myIndex = players.indexOf(mySocketId);
  const myPos = positions[mySocketId];
  
  const [angle, setAngle] = useState(45);
  const [power, setPower] = useState(80);
  
  const [cameraX, setCameraX] = useState(0);
  const viewPortWidth = 800; 

  // Kamera Logik
  useEffect(() => {
    let targetX = 0;
    if (winner) return;

    if (isMyTurn && (projectile || explosion)) {
        const targetObj = projectile || explosion;
        targetX = -targetObj.x + (viewPortWidth / 2);
    } else {
        if (myPos) {
            targetX = -myPos.x + (viewPortWidth / 2);
        }
    }
    targetX = Math.min(0, Math.max(-1200, targetX));
    setCameraX(targetX);
  }, [projectile, explosion, isMyTurn, myPos, winner]);

  const handleFire = () => {
      if (!isMyTurn || winner || projectile) return;
      socket.emit("catapult_shoot", { roomId, params: { angle: parseInt(angle), power: parseInt(power) } });
  };

 // client/src/games/Catapult/Catapult.jsx

// ...

  const calculateTrajectory = () => {
      if (!isMyTurn || !myPos) return [];
      const points = [];
      
      // Startposition exakt wie im Server berechnen
      // P1 (Index 0): -25 Offset
      // P2 (Index 1): +25 Offset
      let x = myPos.x + (myIndex === 0 ? -25 : 25);
      
      // Höhe anpassen (Hügel + Burg + Katapult Höhe)
      let y = myPos.y - 90; 
      
      let rad = (angle * Math.PI) / 180;
      let vx = Math.cos(rad) * power * 0.4;
      let vy = -Math.sin(rad) * power * 0.4;

      if (myIndex === 1) vx = -vx; 

      // Erster Punkt ist der Startpunkt
      points.push({x, y});

      for(let i=0; i<30; i++) { 
          x += vx;
          y += vy;
          vy += GRAVITY;
          points.push({x, y});
      }
      return points;
  };
  
  const previewPoints = calculateTrajectory();

// ...
  
  const p1Id = players[0];
  const p2Id = players[1];

  return (
    <div className="cat-container">
        {winner && <div className="cat-overlay">{winner === mySocketId ? "VICTORY!" : "DEFEAT"}</div>}
        
        {/* HUD */}
        <div className="cat-top-hud">
            <div className={`hud-player ${turnIndex === 0 ? 'active' : ''}`}>
                <span className="p-label">P1 {p1Id === mySocketId ? '(YOU)' : ''}</span>
                <div className="hearts">{'❤️'.repeat(lives[p1Id] || 0)}</div>
            </div>
            <div className="hud-msg">{message}</div>
            <div className={`hud-player ${turnIndex === 1 ? 'active' : ''}`}>
                <div className="hearts">{'❤️'.repeat(lives[p2Id] || 0)}</div>
                <span className="p-label">P2 {p2Id === mySocketId ? '(YOU)' : ''}</span>
            </div>
        </div>

        {/* WELT */}
        <div className="cat-viewport">
            <div className="cat-world" style={{ transform: `translateX(${cameraX}px)` }}>
                
                <div className="bg-decoration cloud c1"></div>
                <div className="bg-decoration cloud c2"></div>
                <div className="bg-decoration mountain m1"></div>
                <div className="bg-decoration mountain m2"></div>

                <svg className="cat-svg-layer">
                    {lastPath && lastPath.length > 1 && (
                        <polyline 
                            points={lastPath.map(p => `${p.x},${p.y}`).join(" ")} 
                            fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="5,5"
                        />
                    )}
                    {isMyTurn && !projectile && (
                        <polyline 
                            points={previewPoints.map(p => `${p.x},${p.y}`).join(" ")} 
                            fill="none" stroke="#4dfff3" strokeWidth="3" 
                        />
                    )}
                </svg>

                {/* Einheiten & Burgen */}
                {players.map((pid, idx) => {
                    const pos = positions[pid];
                    const isMe = pid === mySocketId;
                    
                    // Prüfen ob DIESES Katapult gerade schießt (Animation triggern)
                    // Es schießt, wenn ein Projektil existiert UND dieser Spieler dran war
                    const isShooting = projectile && players[turnIndex] === pid;

                    return (
                        <div key={pid} className="cat-unit" style={{ left: pos.x, top: pos.y }}>
                             {isMe && <div className="me-arrow">▼</div>}
                            
                             <div className="cat-hill">
                                <svg width="140" height="60" viewBox="0 0 140 60">
                                    <path d="M0,60 Q20,10 70,10 Q120,10 140,60 Z" fill="#3e2723" />
                                    <path d="M10,45 Q30,5 70,5 Q110,5 130,45" fill="none" stroke="#43a047" strokeWidth="6" strokeLinecap="round"/>
                                </svg>
                             </div>

                             <div className="cat-castle-structure">
                                <svg width="80" height="50" viewBox="0 0 80 50">
                                    <rect x="5" y="0" width="15" height="10" fill="#7f8c8d" />
                                    <rect x="32" y="0" width="15" height="10" fill="#7f8c8d" />
                                    <rect x="60" y="0" width="15" height="10" fill="#7f8c8d" />
                                    <rect x="0" y="10" width="80" height="40" fill="#95a5a6" stroke="#2c3e50" strokeWidth="2"/>
                                    <rect x="20" y="20" width="10" height="15" fill="#2c3e50" rx="5" />
                                    <rect x="50" y="20" width="10" height="15" fill="#2c3e50" rx="5" />
                                </svg>
                             </div>

                            {/* KATAPULT SVG - Jetzt mit Animation Group */}
                            <div className={`catapult-svg ${idx === 1 ? 'flip' : ''}`}>
                                <svg width="60" height="60" viewBox="0 0 100 100">
                                    {/* Basis & Rahmen (Statisch) */}
                                    <path d="M10,90 L90,90" stroke="#5d4037" strokeWidth="6" /> 
                                    <path d="M20,90 L50,50 L80,90" stroke="#795548" strokeWidth="5" fill="none"/> 
                                    
                                    {/* DER BEWEGLICHE WURFARM */}
                                    <g className={`catapult-arm ${isShooting ? 'firing' : ''}`}>
                                        <line x1="50" y1="50" x2="20" y2="30" stroke="#a1887f" strokeWidth="4" /> 
                                        <circle cx="20" cy="30" r="10" fill="#3e2723" />
                                    </g>
                                    
                                    {/* Achse (vorne drauf) */}
                                    <circle cx="50" cy="50" r="5" fill="#d7ccc8" />
                                </svg>
                            </div>
                        </div>
                    );
                })}

                {projectile && <div className="cat-bomb" style={{ left: projectile.x, top: projectile.y }}>💣</div>}
                {explosion && <div className="cat-boom" style={{ left: explosion.x, top: explosion.y }}>💥</div>}

                <div className="cat-ground"></div>
            </div>
        </div>

        <div className="cat-controls">
            <div className="ctrl-grp">
                <label>Angle: {angle}°</label>
                <input type="range" min="0" max="90" value={angle} onChange={e => setAngle(e.target.value)} disabled={!isMyTurn} />
            </div>
            <div className="ctrl-grp">
                <label>Power: {power}</label>
                <input type="range" min="10" max="150" value={power} onChange={e => setPower(e.target.value)} disabled={!isMyTurn} />
            </div>
            <button className="fire-btn" onClick={handleFire} disabled={!isMyTurn || !!projectile}>FIRE!</button>
        </div>
    </div>
  );
};
export default Catapult;