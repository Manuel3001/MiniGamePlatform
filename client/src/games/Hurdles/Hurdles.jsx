import React, { useEffect, useRef } from 'react';
import './Hurdles.css';

const Hurdles = ({ socket, roomId, gameState, mySocketId }) => {
  const { runners, hurdles, winner, trackLength } = gameState;
  const myRunner = runners[mySocketId];
  const keysPressed = useRef({});

  useEffect(() => {
      const handleKeyDown = (e) => {
          const key = e.key.toLowerCase();
          
          // Laufen (Leertaste)
          if (key === ' ') {
              if (!keysPressed.current[key]) { // Kein Dauerfeuer durch Halten
                  keysPressed.current[key] = true;
                  socket.emit("hurdles_run", { roomId });
              }
              e.preventDefault(); // Kein Scrollen
          }
          
          // Springen (Enter)
          if (key === 'enter') {
              if (!keysPressed.current[key]) {
                  keysPressed.current[key] = true;
                  socket.emit("hurdles_jump", { roomId });
              }
          }
      };

      const handleKeyUp = (e) => {
          const key = e.key.toLowerCase();
          keysPressed.current[key] = false;
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
      };
  }, [socket, roomId]);

  // Kamera-Offset
  const cameraOffset = myRunner ? -myRunner.x + 200 : 0;

  return (
    <div className="hurdles-container">
        <h2>Hurdle Race</h2>
        {winner && <div className="game-status win">{winner === mySocketId ? "VICTORY!" : "DEFEAT"}</div>}
        
        <div className="controls-hint">
            Mash <strong>SPACE</strong> to Run! Press <strong>ENTER</strong> to Jump!
        </div>

        {/* Fortschrittsbalken */}
        <div className="progress-bar-container">
             <div className="progress-track">
                 {Object.entries(runners).map(([id, r]) => (
                     <div 
                        key={id} 
                        className="progress-dot"
                        style={{ 
                            left: `${(r.x / trackLength) * 100}%`,
                            backgroundColor: r.color
                        }}
                     ></div>
                 ))}
                 <div className="progress-finish"></div>
             </div>
        </div>

        {/* Das Spiel-Fenster */}
        <div className="track-window">
            <div 
                className="world-container" 
                style={{ transform: `translateX(${cameraOffset}px)` }}
            >
                {/* Boden und Hintergrund */}
                <div className="track-sky"></div>
                <div className="track-floor">
                    <div className="track-lines"></div>
                </div>

                {/* Ziellinie */}
                <div className="finish-line" style={{ left: trackLength }}>
                    <div className="finish-banner">FINISH</div>
                    <div className="finish-post left"></div>
                    <div className="finish-post right"></div>
                </div>

                {/* Hürden (Neues Design via CSS) */}
                {hurdles.map((hx, i) => (
                    <div 
                        key={i} 
                        className="hurdle"
                        style={{ left: hx }}
                    >
                        <div className="hurdle-top-bar"></div>
                        <div className="hurdle-stand left"></div>
                        <div className="hurdle-stand right"></div>
                    </div>
                ))}

                {/* Spieler (Neues detailliertes Design) */}
                {Object.entries(runners).map(([id, r]) => {
                    // Prüfen ob Running-Animation aktiv sein soll
                    const isRunning = r.speed > 1 && r.y === 0 && !r.stumbled;
                    const animClass = isRunning ? 'running' : r.stumbled ? 'stumbled' : '';
                    
                    return (
                    <div 
                        key={id}
                        className={`runner-container ${id === mySocketId ? 'me' : 'enemy'}`}
                        style={{
                            left: r.x,
                            bottom: r.y + 20, // +20 wegen Bodenhöhe
                        }}
                    >
                        <div className={`runner-sprite ${animClass}`}>
                            <div className="head"></div>
                            {/* Torso bekommt die Spielerfarbe */}
                            <div className="torso" style={{ backgroundColor: r.color }}></div>
                            
                            {/* Gliedmaßen (Limbs) */}
                            <div className="limb arm left"></div>
                            <div className="limb arm right"></div>
                            <div className="limb leg left"></div>
                            <div className="limb leg right"></div>
                        </div>
                    </div>
                )})}
            </div>
        </div>
        
        <div className="speedometer">
            Speed: {Math.round(myRunner?.speed * 10) || 0} km/h
        </div>
    </div>
  );
};

export default Hurdles;