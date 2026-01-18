import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StartPage.css';

const AVAILABLE_AVATARS = Array.from({ length: 12 }, (_, i) => 
  `https://api.dicebear.com/7.x/bottts/svg?seed=Player${i + 1}&backgroundColor=transparent`
);

const StartPage = ({ socket, setUserInfo }) => {
  const navigate = useNavigate();

  const [inputName, setInputName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVAILABLE_AVATARS[0]);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (inputName.trim().length < 3) {
      alert("Username muss mindestens 3 Zeichen lang sein.");
      return;
    }

    // Global speichern
    setUserInfo({
      username: inputName,
      avatar: selectedAvatar
    });

    // Login an Server senden (Nur wenn Socket existiert, um Crash zu vermeiden)
    if (socket) {
        socket.emit("login_user", { username: inputName, avatar: selectedAvatar });
    } else {
        console.error("Socket connection missing inside StartPage!");
    }

    // Weiterleitung
    navigate('/home');
  };

  const toggleAvatarSelector = () => {
    setShowAvatarSelector(!showAvatarSelector);
  }

  const handleSelectAvatar = (avatarUrl) => {
    setSelectedAvatar(avatarUrl);
    setShowAvatarSelector(false);
  }

  return (
    <div className="start-page-container">
      <div className="login-box">
        <h1>Choose your username and avatar</h1>

        <div className="main-avatar-wrapper" onClick={toggleAvatarSelector}>
            <img src={selectedAvatar} alt="Selected Avatar" className="main-avatar" />
            <span className="edit-hint">Click to change</span>
        </div>

        {showAvatarSelector && (
          <div className="avatar-selector-grid">
             {AVAILABLE_AVATARS.map((avatarUrl, index) => (
                <img 
                  key={index} 
                  src={avatarUrl} 
                  alt={`Option ${index}`} 
                  className={`avatar-option ${selectedAvatar === avatarUrl ? 'active' : ''}`}
                  onClick={() => handleSelectAvatar(avatarUrl)}
                />
             ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <input 
            type="text" 
            placeholder="Username" 
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            className="username-input"
            maxLength={15}
          />
          {/* --- TEXT GEÄNDERT --- */}
          <button type="submit" className="submit-button">Start Game</button>
        </form>
      </div>
    </div>
  );
};

export default StartPage;