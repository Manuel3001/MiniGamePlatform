import React from 'react';
import TicTacToe from '../games/TicTacToe/TicTacToe';
import Battleship from '../games/Battleship/Battleship';
import PingPong from '../games/PingPong/PingPong';
import TankDuel from '../games/TankDuel/TankDuel';
import Sumo from '../games/Sumo/Sumo';
import Hurdles from '../games/Hurdles/Hurdles';
import Archery from '../games/Archery/Archery';
import AirHockey from '../games/AirHockey/AirHockey';
import Reaction from '../games/Reaction/Reaction';
import Balloons from '../games/Balloons/Balloons';
import FallingSand from '../games/FallingSand/FallingSand'; // <--- NEU
import CityCountryRiver from '../games/CityCountryRiver/CityCountryRiver'; // Import
import WordSnake from '../games/WordSnake/WordSnake'; // Import
import Hangman from '../games/Hangman/Hangman'; // Import
import WordSearch from '../games/WordSearch/WordSearch'; // Import
import Memory from '../games/Memory/Memory'; // Import
import Snake from '../games/Snake/Snake';
import ColorMatch from '../games/ColorMatch/ColorMatch';
import AnagramHunt from '../games/AnagramHunt/AnagramHunt';
import QuickQuiz from '../games/QuickQuiz/QuickQuiz';
import PatternDuel from '../games/PatternDuel/PatternDuel';
import Catapult from '../games/Catapult/Catapult';
import BombPass from '../games/BombPass/BombPass';

const GameManager = ({ gameId, socket, roomId, gameState, mySocketId }) => {
  const isMyTurn = gameState.players[gameState.currentPlayerIndex] === mySocketId;

  switch (parseInt(gameId)) {
    case 0: return <TicTacToe socket={socket} roomId={roomId} gameState={gameState} isMyTurn={isMyTurn} />;
    case 1: return <Battleship socket={socket} roomId={roomId} gameState={gameState} mySocketId={mySocketId} isMyTurn={isMyTurn} />;
    case 2: return <PingPong socket={socket} roomId={roomId} gameState={gameState} mySocketId={mySocketId} />;
    case 3: return <TankDuel socket={socket} roomId={roomId} gameState={gameState} mySocketId={mySocketId} />;
    case 4: return <Sumo socket={socket} roomId={roomId} gameState={gameState} mySocketId={mySocketId} />;
    case 5: return <Hurdles socket={socket} roomId={roomId} gameState={gameState} mySocketId={mySocketId} />;
    case 6: return <Archery socket={socket} roomId={roomId} gameState={gameState} mySocketId={mySocketId} />;
    case 7: return <AirHockey socket={socket} roomId={roomId} gameState={gameState} mySocketId={mySocketId} />;
    case 8: return <Reaction socket={socket} roomId={roomId} gameState={gameState} mySocketId={mySocketId} />;
    case 9: return <Balloons socket={socket} roomId={roomId} gameState={gameState} mySocketId={mySocketId} />;
    case 10: return <FallingSand socket={socket} roomId={roomId} gameState={gameState} mySocketId={mySocketId} />; // <--- NEU
    case 11: return <CityCountryRiver socket={socket} roomId={roomId} gameState={gameState} mySocketId={mySocketId} />; // NEU
    case 12: return <WordSnake socket={socket} roomId={roomId} gameState={gameState} mySocketId={mySocketId} />; // NEU
    case 13: return <Hangman socket={socket} roomId={roomId} gameState={gameState} mySocketId={mySocketId} />; // 
    case 14: return <WordSearch socket={socket} roomId={roomId} gameState={gameState} mySocketId={mySocketId} />; // NEU
    case 15: return <Memory socket={socket} roomId={roomId} gameState={gameState} mySocketId={mySocketId} />; // NEU
    case 16: return <Snake socket={socket} roomId={roomId} gameState={gameState} mySocketId={mySocketId} />; // NEU
    case 17: return <ColorMatch socket={socket} roomId={roomId} gameState={gameState} mySocketId={mySocketId} />; // NEU
    case 18: return <AnagramHunt socket={socket} roomId={roomId} gameState={gameState} mySocketId={mySocketId} />; // NEU
    case 19: return <QuickQuiz socket={socket} roomId={roomId} gameState={gameState} mySocketId={mySocketId} />; // NEU
    case 20: return <PatternDuel socket={socket} roomId={roomId} gameState={gameState} mySocketId={mySocketId} />;
    case 21: return <Catapult socket={socket} roomId={roomId} gameState={gameState} mySocketId={mySocketId} />;
    case 22: return <BombPass socket={socket} roomId={roomId} gameState={gameState} mySocketId={mySocketId} />;
    default: return <div style={{color: 'white', marginTop: '50px'}}>Game ID {gameId} not implemented yet.</div>;
  }
};

export default GameManager;