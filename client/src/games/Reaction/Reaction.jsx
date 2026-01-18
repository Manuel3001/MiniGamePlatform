import React from 'react';
import './Reaction.css';

const Reaction = ({ socket, roomId, gameState, mySocketId }) => {
  const { status, message, scores, roundWinner, winner, players } = gameState;

  // Wir nutzen PointerDown für schnellste Reaktion auf Maus & Touch
  const handleInput = (e) => {
      // Verhindert Textmarkierung oder Scrollen beim Klicken
      if (e) e.preventDefault();
      
      console.log("Input detected!", status); // Debugging

      if (winner) return;

      // Klick an Server senden
      socket.emit("reaction_click", { roomId });
  };

  // Dynamische Klassen für den Hintergrund
  let bgClass = 'bg-waiting'; // Rot
  if (status === 'GREEN') bgClass = 'bg-go'; // Grün
  if (status === 'BLUE')  bgClass = 'bg-fake'; // Blau
  if (status === 'RESULT') bgClass = 'bg-result'; // Grau

  // Gegner ID
  const opponentId = players.find(id => id !== mySocketId);

  return (
    <div 
        className={`reaction-container ${bgClass}`} 
        onPointerDown={handleInput} // <--- WICHTIG: PointerDown deckt alles ab
    >
        
        {/* Score Header - pointer-events-none damit man nicht aus Versehen die Scorebox klickt statt das Spiel */}
        <div className="reaction-scores" style={{ pointerEvents: 'none' }}>
            <div className="score-box me">
                <div className="label">YOU</div>
                <div className="value">{scores[mySocketId]}</div>
            </div>
            <div className="vs">VS</div>
            <div className="score-box opp">
                <div className="label">OPP</div>
                <div className="value">{scores[opponentId]}</div>
            </div>
        </div>

        {/* Hauptinhalt - pointer-events-none damit Klicks auf Text zum Container durchgehen */}
        <div className="reaction-center" style={{ pointerEvents: 'none' }}>
            {winner ? (
                <div className="winner-msg">
                    {winner === mySocketId ? "VICTORY!" : "DEFEAT"}
                </div>
            ) : (
                <>
                    <div className="status-icon">
                        {status === 'WAITING' && '🛑'}
                        {status === 'GREEN' && '⚡'}
                        {status === 'BLUE' && '🚫'} 
                        {status === 'RESULT' && (roundWinner === mySocketId ? '😎' : '💀')}
                    </div>
                    <div className="main-text">{message}</div>
                    
                    {status === 'WAITING' && <div className="sub-text">(Wait for Green...)</div>}
                    {status === 'BLUE' && <div className="sub-text pulse-warning">DON'T CLICK!</div>}
                </>
            )}
        </div>
        
        <div className="click-hint">CLICK ANYWHERE ON GREEN</div>
    </div>
  );
};

export default Reaction;