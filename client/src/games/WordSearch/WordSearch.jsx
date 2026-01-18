import React, { useState, useRef } from 'react';
import './WordSearch.css';

const WordSearch = ({ socket, roomId, gameState, mySocketId }) => {
  const { grid, scores, timeLeft, foundWords, winner, players } = gameState;
  
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentPos, setCurrentPos] = useState(null);

  const opponentId = players.find(id => id !== mySocketId);

  // Helper: Prüfen ob Zelle Teil der aktuellen Auswahl ist
  const isInSelection = (r, c) => {
      if (!isSelecting || !startPos || !currentPos) return false;
      
      // Einfache Linienberechnung
      const sx = startPos.c; const sy = startPos.r;
      const ex = currentPos.c; const ey = currentPos.r;
      
      // Prüfen ob Zelle auf der Linie liegt
      // 1. Länge der Linie
      const dx = ex - sx; const dy = ey - sy;
      const steps = Math.max(Math.abs(dx), Math.abs(dy));
      if (steps === 0) return r === sy && c === sx;

      const xInc = dx / steps;
      const yInc = dy / steps;

      for (let i = 0; i <= steps; i++) {
          const checkX = Math.round(sx + xInc * i);
          const checkY = Math.round(sy + yInc * i);
          if (checkY === r && checkX === c) return true;
      }
      return false;
  };

  // Helper: Prüfen ob Zelle zu einem gefundenen Wort gehört
  // (Das ist etwas aufwendig im Rendering, für Performance könnte man das optimieren, 
  // aber bei 20x20 ist React schnell genug)
  const getOwnerClass = (r, c) => {
      // Wir müssen wissen, ob r/c Teil eines gefundenen Wortes ist.
      // Da der Server uns nur das Wort und den Owner schickt, und nicht die Koordinaten der gefundenen Wörter im "foundWords" Objekt (nur im hiddenWords, was wir hier nicht direkt nutzen wollen um nicht zu cheaten),
      // müssen wir dem Client eigentlich die Koordinaten der gefundenen Wörter schicken.
      
      // KORREKTUR: Der Client sollte wissen, WO die gefundenen Wörter sind.
      // Der Einfachheit halber: Der Server schickt 'foundWords' als Map: WORD -> Owner.
      // Wir haben aber 'hiddenWords' im State nicht für den Client sichtbar gemacht? 
      // Doch, im 'createGameState' wurde es dem State hinzugefügt. Das ist unsicher (Cheating via Console), aber für dieses Projekt okay.
      
      const hiddenWords = gameState.hiddenWords; // { WORD: { start, end } }
      
      for (const [word, owner] of Object.entries(foundWords)) {
          const info = hiddenWords[word];
          if (!info) continue;
          
          // Check ob r/c auf der Linie liegt
          const sx = info.start.x; const sy = info.start.y;
          const ex = info.end.x; const ey = info.end.y;
          
          // Ist (c, r) auf dieser Linie?
          const dx = ex - sx; const dy = ey - sy;
          const steps = Math.max(Math.abs(dx), Math.abs(dy));
          const xInc = dx / steps;
          const yInc = dy / steps;

          for (let i = 0; i <= steps; i++) {
               if (Math.round(sy + yInc * i) === r && Math.round(sx + xInc * i) === c) {
                   return owner === mySocketId ? 'found-me' : 'found-opp';
               }
          }
      }
      return '';
  };

  const handleMouseDown = (r, c) => {
      if (winner) return;
      setIsSelecting(true);
      setStartPos({ r, c });
      setCurrentPos({ r, c });
  };

  const handleMouseEnter = (r, c) => {
      if (isSelecting) {
          setCurrentPos({ r, c });
      }
  };

  const handleMouseUp = () => {
      if (!isSelecting) return;
      setIsSelecting(false);
      
      // Auswahl an Server senden
      if (startPos && currentPos) {
        socket.emit("wordsearch_select", { 
            roomId, 
            selection: { 
                start: { x: startPos.c, y: startPos.r }, 
                end: { x: currentPos.c, y: currentPos.r } 
            } 
        });
      }
      setStartPos(null);
      setCurrentPos(null);
  };

  return (
    <div className="ws-main" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        <div className="ws-hud">
            <div className="score-panel me">
                YOU: {scores[mySocketId]}
            </div>
            <div className="timer-panel" style={{color: timeLeft < 10 ? 'red' : 'white'}}>
                {Math.ceil(timeLeft)}s
            </div>
            <div className="score-panel opp">
                OPP: {scores[opponentId]}
            </div>
        </div>

        {winner && <div className="ws-winner-overlay">{winner === mySocketId ? "VICTORY!" : "DEFEAT"}</div>}

        <div className="ws-grid-container">
            {grid.map((row, r) => (
                <div key={r} className="ws-row">
                    {row.map((char, c) => {
                        const isSelected = isInSelection(r, c);
                        const ownerClass = getOwnerClass(r, c);
                        
                        return (
                            <div 
                                key={c} 
                                className={`ws-cell ${isSelected ? 'selecting' : ''} ${ownerClass}`}
                                onMouseDown={() => handleMouseDown(r, c)}
                                onMouseEnter={() => handleMouseEnter(r, c)}
                            >
                                {char}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
        <div className="ws-hint">Find words! Drag across letters.</div>
    </div>
  );
};

export default WordSearch;