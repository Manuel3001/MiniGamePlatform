import React, { useState, useEffect } from 'react';
import './Archery.css';

const Archery = ({ socket, roomId, gameState, mySocketId }) => {
  const { scores, arrowsLeft, wind, targetDist, lastShot, winner, currentPlayerIndex, players } = gameState;
  
  const isMyTurn = players[currentPlayerIndex] === mySocketId && !winner;
  
  const [angle, setAngle] = useState(45);
  const [power, setPower] = useState(50);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animArrowPos, setAnimArrowPos] = useState(null); 

  useEffect(() => {
      if (lastShot && lastShot.path) {
          setIsAnimating(true);
          let step = 0;
          
          // Geschwindigkeit der Animation abhängig von der Pfadlänge
          const speed = Math.max(5, 300 / lastShot.path.length);

          const interval = setInterval(() => {
              if (step < lastShot.path.length) {
                  setAnimArrowPos(lastShot.path[step]);
                  step++; 
              } else {
                  clearInterval(interval);
                  setIsAnimating(false);
                  setTimeout(() => setAnimArrowPos(null), 1500); 
              }
          }, speed); 

          return () => clearInterval(interval);
      }
  }, [lastShot]);

  const handleFire = () => {
      if (!isMyTurn || isAnimating) return;
      socket.emit("archery_shoot", { 
          roomId, 
          shotData: { angle, power }
      });
  };

  return (
    <div className="archery-container">
        {/* Header / HUD */}
        <div className="archery-header">
            <div className="hud-wood-panel left">
                <div className="player-label">YOU</div>
                <div className="score-gem">{scores[mySocketId]}</div>
                <div className="arrow-count">
                    {Array.from({length: 3}).map((_, i) => (
                        <span key={i} className={i < arrowsLeft[mySocketId] ? "arrow-icon active" : "arrow-icon used"}>🏹</span>
                    ))}
                </div>
            </div>

            <div className="hud-wood-panel center">
                <div className="wind-compass">
                    <div className="wind-text">WIND</div>
                    {wind === 0 ? <span className="calm">CALM</span> : (
                        <div className="wind-gauge">
                             <div 
                                className="wind-needle" 
                                style={{ 
                                    transform: `translateX(${wind * 30}px) scaleX(${wind > 0 ? 1 : -1})`,
                                    opacity: Math.abs(wind) * 2 + 0.2
                                }}
                             >💨</div>
                             <div className="wind-val">{Math.round(Math.abs(wind) * 100)}%</div>
                        </div>
                    )}
                </div>
                <div className="game-message">
                     {winner ? (winner === mySocketId || winner === 'DRAW' ? (winner === 'DRAW' ? "DRAW!" : "VICTORY!") : "DEFEAT") 
                     : (isMyTurn ? "YOUR TURN" : (isAnimating ? "WATCH..." : "WAITING"))}
                </div>
            </div>

            <div className="hud-wood-panel right">
                <div className="player-label">OPP</div>
                <div className="score-gem enemy">{scores[players.find(id => id !== mySocketId)] || 0}</div>
                 <div className="arrow-count">
                    {Array.from({length: 3}).map((_, i) => (
                        <span key={i} className={i < arrowsLeft[players.find(id => id !== mySocketId)] ? "arrow-icon active" : "arrow-icon used"}>🏹</span>
                    ))}
                </div>
            </div>
        </div>

        {/* Das Spielfeld - Responsive Wrapper */}
        <div className="field-wrapper">
            <div className="archery-field">
                {/* Hintergrund Elemente */}
                <div className="bg-sky"></div>
                <div className="bg-clouds">
                    <div className="cloud c1"></div>
                    <div className="cloud c2"></div>
                    <div className="cloud c3"></div>
                </div>
                <div className="bg-mountains"></div>
                <div className="bg-ground">
                    <div className="grass-texture"></div>
                </div>

                {/* Spieler (Bogenschütze) */}
                <div className="archer">
                    <div className="archer-legs"></div>
                    <div className="archer-tunic"></div>
                    <div className="archer-hood"></div>
                    <div className="bow-arm" style={{ transform: `rotate(-${angle}deg)` }}>
                         <div className="bow-wood"></div>
                         <div className="bow-string"></div>
                         {/* Pfeil nur zeigen wenn man Pfeile hat und nicht gerade schießt */}
                         {!isAnimating && arrowsLeft[mySocketId] > 0 && <div className="loaded-arrow"></div>}
                    </div>
                </div>

                {/* Zielscheibe */}
                <div className="target" style={{ left: targetDist }}>
                    <div className="target-leg back"></div>
                    <div className="target-leg front"></div>
                    <div className="straw-boss">
                        <div className="ring white"></div>
                        <div className="ring black"></div>
                        <div className="ring blue"></div>
                        <div className="ring red"></div>
                        <div className="ring yellow"></div>
                    </div>
                    <div className="distance-flag">{Math.round(targetDist)}m</div>
                </div>

                {/* Animierter Flug-Pfeil */}
                {animArrowPos && (
                    <div 
                        className="flying-arrow"
                        style={{ 
                            left: animArrowPos.x, 
                            top: animArrowPos.y,
                            // Einfache Rotation basierend auf Flugbahn (Tangente wäre besser, aber dies reicht für den Effekt)
                            transform: `translate(-50%, -50%) rotate(${Math.atan2(
                                (lastShot.path[Math.min(lastShot.path.length-1, lastShot.path.indexOf(animArrowPos)+1)]?.y - animArrowPos.y) || 0,
                                (lastShot.path[Math.min(lastShot.path.length-1, lastShot.path.indexOf(animArrowPos)+1)]?.x - animArrowPos.x) || 1
                            ) * 57.29}deg)`
                        }}
                    ></div>
                )}
                
                {/* Treffer Feedback */}
                {!isAnimating && lastShot && !animArrowPos && (
                <div className="hit-popup">
                    {lastShot.score > 0 ? <span className="hit-text">+{lastShot.score}</span> : <span className="miss-text">MISS</span>}
                </div>
                )}
            </div>
        </div>

        {/* Controls - Jetzt besser platziert */}
        <div className={`wood-controls ${!isMyTurn ? 'disabled' : ''}`}>
            <div className="slider-group">
                <label>Angle: {angle}°</label>
                <input 
                    type="range" min="0" max="90" step="1" 
                    value={angle} onChange={(e) => setAngle(parseInt(e.target.value))} 
                    disabled={!isMyTurn}
                    className="wood-slider"
                />
            </div>

            <div className="fire-group">
                 <button className="fire-btn-wood" onClick={handleFire} disabled={!isMyTurn}>
                    SHOOT
                </button>
            </div>

            <div className="slider-group">
                <label>Power: {power}%</label>
                <input 
                    type="range" min="0" max="100" step="1" 
                    value={power} onChange={(e) => setPower(parseInt(e.target.value))} 
                    disabled={!isMyTurn}
                    className="wood-slider"
                />
            </div>
        </div>
    </div>
  );
};

export default Archery;