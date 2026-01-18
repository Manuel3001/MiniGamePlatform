import React, { useState, useEffect, useRef } from 'react';
import './AnagramHunt.css';

const AnagramHunt = ({ socket, roomId, gameState, mySocketId }) => {
  const { scrambledWord, scores, players, winner, lastWinner, isWaiting } = gameState;
  
  const [guess, setGuess] = useState("");
  const inputRef = useRef(null);

  const opponentId = players.find(id => id !== mySocketId);
  
  // Fokus behalten & Reset bei neuer Runde
  useEffect(() => {
      if (!isWaiting && !winner) {
          setGuess("");
          inputRef.current?.focus();
      }
  }, [scrambledWord, isWaiting, winner]);

  const handleSubmit = (e) => {
      e.preventDefault();
      if (!guess.trim() || isWaiting || winner) return;
      socket.emit("anagram_submit", { roomId, guess: guess });
  };

  return (
    <div className="ah-container">
        {/* SCOREBOARD */}
        <div className="ah-hud">
            <div className={`ah-score-box ${lastWinner === mySocketId ? 'round-win' : ''}`}>
                <div className="lbl">YOU</div>
                <div className="val">{scores[mySocketId]}</div>
            </div>
            <div className="vs">VS</div>
            <div className={`ah-score-box ${lastWinner === opponentId ? 'round-win' : ''}`}>
                <div className="lbl">OPP</div>
                <div className="val">{scores[opponentId]}</div>
            </div>
        </div>

        {/* GAME AREA */}
        <div className="ah-area">
            {winner ? (
                <div className="ah-result">
                    {winner === mySocketId ? "VICTORY!" : "DEFEAT"}
                </div>
            ) : (
                <>
                    <div className="ah-label">Unscramble this word:</div>
                    
                    <div className={`ah-word-display ${isWaiting ? 'solved' : ''}`}>
                        {/* Wenn Runde vorbei (isWaiting), zeigen wir wer gewonnen hat oder das Wort? 
                            Das Backend schickt kein "solvedWord", aber da einer es richtig hatte,
                            können wir visuelles Feedback geben. */}
                        {isWaiting 
                            ? (lastWinner === mySocketId ? "CORRECT!" : "OPPONENT WAS FASTER!") 
                            : scrambledWord.split('').map((char, i) => (
                                <span key={i} className="char-tile">{char}</span>
                            ))
                        }
                    </div>

                    <form className="ah-input-form" onSubmit={handleSubmit}>
                        <input 
                            ref={inputRef}
                            type="text" 
                            value={guess}
                            onChange={(e) => setGuess(e.target.value.toUpperCase())}
                            placeholder="Type here..."
                            disabled={isWaiting || winner}
                            maxLength={20}
                        />
                        <button type="submit" disabled={isWaiting || winner}>SUBMIT</button>
                    </form>
                </>
            )}
        </div>
        
        <div className="ah-hint">First to 5 points wins!</div>
    </div>
  );
};

export default AnagramHunt;