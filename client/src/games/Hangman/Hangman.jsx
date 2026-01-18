import React, { useState } from 'react';
import './Hangman.css';

const Hangman = ({ socket, roomId, gameState, mySocketId }) => {
  const { maskedWord, lives, guessedLetters, turnIndex, players, winner, gameOverMsg, word } = gameState;

  const isMyTurn = players[turnIndex] === mySocketId;
  const opponentId = players.find(id => id !== mySocketId);
  
  const [solveInput, setSolveInput] = useState("");

  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const handleLetterClick = (letter) => {
      if (!isMyTurn || winner || guessedLetters.includes(letter)) return;
      socket.emit("hangman_guess", { roomId, type: 'LETTER', value: letter });
  };

  const handleSolveSubmit = (e) => {
      e.preventDefault();
      if (!isMyTurn || winner || !solveInput.trim()) return;
      socket.emit("hangman_guess", { roomId, type: 'WORD', value: solveInput.toUpperCase() });
      setSolveInput("");
  };

  // Hilfsfunktion: Galgen zeichnen (SVG)
  const renderHangman = (livesLeft) => {
      const mistakes = 5 - livesLeft;
      // Stufen: 1=Boden, 2=Stange, 3=Balken/Seil, 4=Kopf, 5=Körper/Arme/Beine (Tod)
      return (
          <svg viewBox="0 0 100 120" className="hangman-svg">
              {/* Basis immer da, oder erst bei Fehler? Wir machen Fehler-basiert */}
              <line x1="10" y1="110" x2="90" y2="110" className={`draw ${mistakes >= 1 ? 'show' : ''}`} />
              <line x1="30" y1="110" x2="30" y2="10" className={`draw ${mistakes >= 2 ? 'show' : ''}`} />
              <line x1="30" y1="10" x2="70" y2="10" className={`draw ${mistakes >= 3 ? 'show' : ''}`} />
              <line x1="70" y1="10" x2="70" y2="30" className={`draw ${mistakes >= 3 ? 'show' : ''}`} />
              
              <circle cx="70" cy="40" r="10" className={`draw ${mistakes >= 4 ? 'show' : ''}`} />
              
              {/* Körper komplett bei 5 */}
              <g className={`draw ${mistakes >= 5 ? 'show' : ''}`}>
                  <line x1="70" y1="50" x2="70" y2="90" />
                  <line x1="70" y1="60" x2="50" y2="50" />
                  <line x1="70" y1="60" x2="90" y2="50" />
                  <line x1="70" y1="90" x2="50" y2="110" />
                  <line x1="70" y1="90" x2="90" y2="110" />
              </g>
          </svg>
      );
  };

  return (
    <div className="hangman-container">
        {/* TOP: Status Bars */}
        <div className="hm-status-bar">
            <div className={`player-status ${isMyTurn ? 'active' : ''}`}>
                <div className="label">YOU</div>
                {renderHangman(lives[mySocketId])}
                <div className="lives-text">Lives: {lives[mySocketId]}/5</div>
            </div>
            
            <div className="vs-badge">VS</div>

            <div className={`player-status ${!isMyTurn ? 'active' : ''}`}>
                <div className="label">OPPONENT</div>
                {renderHangman(lives[opponentId])}
                <div className="lives-text">Lives: {lives[opponentId]}/5</div>
            </div>
        </div>

        {/* CENTER: Word */}
        <div className="hm-board">
            {winner ? (
                <div className="game-over-box">
                    <div className="res-msg">{winner === mySocketId ? "VICTORY!" : "DEFEAT"}</div>
                    <div className="res-sub">{gameOverMsg}</div>
                    <div className="reveal-word">Word was: {word || maskedWord.join("")}</div>
                </div>
            ) : (
                <div className="word-display">
                    {maskedWord.map((char, i) => (
                        <span key={i} className={`char ${char === '_' ? 'empty' : 'revealed'}`}>
                            {char}
                        </span>
                    ))}
                </div>
            )}
        </div>

        {/* BOTTOM: Controls */}
        <div className="hm-controls">
            {/* Keyboard */}
            <div className="keyboard">
                {ALPHABET.map(l => {
                    const used = guessedLetters.includes(l);
                    return (
                        <button 
                            key={l} 
                            className={`key-btn ${used ? 'used' : ''}`}
                            disabled={used || !isMyTurn || winner}
                            onClick={() => handleLetterClick(l)}
                        >
                            {l}
                        </button>
                    )
                })}
            </div>

            {/* Solve Input */}
            <form className="solve-form" onSubmit={handleSolveSubmit}>
                <input 
                    type="text" 
                    placeholder="Know the word?" 
                    value={solveInput}
                    onChange={e => setSolveInput(e.target.value)}
                    disabled={!isMyTurn || winner}
                />
                <button type="submit" disabled={!isMyTurn || winner || !solveInput}>
                    SOLVE
                </button>
            </form>
            
            <div className="turn-hint">
                {winner ? "Game Over" : (isMyTurn ? "YOUR TURN!" : "Waiting for opponent...")}
            </div>
        </div>
    </div>
  );
};

export default Hangman;