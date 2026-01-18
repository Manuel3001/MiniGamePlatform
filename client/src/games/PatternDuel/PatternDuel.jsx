import React, { useState, useEffect } from 'react';
import './PatternDuel.css';

const PatternDuel = ({ socket, roomId, gameState, mySocketId }) => {
  const { turnIndex, players, winner, msg, lastPressed, pressId } = gameState;
  const isMyTurn = players[turnIndex] === mySocketId;
  
  // Welcher Button soll gerade aufleuchten?
  const [activeFlash, setActiveFlash] = useState(null);

  // Wenn sich pressId ändert (neuer Klick vom Server), lassen wir es kurz aufleuchten
  useEffect(() => {
    if (lastPressed !== null) {
        setActiveFlash(lastPressed);
        // Nach 300ms Licht wieder ausmachen
        const timer = setTimeout(() => setActiveFlash(null), 300);
        return () => clearTimeout(timer);
    }
  }, [pressId, lastPressed]);

  const handleBtnClick = (idx) => {
      if (!isMyTurn || winner) return;
      // Lokal sofort Feedback geben (fühlt sich schneller an)
      setActiveFlash(idx);
      socket.emit("pattern_click", { roomId, btnIndex: idx });
  };

  const colors = ['#00e676', '#ff1744', '#ffd700', '#2979ff']; 

  return (
    <div className={`pd-container ${isMyTurn ? 'my-turn' : ''}`}>
        {winner && <div className="pd-overlay">{winner === mySocketId ? "VICTORY!" : "DEFEAT"}</div>}
        
        <div className="pd-header">
            <h3>{isMyTurn ? "YOUR TURN" : "OPPONENT'S TURN"}</h3>
            <p>{msg}</p>
        </div>

        <div className="pd-grid">
            {colors.map((col, i) => {
                // Button leuchtet nur, wenn er im "activeFlash" state ist
                const isActive = activeFlash === i;
                return (
                    <div 
                        key={i} 
                        className={`pd-btn ${isActive ? 'active' : ''}`}
                        style={{ backgroundColor: col, color: col }} 
                        onMouseDown={() => handleBtnClick(i)}
                    ></div>
                )
            })}
        </div>
        <div className="pd-hint">Repeat sequence + Add one step</div>
    </div>
  );
};
export default PatternDuel;