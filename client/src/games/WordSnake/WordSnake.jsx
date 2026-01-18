import React, { useState, useEffect, useRef } from 'react';
import './WordSnake.css';

const WordSnake = ({ socket, roomId, gameState, mySocketId }) => {
  const { timeBanks, turnIndex, players, lastWord, requiredLetter, usedWords, winner, message, msgTarget } = gameState;

  const [inputWord, setInputWord] = useState("");
  const inputRef = useRef(null);
  const wordsEndRef = useRef(null);

  const isMyTurn = players[turnIndex] === mySocketId;
  const opponentId = players.find(id => id !== mySocketId);
  const myTime = timeBanks[mySocketId];
  const oppTime = timeBanks[opponentId];

  // Auto-Focus und Scrollen
  useEffect(() => {
      if (isMyTurn && inputRef.current && !winner) {
          inputRef.current.focus();
      }
      // Scroll zur letzten Antwort
      wordsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isMyTurn, usedWords, winner]);

  const handleSubmit = (e) => {
      e.preventDefault();
      if (!inputWord.trim() || !isMyTurn) return;
      
      socket.emit("word_submit", { roomId, word: inputWord });
      setInputWord("");
  };

  return (
    <div className="ws-container">
        {/* TIMER BAR */}
        <div className="ws-timers">
            <div className={`timer-box ${isMyTurn ? 'active' : ''} ${myTime < 10 ? 'danger' : ''}`}>
                <div className="label">YOU</div>
                <div className="time">{Math.max(0, myTime).toFixed(1)}s</div>
            </div>
            <div className={`timer-box ${!isMyTurn ? 'active' : ''} ${oppTime < 10 ? 'danger' : ''}`}>
                <div className="label">OPP</div>
                <div className="time">{Math.max(0, oppTime).toFixed(1)}s</div>
            </div>
        </div>

        {/* GAME AREA */}
        <div className="ws-board">
            {winner ? (
                <div className="ws-winner">
                    {winner === mySocketId ? "🎉 VICTORY! 🎉" : "💀 TIME OUT!"}
                </div>
            ) : (
                <>
                    <div className="ws-instruction">
                        Previous word: <span className="highlight">{lastWord}</span>
                    </div>
                    <div className="ws-instruction sub">
                        Find a word starting with: <span className="big-letter">{requiredLetter}</span>
                    </div>
                </>
            )}

            {/* ERROR MESSAGE */}
            {message && msgTarget === mySocketId && (
                <div className="ws-error">{message}</div>
            )}

            {/* WORD CHAIN */}
            <div className="ws-chain">
                {usedWords.map((w, i) => (
                    <div key={i} className="chain-word">
                        {w} {i < usedWords.length - 1 && <span className="arrow">→</span>}
                    </div>
                ))}
                <div ref={wordsEndRef} />
            </div>
        </div>

        {/* INPUT */}
        <form className="ws-input-area" onSubmit={handleSubmit}>
            <input 
                ref={inputRef}
                type="text" 
                value={inputWord}
                onChange={(e) => setInputWord(e.target.value)}
                placeholder={isMyTurn ? `Type word starting with ${requiredLetter}...` : "Opponent is thinking..."}
                disabled={!isMyTurn || winner}
                maxLength={20}
            />
            <button type="submit" disabled={!isMyTurn || winner}>SEND</button>
        </form>
    </div>
  );
};

export default WordSnake;