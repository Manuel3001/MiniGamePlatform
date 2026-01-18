// client/src/socket.js
import io from 'socket.io-client';

// Hier prüfen wir: Sind wir live (Production) oder auf meinem PC (Development)?
const BACKEND_URL = process.env.NODE_ENV === 'production' 
    ? "https://minigame-backend-ghsi.onrender.com" // <-- WICHTIG: Hier deinen Render-Link einfügen!
    : "http://localhost:4000";

export const socket = io.connect(BACKEND_URL);