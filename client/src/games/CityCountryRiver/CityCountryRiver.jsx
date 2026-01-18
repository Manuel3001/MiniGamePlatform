import React, { useState, useEffect, useRef } from 'react';
import './CityCountryRiver.css';

const CATEGORIES = ["Stadt", "Land", "Fluss", "Tier", "Name"];

const CityCountryRiver = ({ socket, roomId, gameState, mySocketId }) => {
  const { phase, currentLetter, timeLeft, answers, reviews, roundResults, round, maxRounds, winner, players } = gameState;

  // Lokaler State
  const [myInputs, setMyInputs] = useState({}); 
  const [myReviews, setMyReviews] = useState({}); 
  
  // Hilfs-States für UI-Logik
  const [reviewInitialized, setReviewInitialized] = useState(false);
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);

  // 1. Inputs resetten bei neuer Runde
  useEffect(() => {
      if (phase === 'WRITING') {
          setMyInputs({});
          setReviewInitialized(false);
          setHasSubmittedReview(false);
      }
  }, [round, phase]);

  // 2. Reviews INITIALISIEREN (Nur einmal pro Phase!)
  useEffect(() => {
      if (phase === 'REVIEW' && !reviewInitialized && reviews[mySocketId]) {
          setMyReviews(reviews[mySocketId]); // Server-Daten laden
          setReviewInitialized(true);        // Markieren als geladen
      }
  }, [phase, reviews, mySocketId, reviewInitialized]);

  const opponentId = players.find(id => id !== mySocketId);

  // --- HANDLER ---
  const handleInputChange = (idx, val) => {
      setMyInputs(prev => ({ ...prev, [idx]: val }));
  };

  const submitInputs = () => {
      // Inputs senden (optional: Button deaktivieren bis Phase wechselt)
      socket.emit("city_submit", { roomId, inputs: myInputs });
  };

  const toggleReview = (idx) => {
      if (hasSubmittedReview) return; // Nicht mehr ändern wenn schon abgeschickt
      setMyReviews(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const submitReview = () => {
      socket.emit("city_review", { roomId, reviewData: myReviews });
      setHasSubmittedReview(true); // UI auf "Warten" setzen
  };

  const nextRound = () => {
      socket.emit("city_next", { roomId });
  };

  // --- RENDERER ---
  
  // 1. ANIMATION PHASE
  if (phase === 'LETTER_ANIM') {
      return (
          <div className="ccr-container centered">
              <h2>Round {round} / {maxRounds}</h2>
              <div className="letter-display animate">{currentLetter}</div>
              <p>Get Ready...</p>
          </div>
      );
  }

  // 2. SCHREIB PHASE
  if (phase === 'WRITING') {
      return (
          <div className="ccr-container scrollable">
              <div className="ccr-content">
                  <div className="ccr-header">
                      <div className="letter-badge">{currentLetter}</div>
                      <div className="timer-badge" style={{color: timeLeft < 10 ? '#ff5252' : 'white'}}>
                          {Math.ceil(timeLeft)}s
                      </div>
                  </div>

                  <div className="ccr-grid input-mode">
                      {CATEGORIES.map((cat, idx) => (
                          <div key={idx} className="ccr-field">
                              <label>{cat}</label>
                              <input 
                                  type="text" 
                                  value={myInputs[idx] || ""}
                                  onChange={(e) => handleInputChange(idx, e.target.value)}
                                  placeholder={`${cat} starts with ${currentLetter}...`}
                                  autoFocus={idx === 0}
                                  autoComplete="off"
                              />
                          </div>
                      ))}
                  </div>
                  
                  <button className="ccr-btn submit" onClick={submitInputs}>
                      DONE!
                  </button>
              </div>
          </div>
      );
  }

  // 3. REVIEW PHASE
  if (phase === 'REVIEW') {
      const oppAnswers = answers[opponentId] || {};
      return (
          <div className="ccr-container scrollable">
              <div className="ccr-content">
                  <h3>Check Opponent's Answers</h3>
                  
                  {!hasSubmittedReview ? (
                      <>
                        <p className="hint">Click to mark <span style={{color:'#ff1744', fontWeight:'bold'}}>WRONG</span> answers.</p>
                        
                        <div className="ccr-grid review-mode">
                            {CATEGORIES.map((cat, idx) => {
                                const ans = oppAnswers[idx] || "-";
                                const isValid = myReviews[idx]; // true/undefined = grün, false = rot
                                
                                // Fallback: Wenn noch nicht initialisiert, nimm an es ist richtig (true)
                                const displayValid = isValid !== false; 

                                return (
                                    <div 
                                        key={idx} 
                                        className={`ccr-review-card ${displayValid ? 'valid' : 'invalid'}`}
                                        onClick={() => toggleReview(idx)}
                                    >
                                        <div className="cat-label">{cat}</div>
                                        <div className="ans-text">{ans === "" ? "no answer" : ans}</div>
                                        <div className="status-icon">{displayValid ? '✅' : '❌'}</div>
                                    </div>
                                );
                            })}
                        </div>

                        <button className="ccr-btn review" onClick={submitReview}>
                            CONFIRM REVIEW
                        </button>
                      </>
                  ) : (
                      <div className="waiting-msg">
                          <div className="spinner">⏳</div>
                          <p>Waiting for opponent...</p>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  // 4. ROUND RESULTS
  if (phase === 'ROUND_END' || winner) {
      const myRes = roundResults?.[mySocketId] || {};
      const oppRes = roundResults?.[opponentId] || {};

      return (
          <div className="ccr-container scrollable">
              <div className="ccr-content">
                  {winner ? (
                      <h1 className="win-msg">{winner === mySocketId ? "VICTORY!" : winner === 'DRAW' ? "DRAW!" : "DEFEAT"}</h1>
                  ) : (
                      <h3>Round {round} Results</h3>
                  )}
                  
                  <div className="results-table">
                      <div className="row header">
                          <div style={{textAlign:'left'}}>Category</div>
                          <div>You ({myRes.total || 0})</div>
                          <div>Opp ({oppRes.total || 0})</div>
                      </div>
                      {CATEGORIES.map((cat, idx) => (
                          <div key={idx} className="row">
                              <div className="cat">{cat}</div>
                              <div className={`pts ${myRes.points?.[idx] > 0 ? 'good' : 'bad'}`}>
                                  <div className="res-word">{myRes.answers?.[idx] || "-"}</div>
                                  <div className="res-score">+{myRes.points?.[idx]}</div>
                              </div>
                              <div className={`pts ${oppRes.points?.[idx] > 0 ? 'good' : 'bad'}`}>
                                  <div className="res-word">{oppRes.answers?.[idx] || "-"}</div>
                                  <div className="res-score">+{oppRes.points?.[idx]}</div>
                              </div>
                          </div>
                      ))}
                  </div>

                  {!winner && (
                      <button className="ccr-btn next" onClick={nextRound}>
                          NEXT ROUND
                      </button>
                  )}
              </div>
          </div>
      );
  }

  return null;
};

export default CityCountryRiver;