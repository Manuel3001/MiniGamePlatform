import React, { useState } from 'react';
import './QuickQuiz.css';

const QuickQuiz = ({ socket, roomId, gameState, mySocketId }) => {
  const { questions, currentRound, phase, timeLeft, scores, answers, players, winner } = gameState;
  
  const currentQ = questions[currentRound];
  const opponentId = players.find(id => id !== mySocketId);
  const myAnswer = answers[mySocketId]; // { index: X } oder undefined

  const handleAnswerClick = (idx) => {
      if (phase !== 'ANSWER' || myAnswer) return;
      socket.emit("quiz_answer", { roomId, answerIndex: idx });
  };

  // Helper für Button-Styles
  const getBtnClass = (idx) => {
      let base = "quiz-btn";
      
      if (phase === 'REVEAL') {
          // Auflösung
          if (idx === currentQ.c) return base + " correct"; // Das war richtig
          if (myAnswer?.index === idx) return base + " wrong"; // Ich hab das falsch gewählt
          if (answers[opponentId]?.index === idx) return base + " opp-choice"; // Gegner hat das gewählt
          return base + " disabled";
      }

      if (phase === 'ANSWER') {
          if (myAnswer?.index === idx) return base + " selected"; // Meine Wahl
          if (myAnswer) return base + " disabled"; // Andere deaktivieren
      }

      return base;
  };

  return (
    <div className="quiz-container">
        {/* HUD */}
        <div className="quiz-hud">
            <div className="q-score me">
                <div className="lbl">YOU</div>
                <div className="val">{scores[mySocketId]}</div>
            </div>
            
            <div className="q-timer">
                {phase === 'QUESTION' ? "GET READY" : phase === 'REVEAL' ? "RESULT" : Math.ceil(timeLeft)}
            </div>

            <div className="q-score opp">
                <div className="lbl">OPP</div>
                <div className="val">{scores[opponentId]}</div>
            </div>
        </div>

        {/* MAIN AREA */}
        <div className="quiz-area">
            {winner ? (
                <div className="quiz-end">
                    {winner === mySocketId ? "VICTORY!" : winner === "DRAW" ? "DRAW!" : "DEFEAT"}
                    <div className="final-score">{scores[mySocketId]} - {scores[opponentId]}</div>
                </div>
            ) : (
                <>
                    <div className="round-badge">Round {currentRound + 1} / 11</div>
                    
                    <div className={`question-card ${phase === 'ANSWER' ? 'active' : ''}`}>
                        {currentQ.q}
                    </div>

                    {phase !== 'QUESTION' && (
                        <div className="answers-grid">
                            {currentQ.a.map((ans, idx) => (
                                <button 
                                    key={idx} 
                                    className={getBtnClass(idx)}
                                    onClick={() => handleAnswerClick(idx)}
                                    disabled={phase !== 'ANSWER' || myAnswer}
                                >
                                    {ans}
                                    {/* Indikator bei Reveal */}
                                    {phase === 'REVEAL' && answers[opponentId]?.index === idx && idx !== mySocketId && (
                                        <div className="opp-marker">OPP</div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                    
                    {phase === 'ANSWER' && myAnswer && !answers[opponentId] && (
                        <div className="wait-msg">Waiting for opponent...</div>
                    )}
                </>
            )}
        </div>
    </div>
  );
};

export default QuickQuiz;