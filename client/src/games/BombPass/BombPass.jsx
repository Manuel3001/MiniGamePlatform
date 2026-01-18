import React, { useState } from 'react';
import './BombPass.css';

const BombPass = ({ socket, roomId, gameState, mySocketId }) => {
  const { bombHolder, currentProblem, gameOver, winner, msg } = gameState;
  const hasBomb = bombHolder === mySocketId;
  const [answer, setAnswer] = useState("");

  const handleSubmit = (e) => {
      e.preventDefault();
      if (!hasBomb || gameOver) return;
      socket.emit("bomb_solve", { roomId, answer });
      setAnswer("");
  };

  return (
    <div className={`bp-container ${hasBomb ? 'panic' : 'safe'}`}>
        {gameOver ? (
            <div className="bp-overlay">{winner === mySocketId ? "SURVIVED!" : "EXPLODED!"}</div>
        ) : (
            <>
                <div className="bp-header">
                    {hasBomb ? "💣 YOU HAVE THE BOMB! 💣" : "Opponent has the bomb..."}
                </div>
                
                <div className="bp-bomb-visual">
                    {hasBomb ? "💣🔥" : "😌"}
                </div>

                {hasBomb ? (
                    <div className="bp-task">
                        <div className="math-prob">{currentProblem.text}</div>
                        <form onSubmit={handleSubmit}>
                            <input 
                                type="number" 
                                value={answer} 
                                onChange={e => setAnswer(e.target.value)} 
                                autoFocus 
                                placeholder="?"
                            />
                            <button type="submit">PASS</button>
                        </form>
                        <div className="hint">{msg}</div>
                    </div>
                ) : (
                    <div className="bp-waiting">Wait for it...</div>
                )}
            </>
        )}
    </div>
  );
};
export default BombPass;