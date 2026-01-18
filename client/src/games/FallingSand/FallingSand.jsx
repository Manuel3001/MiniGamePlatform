import React, { useEffect } from 'react';
import './FallingSand.css';

const FallingSand = ({ socket, roomId, gameState, mySocketId }) => {
  const { layers, players, winner } = gameState;

  // Steuerung
  useEffect(() => {
      const handleKeyDown = (e) => {
          if (winner) return;
          const key = e.key.toLowerCase();
          let dir = null;
          if (key === 'w' || key === 'arrowup') dir = 'UP';
          if (key === 's' || key === 'arrowdown') dir = 'DOWN';
          if (key === 'a' || key === 'arrowleft') dir = 'LEFT';
          if (key === 'd' || key === 'arrowright') dir = 'RIGHT';

          if (dir) socket.emit("fallingsand_move", { roomId, direction: dir });
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [socket, roomId, winner]);

  // Render Funktion für ein Grid
  const renderLayer = (layerData, layerIndex) => {
      return (
          <div className="fs-grid">
              <div className="fs-label">{layerIndex === 0 ? "TOP FLOOR" : "BOTTOM FLOOR"}</div>
              {layerData.map((row, y) => (
                  <div key={y} className="fs-row">
                      {row.map((cell, x) => {
                          // Spieler auf diesem Feld suchen
                          const pHere = players.find(p => p.alive && p.layer === layerIndex && p.x === x && p.y === y);
                          
                          let cellClass = 'fs-cell';
                          if (cell.state === 1) cellClass += ' cracking'; // Wackelt
                          if (cell.state === 2) cellClass += ' hole'; // Loch

                          return (
                              <div key={x} className={cellClass}>
                                  {pHere && (
                                      <div 
                                        className="fs-player"
                                        style={{ backgroundColor: pHere.color, border: pHere.id === mySocketId ? '2px solid white' : 'none' }}
                                      ></div>
                                  )}
                              </div>
                          );
                      })}
                  </div>
              ))}
          </div>
      );
  };

  return (
    <div className="fs-container">
        {winner && <div className="game-status win">{winner === mySocketId ? "VICTORY!" : "DEFEAT"}</div>}
        
        <div className="fs-boards">
            {renderLayer(layers[0], 0)}
            {renderLayer(layers[1], 1)}
        </div>
        
        <div className="controls-hint">Move with <strong>WASD</strong>. Don't fall!</div>
    </div>
  );
};

export default FallingSand;