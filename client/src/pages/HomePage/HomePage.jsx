import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

// Wir nutzen die gleichen Avatare auch hier für das Bearbeiten-Fenster
const AVAILABLE_AVATARS = Array.from({ length: 12 }, (_, i) => 
  `https://api.dicebear.com/7.x/bottts/svg?seed=Player${i + 1}&backgroundColor=transparent`
);

const HomePage = ({ userInfo, setUserInfo }) => {
  const navigate = useNavigate();
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  // States für das Bearbeiten-Fenster (Kopie der StartPage Logik)
  const [editName, setEditName] = useState(userInfo.username);
  const [editAvatar, setEditAvatar] = useState(userInfo.avatar);

  const handleSaveProfile = () => {
     setUserInfo({ username: editName, avatar: editAvatar });
     setShowProfileEdit(false);
  };

  return (
    <div className="homepage-container">
      
      {/* --- Header Bereich --- */}
      <div className="header-profile">
        <div className="profile-info" onClick={() => setShowProfileEdit(true)}>
            <span className="profile-name">{userInfo.username || "Guest"}</span>
            <img src={userInfo.avatar} alt="My Profile" className="profile-avatar-small" />
        </div>
      </div>

      {/* --- Haupt Buttons --- */}
      <div className="action-buttons-container">
        <button className="big-action-btn create-btn" onClick={() => navigate('/create-lobby')}>
            Create Lobby
        </button>
        <button className="big-action-btn join-btn" onClick={() => navigate('/join-lobby')}>
            Join Lobby
        </button>
      </div>

      {/* --- Modal (Popup) zum Bearbeiten --- */}
      {showProfileEdit && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Profile</h2>
            
            <div className="modal-avatar-section">
                <img src={editAvatar} alt="Current" className="modal-main-avatar"/>
                <div className="modal-grid">
                    {AVAILABLE_AVATARS.map((url, i) => (
                        <img 
                            key={i} src={url} 
                            className={`mini-avatar ${editAvatar === url ? 'selected' : ''}`}
                            onClick={() => setEditAvatar(url)}
                        />
                    ))}
                </div>
            </div>

            <input 
                type="text" 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)}
                className="modal-input"
            />
            
            <div className="modal-actions">
                <button onClick={() => setShowProfileEdit(false)} className="cancel-btn">Cancel</button>
                <button onClick={handleSaveProfile} className="save-btn">Save Changes</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HomePage;