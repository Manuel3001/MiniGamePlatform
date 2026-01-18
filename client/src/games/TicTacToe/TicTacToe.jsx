import React from 'react';
import './TicTacToe.css';

const TicTacToe = ({ socket, roomId, gameState, isMyTurn }) => {
  const { board, symbols, winner, isDraw } = gameState;

  const handleCellClick = (rowIndex, colIndex) => {
    if (!isMyTurn || winner || board[rowIndex][colIndex]) return;

    socket.emit("make_move", {
      roomId,
      moveData: { row: rowIndex, col: colIndex }
    });
  };

  return (
    <div className="ttt-container">
      <h2>Tic Tac Toe (10x10) - 5 to Win</h2>
      {winner && <div className="game-status win">Winner: {winner === socket.id ? "YOU!" : "Opponent"}</div>}
      {isDraw && <div className="game-status draw">Draw!</div>}
      {!winner && !isDraw && <div className="game-status">{isMyTurn ? "Your Turn" : "Waiting for opponent..."}</div>}

      <div className="ttt-grid">
        {board.map((row, rIndex) => (
          <div key={rIndex} className="ttt-row">
            {row.map((cell, cIndex) => (
              <div 
                key={cIndex} 
                className={`ttt-cell ${cell ? cell : ''} ${!cell && isMyTurn && !winner ? 'clickable' : ''}`}
                onClick={() => handleCellClick(rIndex, cIndex)}
              >
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TicTacToe;