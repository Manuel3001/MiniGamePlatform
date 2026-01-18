import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages Import
import StartPage from './pages/StartPage/StartPage';
import HomePage from './pages/HomePage/HomePage';
import CreateLobby from './pages/CreateLobbyPage/CreateLobby';
import JoinLobby from './pages/JoinLobbyPage/JoinLobby';
import GameRoom from './pages/GameRoom/GameRoom';

// CSS Import (falls du die App.css erstellt hast, sonst weglassen oder leer lassen)
import './App.css';

import { socket } from './socket';

function App() {
  const [userInfo, setUserInfo] = useState({
    username: '',
    avatar: '👤',
    points: 0
  });

  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* --- KORREKTUR HIER: socket Prop hinzugefügt --- */}
          <Route 
            path="/" 
            element={<StartPage socket={socket} setUserInfo={setUserInfo} />} 
          />

          <Route path="/home" element={<HomePage userInfo={userInfo} />} />

          <Route 
            path="/create-lobby" 
            element={<CreateLobby socket={socket} userInfo={userInfo} />} 
          />

          <Route 
            path="/join-lobby" 
            element={<JoinLobby socket={socket} userInfo={userInfo} />} 
          />

          <Route 
            path="/room/:roomId" 
            element={<GameRoom socket={socket} userInfo={userInfo} />} 
          />

          {/* Fallback */}
          <Route path="/game/:roomId" element={<Navigate to="/room/:roomId" replace />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;