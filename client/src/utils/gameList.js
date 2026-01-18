// client/src/utils/gameList.js

// Wir nutzen hier Emojis als Icons. Das ist sicher, da keine externen Dateien benötigt werden.
export const IMPLEMENTED_GAMES = [
    { id: 0, name: "Tic-Tac-Toe", icon: "❌" },
    { id: 1, name: "Battleship", icon: "🚢" },
    { id: 2, name: "Ping Pong", icon: "🏓" },
    { id: 3, name: "Tank Duel", icon: "💥" },
    { id: 4, name: "Sumo Wrestling", icon: "🤼" },
    { id: 5, name: "Hurdles", icon: "🏃" },
    { id: 6, name: "Archery", icon: "🏹" },
    { id: 7, name: "Air Hockey", icon: "🏒" },
    { id: 8, name: "Reaction Test", icon: "⚡" },
    { id: 9, name: "Pop Balloons", icon: "🎈" },
    { id: 10, name: "Falling Sand", icon: "🧱" },
    { id: 11, name: "City-Country-River", icon: "🌍" },
    { id: 12, name: "Word Snake", icon: "🐍" },
    { id: 13, name: "Hangman Duel", icon: "😵" },
    { id: 14, name: "Word Search", icon: "🔡" },
    { id: 15, name: "Memory", icon: "🧩" },
    { id: 16, name: "Snake Duel", icon: "🐍" },
    { id: 17, name: "Color Match", icon: "🎨" },
    { id: 18, name: "Unscramble the Word", icon: "🔎" },
    { id: 19, name: "Quick Quiz", icon: "💡" },
    { id: 20, name: "Pattern Duel", icon: "🔴" },
    { id: 21, name: "Catapult War", icon: "🏰" },
    { id: 22, name: "Bomb Pass", icon: "💣" },
];
// ... (Die Liste IMPLEMENTED_GAMES bleibt so wie sie ist)

// --- ÄNDERUNG HIER ---

// Wir exportieren nur noch die echten Spiele, keine Dummys mehr.
export const AVAILABLE_GAMES = [...IMPLEMENTED_GAMES];

export const RANDOM_GAME_ID = -1;

export const getGameInfo = (id) => {
    if (parseInt(id) === RANDOM_GAME_ID) return { name: "Random Game", icon: "🎲" };
    return AVAILABLE_GAMES.find(g => g.id === parseInt(id)) || { name: "Unknown", icon: "❓" };
};