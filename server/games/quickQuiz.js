// server/games/quickQuiz.js

const ROUNDS = 11; // Jetzt 11 Runden
const TIME_LIMIT = 10; // Sekunden pro Frage

const QUESTIONS = [
    // --- GEOGRAFIE ---
    { q: "What is the capital of Australia?", a: ["Canberra", "Sydney", "Melbourne", "Perth"], c: 0 },
    { q: "What is the largest ocean?", a: ["Pacific", "Atlantic", "Indian", "Arctic"], c: 0 },
    { q: "Which country has the most people?", a: ["India", "China", "USA", "Indonesia"], c: 0 },
    { q: "What is the longest river in the world?", a: ["Nile", "Amazon", "Yangtze", "Mississippi"], c: 0 },
    { q: "Which continent is the Sahara Desert in?", a: ["Africa", "Asia", "South America", "Australia"], c: 0 },
    { q: "What is the capital of Canada?", a: ["Ottawa", "Toronto", "Vancouver", "Montreal"], c: 0 },
    { q: "Which country is known as the Land of the Rising Sun?", a: ["Japan", "China", "Korea", "Thailand"], c: 0 },
    { q: "What is the smallest country in the world?", a: ["Vatican City", "Monaco", "San Marino", "Liechtenstein"], c: 0 },
    { q: "Which U.S. state is the largest by area?", a: ["Alaska", "Texas", "California", "Montana"], c: 0 },
    { q: "What is the capital of Germany?", a: ["Berlin", "Munich", "Frankfurt", "Hamburg"], c: 0 },
    { q: "Mount Everest is located in which mountain range?", a: ["Himalayas", "Andes", "Alps", "Rockies"], c: 0 },
    { q: "What represents the 'E' in UAE?", a: ["Emirates", "East", "Empire", "Economic"], c: 0 },
    { q: "Which river flows through London?", a: ["Thames", "Seine", "Danube", "Rhine"], c: 0 },
    { q: "What is the capital of Spain?", a: ["Madrid", "Barcelona", "Seville", "Valencia"], c: 0 },
    { q: "Which country has a maple leaf on its flag?", a: ["Canada", "USA", "Mexico", "Brazil"], c: 0 },

    // --- WISSENSCHAFT & NATUR ---
    { q: "Which planet is closest to the sun?", a: ["Mercury", "Venus", "Mars", "Earth"], c: 0 },
    { q: "What is the chemical symbol for Gold?", a: ["Au", "Ag", "Fe", "Go"], c: 0 },
    { q: "How many bones are in the human body?", a: ["206", "205", "210", "198"], c: 0 },
    { q: "What is the square root of 64?", a: ["8", "6", "4", "16"], c: 0 },
    { q: "Which animal is the fastest on land?", a: ["Cheetah", "Lion", "Horse", "Leopard"], c: 0 },
    { q: "What gas do plants absorb?", a: ["Carbon Dioxide", "Oxygen", "Nitrogen", "Hydrogen"], c: 0 },
    { q: "What is the hardest natural substance?", a: ["Diamond", "Gold", "Iron", "Platinum"], c: 0 },
    { q: "How many hearts does an octopus have?", a: ["3", "1", "2", "4"], c: 0 },
    { q: "What represents 'H' in the periodic table?", a: ["Hydrogen", "Helium", "Hafnium", "Holmium"], c: 0 },
    { q: "Which planet is known as the Red Planet?", a: ["Mars", "Jupiter", "Saturn", "Venus"], c: 0 },
    { q: "What is the speed of light?", a: ["299,792 km/s", "150,000 km/s", "1,000 km/s", "Sound speed"], c: 0 },
    { q: "What is the powerhouse of the cell?", a: ["Mitochondria", "Nucleus", "Ribosome", "Cytoplasm"], c: 0 },
    { q: "Which animal sleeps standing up?", a: ["Horse", "Dog", "Cat", "Lion"], c: 0 },
    { q: "What is the main ingredient in glass?", a: ["Sand", "Clay", "Rock", "Metal"], c: 0 },
    { q: "How many teeth does an adult human have?", a: ["32", "30", "28", "34"], c: 0 },

    // --- TECHNOLOGIE & CODING ---
    { q: "Which language is used for React?", a: ["JavaScript", "Python", "Java", "C++"], c: 0 },
    { q: "What does HTML stand for?", a: ["HyperText Markup Lang", "HighText Machine Lang", "HyperTool Multi Lang", "None"], c: 0 },
    { q: "Who founded Microsoft?", a: ["Bill Gates", "Steve Jobs", "Elon Musk", "Mark Zuckerberg"], c: 0 },
    { q: "What is the name of the Java mascot?", a: ["Duke", "Tux", "Bugdroid", "Octocat"], c: 0 },
    { q: "Which company owns GitHub?", a: ["Microsoft", "Google", "Facebook", "Amazon"], c: 0 },
    { q: "What does 'CSS' stand for?", a: ["Cascading Style Sheets", "Computer Style System", "Creative Style Sheets", "Code Style System"], c: 0 },
    { q: "Which port is standard for HTTP?", a: ["80", "443", "21", "22"], c: 0 },
    { q: "Who is the CEO of Tesla?", a: ["Elon Musk", "Jeff Bezos", "Tim Cook", "Satya Nadella"], c: 0 },
    { q: "What is the most popular OS for mobile?", a: ["Android", "iOS", "Windows", "Symbian"], c: 0 },
    { q: "In Python, what is a list?", a: ["Array", "Object", "Function", "String"], c: 0 },
    { q: "What does 'CPU' stand for?", a: ["Central Processing Unit", "Computer Personal Unit", "Central Power Unit", "Core Processing Unit"], c: 0 },
    { q: "Which company created the iPhone?", a: ["Apple", "Samsung", "Nokia", "Sony"], c: 0 },
    { q: "What does 'Wi-Fi' stand for?", a: ["Wireless Fidelity", "Wireless Find", "Wide Fidelity", "Wire Fire"], c: 0 },
    { q: "Which key is used to refresh a page?", a: ["F5", "F1", "F12", "Alt+F4"], c: 0 },
    { q: "What year was Google founded?", a: ["1998", "1995", "2000", "1990"], c: 0 },

    // --- GESCHICHTE ---
    { q: "In which year did the Titanic sink?", a: ["1912", "1905", "1920", "1898"], c: 0 },
    { q: "Who was the first man on the moon?", a: ["Neil Armstrong", "Buzz Aldrin", "Yuri Gagarin", "John Glenn"], c: 0 },
    { q: "When did World War II end?", a: ["1945", "1939", "1918", "1950"], c: 0 },
    { q: "Who painted the Mona Lisa?", a: ["Da Vinci", "Van Gogh", "Picasso", "Rembrandt"], c: 0 },
    { q: "Which empire built the Colosseum?", a: ["Roman", "Greek", "Ottoman", "Egyptian"], c: 0 },
    { q: "Who discovered America in 1492?", a: ["Columbus", "Magellan", "Vespucci", "Cook"], c: 0 },
    { q: "Which country gifted the Statue of Liberty?", a: ["France", "UK", "Spain", "Germany"], c: 0 },
    { q: "Who was the first US President?", a: ["George Washington", "Lincoln", "Jefferson", "Adams"], c: 0 },
    { q: "What year did the Berlin Wall fall?", a: ["1989", "1991", "1985", "1990"], c: 0 },
    { q: "Who was known as the Maid of Orleans?", a: ["Joan of Arc", "Marie Curie", "Cleopatra", "Queen Victoria"], c: 0 },

    // --- POPKULTUR & ENTERTAINMENT ---
    { q: "Who lives in a pineapple under the sea?", a: ["SpongeBob", "Patrick", "Squidward", "Mr. Krabs"], c: 0 },
    { q: "Which house does Harry Potter belong to?", a: ["Gryffindor", "Slytherin", "Hufflepuff", "Ravenclaw"], c: 0 },
    { q: "Who is Batman's secret identity?", a: ["Bruce Wayne", "Clark Kent", "Peter Parker", "Tony Stark"], c: 0 },
    { q: "Which movie features a T-Rex?", a: ["Jurassic Park", "Star Wars", "Jaws", "Alien"], c: 0 },
    { q: "What is the name of Mario's brother?", a: ["Luigi", "Wario", "Toad", "Yoshi"], c: 0 },
    { q: "Which band sang 'Yellow Submarine'?", a: ["The Beatles", "Queen", "Rolling Stones", "Nirvana"], c: 0 },
    { q: "What color is a Smurf?", a: ["Blue", "Green", "Red", "Yellow"], c: 0 },
    { q: "Who is the villain in Star Wars?", a: ["Darth Vader", "Luke", "Han Solo", "Yoda"], c: 0 },
    { q: "Which superhero is from Krypton?", a: ["Superman", "Batman", "Flash", "Thor"], c: 0 },
    { q: "What does 'GTA' stand for?", a: ["Grand Theft Auto", "Grand Tour Auto", "Great Theft Action", "Game Theft Auto"], c: 0 },
    { q: "Who is the princess in Mario games?", a: ["Peach", "Daisy", "Zelda", "Rosalina"], c: 0 },
    { q: "Which Disney movie features Elsa?", a: ["Frozen", "Moana", "Tangled", "Brave"], c: 0 },
    { q: "What is the currency in Fortnite?", a: ["V-Bucks", "Coins", "Gems", "Gold"], c: 0 },
    { q: "Which franchise features Pikachu?", a: ["Pokemon", "Digimon", "Mario", "Zelda"], c: 0 },
    { q: "Who directed 'Inception'?", a: ["Nolan", "Spielberg", "Tarantino", "Scorsese"], c: 0 },

    // --- SPORT ---
    { q: "How long is a marathon?", a: ["42.195 km", "40 km", "50 km", "21 km"], c: 0 },
    { q: "Which sport uses a shuttlecock?", a: ["Badminton", "Tennis", "Squash", "Ping Pong"], c: 0 },
    { q: "How many players in a soccer team?", a: ["11", "10", "12", "9"], c: 0 },
    { q: "In which sport is the Super Bowl?", a: ["American Football", "Baseball", "Basketball", "Hockey"], c: 0 },
    { q: "Who is known as 'The Goat' in basketball?", a: ["Michael Jordan", "LeBron James", "Kobe Bryant", "Shaq"], c: 0 },
    { q: "What is the national sport of Japan?", a: ["Sumo", "Karate", "Judo", "Baseball"], c: 0 },
    { q: "How many rings in the Olympic logo?", a: ["5", "4", "6", "7"], c: 0 },
    { q: "Which country won the 2014 World Cup?", a: ["Germany", "Argentina", "Brazil", "Spain"], c: 0 },
    { q: "What is played at Wimbledon?", a: ["Tennis", "Golf", "Cricket", "Rugby"], c: 0 },
    { q: "In bowling, what is 3 strikes?", a: ["Turkey", "Chicken", "Eagle", "Hat trick"], c: 0 },

    // --- ESSEN & TRINKEN ---
    { q: "What is the main ingredient in Sushi?", a: ["Rice", "Fish", "Seaweed", "Wasabi"], c: 0 },
    { q: "Which fruit has seeds on the outside?", a: ["Strawberry", "Apple", "Banana", "Orange"], c: 0 },
    { q: "What is Tofu made from?", a: ["Soybeans", "Milk", "Rice", "Wheat"], c: 0 },
    { q: "Where did Pizza originate?", a: ["Italy", "USA", "France", "Greece"], c: 0 },
    { q: "What is the most consumed drink?", a: ["Water", "Coffee", "Tea", "Cola"], c: 0 },

    // --- RANDOM / FUN ---
    { q: "How many legs does a spider have?", a: ["8", "6", "10", "4"], c: 0 },
    { q: "What color is a giraffe's tongue?", a: ["Blue/Black", "Pink", "Red", "Green"], c: 0 },
    { q: "Which month has 28 days?", a: ["All of them", "February", "January", "None"], c: 0 },
    { q: "What is the opposite of 'Cold'?", a: ["Hot", "Warm", "Cool", "Ice"], c: 0 },
    { q: "How many sides has a triangle?", a: ["3", "4", "2", "5"], c: 0 },
    { q: "Which animal says 'Moo'?", a: ["Cow", "Sheep", "Pig", "Horse"], c: 0 },
    { q: "What do bees produce?", a: ["Honey", "Milk", "Silk", "Wool"], c: 0 },
    { q: "What color are zebras?", a: ["Black and White", "White and Black", "Grey", "Striped"], c: 0 },
    { q: "Which bird cannot fly?", a: ["Penguin", "Eagle", "Parrot", "Dove"], c: 0 },
    { q: "What is 10 + 10?", a: ["20", "100", "22", "11"], c: 0 },
    { q: "Which shape has 4 equal sides?", a: ["Square", "Rectangle", "Triangle", "Circle"], c: 0 },
    { q: "What comes after Monday?", a: ["Tuesday", "Wednesday", "Sunday", "Friday"], c: 0 },
    { q: "How many hours in a day?", a: ["24", "12", "48", "60"], c: 0 },
    { q: "What color is the sky on a clear day?", a: ["Blue", "Green", "Red", "White"], c: 0 },
    { q: "Which animal is the King of the Jungle?", a: ["Lion", "Tiger", "Elephant", "Gorilla"], c: 0 }
];

