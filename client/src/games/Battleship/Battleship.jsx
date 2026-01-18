import React, { useState } from 'react';
import './Battleship.css';

const SHIPS_CONFIG = [
    { name: 'Carrier', size: 5, id: 'C' },
    { name: 'Battleship', size: 4, id: 'B' },
    { name: 'Cruiser', size: 3, id: 'R' },
    { name: 'Submarine', size: 3, id: 'S' },
    { name: 'Destroyer', size: 2, id: 'D' }
];

const Battleship = ({ socket, roomId, gameState, mySocketId, isMyTurn }) => {
  const { phase, boards, shots, shipsSet, abilities, winner } = gameState;

  // Local State
  const [orientation, setOrientation] = useState('H');
  const [selectedTool, setSelectedTool] = useState('normal'); 
  const [torpedoAxis, setTorpedoAxis] = useState('row'); 

  const myBoard = boards[mySocketId];
  const myShots = shots[mySocketId];
  const myAbilities = abilities[mySocketId];
  const iAmReady = shipsSet[mySocketId];

  // Helper für Setup
  const placedIds = new Set(myBoard.flat().filter(x => x !== null));
  const currentShipIndex = SHIPS_CONFIG.findIndex(s => !placedIds.has(s.id));

  const handleCellClickSetup = (r, c) => {
      if (phase !== 'SETUP' || iAmReady) return;
      if (currentShipIndex === -1) return;

      socket.emit("battleship_place_ship", {
          roomId,
          placement: { row: r, col: c, orientation }
      });
  };

  const handleFinalizeSetup = () => {
      socket.emit("battleship_finalize_setup", { roomId });
  };

  const handleAttackClick = (r, c) => {
      if (phase !== 'PLAYING' || !isMyTurn || winner) return;

      let attackData = { row: r, col: c, type: selectedTool };
      if (selectedTool === 'torpedo') {
          attackData.axis = torpedoAxis;
      }

      socket.emit("battleship_attack", { roomId, attackData });
      if (selectedTool !== 'normal') setSelectedTool('normal');
  };

  if (phase === 'SETUP') {
      return (
          <div className="bs-container">
              <h2>Deploy your Fleet</h2>
              {!iAmReady ? (
                  <div className="setup-controls">
                      {currentShipIndex !== -1 ? (
                          <>
                              <p>Place: <strong>{SHIPS_CONFIG[currentShipIndex].name}</strong> ({SHIPS_CONFIG[currentShipIndex].size})</p>
                              <button onClick={() => setOrientation(orientation === 'H' ? 'V' : 'H')}>
                                  Rotate: {orientation === 'H' ? 'Horizontal' : 'Vertical'}
                              </button>
                          </>
                      ) : (
                          <div className="finish-area">
                              <p>All ships deployed!</p>
                              <button className="ready-btn-bs" onClick={handleFinalizeSetup}>FINISH DEPLOYMENT</button>
                          </div>
                      )}
                  </div>
              ) : (
                  <div className="waiting-msg">Waiting for opponent...</div>
              )}

              <div className="bs-grid">
                  {myBoard.map((row, r) => (
                      <div key={r} className="bs-row">
                          {row.map((cell, c) => (
                              <div 
                                key={c} 
                                className={`bs-cell ${cell ? 'ship' : ''} ${cell || ''}`}
                                onClick={() => handleCellClickSetup(r, c)}
                              >
                                {cell}
                              </div>
                          ))}
                      </div>
                  ))}
              </div>
          </div>
      );
  }

  return (
      <div className="bs-container play-mode">
          <h2>Battleship Duel</h2>
          {winner && <div className="game-status win">{winner === mySocketId ? "VICTORY!" : "DEFEAT"}</div>}
          
          {/* Turn Anzeige angepasst für "Noch mal schießen" */}
          <div className={`turn-indicator ${isMyTurn ? 'my-turn' : ''}`}>
             {isMyTurn ? "YOUR TURN - FIRE!" : "Enemy Turn - Take Cover!"}
          </div>

          <div className="boards-wrapper">
              <div className="board-section">
                  <h3>Target Grid</h3>
                  <div className="tools-menu">
                      <button className={selectedTool === 'normal' ? 'active' : ''} onClick={() => setSelectedTool('normal')}>Cannon</button>
                      <button className={selectedTool === 'satellite' ? 'active' : ''} disabled={myAbilities.satellite <= 0} onClick={() => setSelectedTool('satellite')}>Sat ({myAbilities.satellite})</button>
                      <button className={selectedTool === 'torpedo' ? 'active' : ''} disabled={myAbilities.torpedo <= 0} onClick={() => setSelectedTool('torpedo')}>Torpedo ({myAbilities.torpedo})</button>
                      {selectedTool === 'torpedo' && (
                          <button className="sub-tool" onClick={() => setTorpedoAxis(torpedoAxis === 'row' ? 'col' : 'row')}>Aim: {torpedoAxis === 'row' ? 'Row' : 'Col'}</button>
                      )}
                  </div>

                  <div className={`bs-grid ${isMyTurn && !winner ? 'active-target' : ''}`}>
                      {myShots.map((row, r) => (
                          <div key={r} className="bs-row">
                              {row.map((cell, c) => {
                                  // cell: null, HIT, MISS, SUNK, Tb_SHIP, Tb_WATER
                                  let className = "bs-cell fog";
                                  if (cell === 'HIT') className += " hit";
                                  if (cell === 'SUNK') className += " sunk"; // NEU
                                  if (cell === 'MISS') className += " miss";
                                  if (cell === 'Tb_SHIP') className += " revealed-ship";
                                  if (cell === 'Tb_WATER') className += " revealed-water";
                                  
                                  return (
                                    <div key={c} className={className} onClick={() => handleAttackClick(r, c)}>
                                        {(cell === 'HIT' || cell === 'SUNK') && 'X'}
                                        {cell === 'MISS' && '•'}
                                    </div>
                                  );
                              })}
                          </div>
                      ))}
                  </div>
              </div>

              <div className="board-section">
                  <h3>My Fleet</h3>
                  <div className="bs-grid">
                      {myBoard.map((row, r) => (
                          <div key={r} className="bs-row">
                              {row.map((cell, c) => {
                                  // Prüfen was der Gegner hier gemacht hat
                                  const opponentId = Object.keys(shots).find(id => id !== mySocketId);
                                  const enemyShot = opponentId ? shots[opponentId][r][c] : null;
                                  
                                  let className = `bs-cell ${cell ? 'ship' : 'water'}`;
                                  if (enemyShot === 'HIT') className += " damaged";
                                  if (enemyShot === 'SUNK') className += " destroyed"; // NEU: Ganz kaputt
                                  if (enemyShot === 'MISS') className += " splash";
                                  
                                  return (
                                    <div key={c} className={className}>
                                        {cell}
                                        {(enemyShot === 'HIT' || enemyShot === 'SUNK') && <span className="marker-x">X</span>}
                                    </div>
                                  );
                              })}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
  );
};

export default Battleship;