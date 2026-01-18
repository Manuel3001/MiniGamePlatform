import React from 'react';
import './ColorMatch.css';

const ColorMatch = ({ socket, roomId, gameState, mySocketId }) => {
  const { tasks, scores, timeLeft, players, winner } = gameState;
  
  const myTask = tasks[mySocketId];
  const opponentId = players.find(id => id !== mySocketId);
  
  const handleAnswer = (ans) => {
      if (winner) return;
      socket.emit("colormatch_answer", { roomId, answer: ans });
  };

  return (
    <div className="cm-container">
        {/* HUD */}
        <div className="cm-hud">
            <div className="score-box me">
                <div className="lbl">YOU</div>
                <div className="val">{scores[mySocketId]}</div>
            </div>
            
            <div className="timer-display" style={{color: timeLeft <= 5 ? '#ff1744' : 'white'}}>
                {Math.ceil(timeLeft)}s
            </div>

            <div className="score-box opp">
                <div className="lbl">OPP</div>
                <div className="val">{scores[opponentId]}</div>
            </div>
        </div>

        {/* GAME AREA */}
        <div className="cm-area">
            {winner ? (
                <div className="cm-result">
                    {winner === mySocketId ? "VICTORY!" : winner === "DRAW" ? "DRAW!" : "DEFEAT"}
                </div>
            ) : myTask ? (
                <>
                    <div className="cm-question">Does the text match the color?</div>
                    
                    <div className="cm-word-card">
                        <span style={{ color: myTask.color }}>
                            {myTask.word}
                        </span>
                    </div>

                    <div className="cm-controls">
                        <button className="cm-btn no" onClick={() => handleAnswer(false)}>NO</button>
                        <button className="cm-btn yes" onClick={() => handleAnswer(true)}>YES</button>
                    </div>
                </>
            ) : (
                <div>Loading...</div>
            )}
        </div>
        
        <div className="cm-hint">Speed is key! (+10 / -5 pts)</div>
    </div>
  );
};

export default ColorMatch;