const createGameState = (users) => {
    // 11 zufällige Fragen auswählen aus dem großen 110er Pool
    const selectedQuestions = [...QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, ROUNDS);

    return {
        players: users.map(u => u.socketId),
        scores: { [users[0].socketId]: 0, [users[1].socketId]: 0 },
        
        questions: selectedQuestions,
        currentRound: 0,
        
        // Phasen: 'QUESTION' (Lesen 3s), 'ANSWER' (Tippen 10s), 'REVEAL' (Auflösung 4s), 'GAME_OVER'
        phase: 'QUESTION',
        timeLeft: 3, 
        
        // Antworten der aktuellen Runde
        answers: {},
        
        winner: null
    };
};

const updateLoop = (gameState) => {
    if (gameState.winner) return;

    gameState.timeLeft -= 0.1; // 100ms Ticks

    if (gameState.timeLeft <= 0) {
        if (gameState.phase === 'QUESTION') {
            // Wechsel zu Antwort-Phase
            gameState.phase = 'ANSWER';
            gameState.timeLeft = TIME_LIMIT;
        } 
        else if (gameState.phase === 'ANSWER') {
            // Zeit abgelaufen -> Auswerten
            evaluateRound(gameState);
            gameState.phase = 'REVEAL';
            gameState.timeLeft = 4; // Zeit zum Ergebnis ansehen
        } 
        else if (gameState.phase === 'REVEAL') {
            // Nächste Runde?
            if (gameState.currentRound < ROUNDS - 1) {
                gameState.currentRound++;
                gameState.phase = 'QUESTION';
                gameState.timeLeft = 3;
                gameState.answers = {}; // Reset Answers
            } else {
                // Spielende
                const p1 = gameState.players[0];
                const p2 = gameState.players[1];
                if (gameState.scores[p1] > gameState.scores[p2]) gameState.winner = p1;
                else if (gameState.scores[p2] > gameState.scores[p1]) gameState.winner = p2;
                else gameState.winner = "DRAW";
            }
        }
    }
};

const handleInput = (gameState, socketId, answerIndex) => {
    if (gameState.phase !== 'ANSWER') return;
    if (gameState.answers[socketId]) return; // Schon geantwortet

    // Antwort speichern (inklusive Restzeit für Bonus-Punkte)
    gameState.answers[socketId] = {
        index: answerIndex,
        timeBonus: Math.ceil(gameState.timeLeft) // Je mehr Zeit übrig, desto mehr Punkte
    };

    // Wenn beide geantwortet haben, sofort auflösen
    const p1 = gameState.players[0];
    const p2 = gameState.players[1];
    if (gameState.answers[p1] && gameState.answers[p2]) {
        gameState.timeLeft = 0; // Trigger Phase Change im nächsten Loop
    }
};

const evaluateRound = (gameState) => {
    const currentQ = gameState.questions[gameState.currentRound];
    
    gameState.players.forEach(pid => {
        const ans = gameState.answers[pid];
        if (ans && ans.index === currentQ.c) {
            // Richtig!
            // Basis: 100 Punkte + Zeitbonus (max 10) * 5
            gameState.scores[pid] += 100 + (ans.timeBonus * 5);
        }
    });
};

module.exports = { createGameState, updateLoop, handleInput };