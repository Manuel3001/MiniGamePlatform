import React from 'react';
import './Memory.css';

const Memory = ({ socket, roomId, gameState, mySocketId }) => {
  const { cards, scores, turnIndex, players, winner } = gameState;
  
  const isMyTurn = players[turnIndex] === mySocketId;
  const opponentId = players.find(id => id !== mySocketId);

  const handleCardClick = (cardId) => {
      if (!isMyTurn || winner) return;
      socket.emit("memory_flip", { roomId, cardId });
  };

  return (
    <div className="mem-container">
        {/* HUD */}
        <div className="mem-hud">
            <div className={`player-score ${isMyTurn ? 'active' : ''}`}>
                <div className="label">YOU</div>
                <div className="score">{scores[mySocketId]}</div>
            </div>
            
            <div className="status-msg">
                {winner ? (winner === mySocketId ? "VICTORY" : "DEFEAT") : (isMyTurn ? "YOUR TURN" : "OPPONENT'S TURN")}
            </div>

            <div className={`player-score ${!isMyTurn ? 'active' : ''}`}>
                <div className="label">OPP</div>
                <div className="score">{scores[opponentId]}</div>
            </div>
        </div>

        {/* GRID */}
        <div className="mem-grid">
            {cards.map((card) => {
                // Klasse berechnen
                let cardClass = "mem-card";
                if (card.isFlipped) cardClass += " flipped";
                if (card.isMatched) {
                    cardClass += " matched";
                    cardClass += card.owner === mySocketId ? " mine" : " theirs";
                }

                return (
                    <div 
                        key={card.id} 
                        className={cardClass}
                        onClick={() => handleCardClick(card.id)}
                    >
                        <div className="card-inner">
                            <div className="card-front">❓</div>
                            <div className="card-back">{card.icon}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
};

export default Memory;