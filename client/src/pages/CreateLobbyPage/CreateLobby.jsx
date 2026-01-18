import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateLobby.css';
import { AVAILABLE_GAMES } from '../../utils/gameList'; // Deine zentrale Liste

const CreateLobby = ({ socket, userInfo }) => {
  const navigate = useNavigate();

  const [roomId, setRoomId] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  
  // Standardmäßig alle echten Spiele auswählen (nicht die gelockten)
  const [selectedGameIds, setSelectedGameIds] = useState(
      AVAILABLE_GAMES.filter(g => !g.isLocked).map(g => g.id)
  );

  const handleRoomIdChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 4) {
      setRoomId(value);
    }
  };

  const toggleGameSelection = (gameId) => {
    if (selectedGameIds.includes(gameId)) {
      setSelectedGameIds(selectedGameIds.filter(id => id !== gameId));
    } else {
      setSelectedGameIds([...selectedGameIds, gameId]);
    }
  };

  const handleCreateLobby = () => {
    if (roomId.length < 1) {
      alert("Please enter a Room ID");
      return;
    }
    
    // Daten an den Room weitergeben
    navigate(`/room/${roomId}`, {
        state: {
            initialGames: selectedGameIds,
            isPrivate: isPrivate
        }
    });
  };

  return (
    <div className="create-lobby-container">
      {/* LINKE SPALTE */}
      <div className="left-panel">
        <div className="settings-top">
          <label className="input-label">Lobby Settings</label>
          <input 
            type="text" 
            className="room-id-input" 
            placeholder="Room-ID"
            value={roomId}
            onChange={handleRoomIdChange}
          />
          <label className="checkbox-container">
            Private Room
            <input 
              type="checkbox" 
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            <span className="checkmark"></span>
          </label>
        </div>
        
        {/* Buttons unten */}
        <div className="settings-bottom">
          <button className="create-lobby-btn" onClick={handleCreateLobby}>
            Create Lobby
          </button>
          <button 
            className="create-lobby-btn" 
            style={{ 
                marginTop: '15px', 
                background: 'transparent', 
                border: '2px solid #4dfff3', 
                color: '#4dfff3' 
            }} 
            onClick={() => navigate('/home')}
          >
            Back to Home
          </button>
        </div>
      </div>

      {/* RECHTE SPALTE (Spiele Auswahl) */}
      <div className="right-panel">
        <h2 className="games-headline">Select allowed games</h2>
        <div className="games-scroll-area">
            <div className="games-grid">
                {AVAILABLE_GAMES.map((game) => {
                    const isSelected = selectedGameIds.includes(game.id);
                    const isLocked = game.isLocked;

                    return (
                        <div 
                            key={game.id} 
                            className={`game-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => !isLocked && toggleGameSelection(game.id)}
                            style={{ 
                                opacity: isLocked ? 0.5 : 1, 
                                cursor: isLocked ? 'not-allowed' : 'pointer',
                                filter: isLocked ? 'grayscale(1)' : 'none'
                            }}
                        >
                            {/* Wir nutzen dein bestehendes CSS für den Placeholder, zentrieren aber das Emoji darin */}
                            <div className="game-icon-placeholder" style={{
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center', 
                                fontSize: '2.5rem',
                                background: 'rgba(255,255,255,0.05)' // Leicht transparent wie im CSS
                            }}>
                                {game.icon}
                            </div>
                            <span className="game-name">{game.name}</span>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CreateLobby;