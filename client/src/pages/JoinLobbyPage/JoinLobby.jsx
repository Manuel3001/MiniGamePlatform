import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './JoinLobby.css';
import { AVAILABLE_GAMES } from '../../utils/gameList'; 

const JoinLobby = ({ socket }) => { 
  const navigate = useNavigate();

  const [searchId, setSearchId] = useState('');
  const [myFilterGames, setMyFilterGames] = useState([]);
  const [selectedLobby, setSelectedLobby] = useState(null);
  const [activeLobbies, setActiveLobbies] = useState([]);

  // Lobbies vom Server laden
  useEffect(() => {
    socket.emit("request_lobbies");
    socket.on("lobbies_update", (data) => setActiveLobbies(data));
    return () => socket.off("lobbies_update");
  }, [socket]);

  // Filter-Logik
  const filteredAndSortedLobbies = useMemo(() => {
    let result = [...activeLobbies];

    // 1. Filter: Private & ID Suche
    result = result.filter(lobby => {
        // WICHTIG: Zugriff auf settings.isPrivate
        if (lobby.settings?.isPrivate) {
             // Wenn privat, NUR anzeigen, wenn exakte ID gesucht wird
            return searchId === lobby.id;
        }
        // Wenn nicht privat: ID Suche (Teilübereinstimmung erlaubt) oder alles zeigen
        if (searchId) return lobby.id.includes(searchId);
        return true;
    });

    // 2. Sortieren: Matches mit Filter
    if (myFilterGames.length > 0) {
      result.sort((a, b) => {
        // WICHTIG: Zugriff auf settings.creatorGames
        const gamesA = a.settings?.creatorGames || [];
        const gamesB = b.settings?.creatorGames || [];
        const matchesA = gamesA.filter(gId => myFilterGames.includes(gId)).length;
        const matchesB = gamesB.filter(gId => myFilterGames.includes(gId)).length;
        return matchesB - matchesA;
      });
    }
    return result;
  }, [searchId, myFilterGames, activeLobbies]);

  const toggleFilterGame = (gameId) => {
    if (myFilterGames.includes(gameId)) {
      setMyFilterGames(myFilterGames.filter(id => id !== gameId));
    } else {
      setMyFilterGames([...myFilterGames, gameId]);
    }
  };

  const handleJoin = () => {
    if (selectedLobby) {
      navigate(`/room/${selectedLobby.id}`);
    }
  };

  return (
    <div className="join-lobby-container">
      
      {/* --- LINKE SPALTE (Suche & Filter) --- */}
      <div className="col-left">
        <div className="search-section">
            <button style={{marginBottom: '15px', background: 'transparent', border: '1px solid #4dfff3', color: '#4dfff3', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer'}} onClick={() => navigate('/home')}>← Back</button>
            <label>Find specific Room</label>
            <input 
                type="text" 
                placeholder="Room-ID" 
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                maxLength={4}
            />
        </div>

        <div className="sort-section">
          <h3>Sort by selected games</h3>
          <div className="mini-games-list">
             {AVAILABLE_GAMES.map(game => {
               const isActive = myFilterGames.includes(game.id);
               return (
                 <div 
                   key={game.id} 
                   className={`mini-game-item ${isActive ? 'active' : ''}`}
                   onClick={() => toggleFilterGame(game.id)}
                 >
                   <div className="mini-circle" style={{display:'flex', justifyContent:'center', alignItems:'center', background:'transparent', fontSize:'1.2rem'}}>
                       {game.icon}
                   </div>
                   <span>{game.name}</span>
                 </div>
               )
             })}
          </div>
        </div>
      </div>

      {/* --- MITTLERE SPALTE (Lobby Liste) --- */}
      <div className="col-center">
        <h2>Available Lobbies</h2>
        <div className="lobby-list">
            {filteredAndSortedLobbies.length === 0 && (
                <div style={{textAlign: 'center', color: '#666', marginTop: 20}}>
                    No lobbies found.
                </div>
            )}
            
            {filteredAndSortedLobbies.map(lobby => (
              <div 
                key={lobby.id}
                className={`lobby-card ${selectedLobby?.id === lobby.id ? 'active' : ''}`}
                onClick={() => setSelectedLobby(lobby)}
              >
                <div className="lobby-info-row">
                    {/* HIER WAR DER FEHLER: creatorName statt users[0] */}
                    <span className="creator-name">{lobby.creatorName}</span>
                    <span className="lobby-id">#{lobby.id}</span>
                </div>
                {myFilterGames.length > 0 && (
                    <div className="match-info">
                        {/* HIER WAR DER FEHLER: settings.creatorGames */}
                        {(lobby.settings?.creatorGames || []).filter(g => myFilterGames.includes(g)).length} Matches
                    </div>
                )}
                
                {/* Status Anzeige (Text entfernt wie gewünscht) */}
                <div style={{fontSize: '0.8rem', color: lobby.userCount >= 2 ? '#e94560' : '#00e676', marginTop: '5px', textAlign: 'right'}}>
                    {lobby.userCount >= 2 ? 'FULL' : 'OPEN'}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* --- RECHTE SPALTE (Details) --- */}
      <div className="col-right">
        {/* TEXT GEÄNDERT */}
        <h3 className="right-header">the creator of the room wants to play</h3>
        
        <div className="creator-games-area">
          {selectedLobby ? (
            <div className="creator-games-grid">
               {/* HIER WAR DER FEHLER: settings.creatorGames */}
               {selectedLobby.settings?.creatorGames && selectedLobby.settings.creatorGames.length > 0 ? (
                 selectedLobby.settings.creatorGames.map(gameId => {
                   const gameData = AVAILABLE_GAMES.find(g => g.id === parseInt(gameId));
                   if (!gameData) return null;
                   return (
                     <div key={gameId} className="creator-game-card">
                        <div className="creator-game-icon" style={{display:'flex', justifyContent:'center', alignItems:'center', fontSize:'1.5rem', background: 'rgba(255,255,255,0.1)'}}>
                            {gameData.icon}
                        </div>
                        <span>{gameData.name}</span>
                     </div>
                   );
                 })
               ) : (
                 <p className="no-games-text">All games allowed / No selection.</p>
               )}
            </div>
          ) : (
            <p className="placeholder-text">Select a lobby to see details.</p>
          )}
        </div>

        <button 
            className="join-room-btn" 
            disabled={!selectedLobby || selectedLobby.userCount >= 2}
            onClick={handleJoin}
        >
            {selectedLobby?.userCount >= 2 ? 'FULL' : 'JOIN ROOM'}
        </button>
      </div>
    </div>
  );
};

export default JoinLobby;