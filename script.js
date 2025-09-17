// =========================================================================
// Global State & Utility Functions
// =========================================================================
let commandCount = 0;
let notesCount = 0;
let tasksCount = 0;
let chatHistory = [];
let sessionStartTime = Date.now();
let expectingMood = false; // Flag to track if waiting for mood input
let currentRecognition = null; // Track current recognition instance
const activeTimers = {}; // To manage multiple timers

// Initialize notes array if not present
if (typeof notes === 'undefined') {
  var notes = [
    { text: 'I feel very happy today', timestamp: Date.now() },
    { text: 'Completed a big milestone at work', timestamp: Date.now() }
  ];
}

/**
 * Updates the dashboard statistics and progress bars.
 */
function updateStats() {
  const activeCards = document.querySelectorAll('#card-container .glass-card').length;
  document.getElementById('commands-count').textContent = commandCount;
  document.getElementById('notes-count').textContent = notesCount;
  document.getElementById('tasks-count').textContent = tasksCount;
  document.getElementById('sidebar-commands').textContent = commandCount;
  document.getElementById('sidebar-cards').textContent = activeCards;
  
  // Update progress bars with smooth animation
  const notesProgress = Math.min((notesCount / 5) * 100, 100);
  const tasksProgress = Math.min((tasksCount / 5) * 100, 100);
  const commandProgress = Math.min((commandCount / 20) * 100, 100);
  
  const progressBars = document.querySelectorAll('#header-cards .stat-card .bg-gradient-to-r');
  if (progressBars[0]) progressBars[0].style.width = notesProgress + '%';
  if (progressBars[1]) progressBars[1].style.width = tasksProgress + '%';
  if (progressBars[2]) progressBars[2].style.width = commandProgress + '%';
  
  updateSessionTime();
}

/**
 * Updates the session duration display.
 */
function updateSessionTime() {
  const elapsed = Math.floor((Date.now() - sessionStartTime) / 60000);
  const sessionTimeEl = document.getElementById('session-time');
  if (sessionTimeEl) {
    sessionTimeEl.textContent = elapsed + 'm';
  }
}

/**
 * Text-to-Speech helper function
 */
function speak(text) {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel(); // Stop any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    speechSynthesis.speak(utterance);
  } else {
    console.log('Speak:', text);
  }
}

/**
 * Adds a new entry to the chat history.
 */
function addToChatHistory(command, action) {
  const timestamp = new Date().toLocaleTimeString();
  chatHistory.unshift({
    command: command,
    action: action,
    time: timestamp,
    date: new Date().toLocaleDateString()
  });
  
  if (chatHistory.length > 25) {
    chatHistory.pop();
  }
  
  updateChatHistoryDisplay();
}

/**
 * Renders the chat history on the sidebar.
 */
function updateChatHistoryDisplay() {
  const historyContainer = document.getElementById('chat-history');
  if (!historyContainer) return;
  
  historyContainer.innerHTML = '';
  
  if (chatHistory.length === 0) {
    historyContainer.innerHTML = `
      <div class="text-center p-6 opacity-60">
        <i class="fas fa-comments text-3xl mb-3 block"></i>
        <p class="body-font">No conversations yet. Start by giving a voice command!</p>
      </div>
    `;
    return;
  }
  
  chatHistory.forEach((item, index) => {
    const chatItem = document.createElement('div');
    chatItem.className = 'chat-item p-4 rounded-xl bg-white/5 hover:bg-white/15 transition-all';
    chatItem.style.animationDelay = (index * 0.1) + 's';
    chatItem.innerHTML = `
      <div class="text-base font-medium accent-font mb-2">${item.action}</div>
      <div class="text-sm text-white/70 mb-3 body-font italic">"${item.command}"</div>
      <div class="flex justify-between text-xs text-white/50">
        <span>${item.time}</span>
        <span>${item.date}</span>
      </div>
    `;
    historyContainer.appendChild(chatItem);
  });
}

/**
 * Toggles the sidebar and main content visibility.
 */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('main-content');
  const hamburger = document.getElementById('hamburger');
  
  if (sidebar) sidebar.classList.toggle('open');
  if (mainContent) mainContent.classList.toggle('shifted');
  if (hamburger) hamburger.classList.toggle('open');
}

/**
 * Creates and displays a temporary notification.
 */
function showNotification(message, type = 'info', icon = 'fa-info-circle') {
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };
  
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-8 py-5 rounded-xl shadow-lg z-50 notification-enter`;
  notification.innerHTML = `
    <div class="flex items-center">
      <i class="fas ${icon} mr-4 text-xl"></i>
      <div class="accent-font">
        <div class="font-bold text-lg">${message.title}</div>
        <div class="text-sm body-font">${message.subtitle}</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.transform = 'translateX(400px)';
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

/**
 * Creates a new dynamic card on the dashboard.
 */
function createCard(id, title, icon, html) {
  if (document.getElementById(id)) return;
  
  const cardContainer = document.getElementById("card-container");
  if (!cardContainer) return;
  
  const card = document.createElement("div");
  card.id = id;
  card.className = "glass-card p-10 rounded-3xl slide-in";
  card.innerHTML = `
    <div class="flex items-center justify-between mb-8">
      <h2 class="text-3xl font-bold flex items-center title-font">
        <i class="fas ${icon} mr-4 text-3xl"></i>
        ${title}
      </h2>
      <button onclick="removeCard('${id}')" class="text-white/60 hover:text-red-400 transition-colors duration-300 hover:scale-110">
        <i class="fas fa-times text-xl"></i>
      </button>
    </div>
    <div class="text-white body-font">${html}</div>
  `;
  
  cardContainer.appendChild(card);
  commandCount++;
  updateStats();
}

/**
 * Removes a dynamic card from the dashboard with animation.
 */
function removeCard(id) {
  const card = document.getElementById(id);
  if (card) {
    card.style.transform = 'scale(0.8) rotateY(90deg)';
    card.style.opacity = '0';
    setTimeout(() => card.remove(), 400);
    
    // Update counts based on the type of card being removed
    if (id.includes('note-')) notesCount = Math.max(0, notesCount - 1);
    if (id.includes('task-')) tasksCount = Math.max(0, tasksCount - 1);
    if (id.includes('timer-')) {
      clearInterval(activeTimers[id]);
      delete activeTimers[id];
    }
    
    updateStats();
  }
}

/**
 * Clears all dynamic cards from the dashboard.
 */
function clearAllCards() {
  const cards = document.querySelectorAll('#card-container .glass-card');
  cards.forEach(card => removeCard(card.id));
  showNotification({
    title: "All Cards Cleared",
    subtitle: "Your dashboard is now pristine and ready for new commands."
  }, 'success', 'fa-trash-alt');
  addToChatHistory("clear all cards", "Cleared Dashboard");
}

// =========================================================================
// Music & Mood Detection Functions
// =========================================================================

/**
 * Asks user about their mood and starts mood detection
 */
function askMood() {
  speak("How are you feeling right now? You can say: happy, sad, calm, or angry.");

  if (!("webkitSpeechRecognition" in window)) {
    alert("Speech Recognition not supported in this browser.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.start();

  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript.toLowerCase();
    console.log("User said:", transcript);

    const moodMap = {
      happy: ["happy", "joyful", "excited", "great"],
      sad: ["sad", "unhappy", "down", "depressed"],
      calm: ["calm", "relaxed", "peaceful", "chill"],
      angry: ["angry", "mad", "furious", "frustrated"]
    };

    let detectedMood = "neutral";

    for (const mood in moodMap) {
      if (moodMap[mood].some(word => transcript.includes(word))) {
        detectedMood = mood;
        break;
      }
    }

    console.log("Detected mood:", detectedMood);
    playMoodMusic(detectedMood); // 🔗 Connect mood to music player
  };

  recognition.onerror = function() {
    speak("Sorry, I couldn’t catch that. Please try again.");
  };
}


/**
 * Starts speech recognition specifically for mood detection
 */
function startMoodRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    showNotification({
      title: "Speech Recognition Unavailable",
      subtitle: "Please type your mood instead."
    }, 'error', 'fa-microphone-slash');
    expectingMood = false;
    return;
  }

  const moodRecognition = new SpeechRecognition();
  moodRecognition.lang = "en-US";
  moodRecognition.continuous = false;
  moodRecognition.interimResults = false;

  // Show listening status
  showNotification({
    title: "Listening for Mood",
    subtitle: "Please tell me: happy, sad, calm, or angry"
  }, 'info', 'fa-ear-listen');

  moodRecognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase();
    console.log("Mood detected:", transcript);
    handleMoodResponse(transcript);
  };

  moodRecognition.onerror = (error) => {
    console.error("Mood recognition error:", error);
    speak("Sorry, I couldn't catch that. Please try saying your mood again.");
    expectingMood = false;
    showNotification({
      title: "Mood Detection Failed",
      subtitle: "Please try again or speak more clearly."
    }, 'warning', 'fa-exclamation-triangle');
  };

  moodRecognition.onend = () => {
    console.log("Mood recognition ended");
  };

  moodRecognition.start();
}

/**
 * Handles the mood response and plays appropriate music
 */
function handleMoodResponse(transcript) {
  expectingMood = false;
  let detectedMood = "neutral";

  if (transcript.includes("happy") || transcript.includes("joyful") || transcript.includes("excited")) {
    detectedMood = "happy";
  } else if (transcript.includes("sad") || transcript.includes("down") || transcript.includes("depressed")) {
    detectedMood = "sad";
  } else if (transcript.includes("angry") || transcript.includes("mad") || transcript.includes("frustrated")) {
    detectedMood = "angry";
  } else if (transcript.includes("calm") || transcript.includes("peaceful") || transcript.includes("relaxed")) {
    detectedMood = "calm";
  }

  playMoodMusic(detectedMood);
  addToChatHistory(`mood: ${transcript}`, `Music for ${detectedMood} mood`);
}

/**
 * Plays mood-based music using Spotify playlists
 */
function playMoodMusic(mood) {
  let playlistUrl = "";

  switch (mood) {
    case "happy":
      playlistUrl = "37i9dQZF1DXdPec7aLTmlC"; // Happy Hits
      speak("You sound happy! Playing upbeat songs.");
      break;
    case "sad":
      playlistUrl = "37i9dQZF1DX7qK8ma5wgG1"; // Sad Songs
      speak("Feeling sad? Here's some comforting music.");
      break;
    case "angry":
      playlistUrl = "37i9dQZF1DWYxwmBaMqxsl"; // Rock Hard
      speak("You're angry! Let's release it with some rock.");
      break;
    case "calm":
      playlistUrl = "37i9dQZF1DWU0ScTcjJBdj"; // Chill Vibes
      speak("You're calm. Playing relaxing vibes.");
      break;
    default:
      playlistUrl = "37i9dQZF1DXcBWIGoYBM5M"; // Top Hits
      speak("Mood not detected, playing today's top hits.");
  }

  document.getElementById("musicPlayer").innerHTML = `
    <iframe 
      src="https://open.spotify.com/embed/playlist/${playlistUrl}" 
      width="100%" height="380" frameborder="0" 
      allowtransparency="true" allow="encrypted-media">
    </iframe>
  `;
}


  speak(moodMessage);

  const musicContent = `
    <div id="musicPlayer" class="music-player mb-6">
      <iframe src="https://open.spotify.com/embed/playlist/${playlistUrl}?utm_source=generator&theme=0" 
        width="100%" height="352" frameborder="0" 
        allowfullscreen="" 
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
        loading="lazy">
      </iframe>
    </div>
    <div class="text-center">
      <h4 class="text-xl font-semibold mb-2">🎵 ${playlistName}</h4>
      <p class="text-sm opacity-80">${moodMessage}</p>
      <div class="mt-4 space-x-3">
        <button onclick="askMood(); removeCard('music-card');" class="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-lg text-sm">
          <i class="fas fa-sync mr-2"></i>Change Mood
        </button>
        <a href="https://open.spotify.com/playlist/${playlistUrl}" target="_blank" class="inline-block bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg text-sm">
          <i class="fab fa-spotify mr-2"></i>Open in Spotify
        </a>
      </div>
    </div>
  `;

  // Create or update the music card
  createCard("music-card", "🎵 Mood-Based Music", "fa-music text-pink-300", musicContent);
  
  showNotification({
    title: "Music Started!",
    subtitle: moodMessage
  }, 'success', 'fa-music');


/**
 * Recommends music based on notes analysis (alternative method)
 */
function recommendMusic() {
  if (!notes || notes.length === 0) {
    speak("I don't have any notes to analyze your mood. Please add some notes first, or let me ask about your current mood.");
    askMood();
    return;
  }

  // Simple mood analysis from notes
  const allText = notes.map(note => note.text.toLowerCase()).join(' ');
  let detectedMood = "neutral";

  const happyWords = ['happy', 'joy', 'excited', 'great', 'awesome', 'wonderful', 'amazing', 'good'];
  const sadWords = ['sad', 'down', 'depressed', 'unhappy', 'terrible', 'awful', 'bad'];
  const angryWords = ['angry', 'mad', 'frustrated', 'annoyed', 'furious'];
  const calmWords = ['calm', 'peaceful', 'relaxed', 'zen', 'quiet', 'serene'];

  const happyCount = happyWords.filter(word => allText.includes(word)).length;
  const sadCount = sadWords.filter(word => allText.includes(word)).length;
  const angryCount = angryWords.filter(word => allText.includes(word)).length;
  const calmCount = calmWords.filter(word => allText.includes(word)).length;

  const maxCount = Math.max(happyCount, sadCount, angryCount, calmCount);

  if (maxCount === 0) {
    speak("I couldn't detect your mood from your notes. Let me ask you directly.");
    askMood();
    return;
  }

  if (happyCount === maxCount) detectedMood = "happy";
  else if (sadCount === maxCount) detectedMood = "sad";
  else if (angryCount === maxCount) detectedMood = "angry";
  else if (calmCount === maxCount) detectedMood = "calm";

  speak(`Based on your notes, you seem to be feeling ${detectedMood}. Let me play some music for that mood.`);
  playMoodMusic(detectedMood);
}

// =========================================================================
// Card Creation Functions
// =========================================================================

/**
 * Displays a weather forecast card.
 */
function showWeather() {
  const weatherData = [
    { temp: 22, condition: "Sunny", humidity: 45, location: "New York", wind: "12 km/h", uv: "6" },
    { temp: 18, condition: "Cloudy", humidity: 65, location: "London", wind: "8 km/h", uv: "3" },
    { temp: 9, condition: "Rainy", humidity: 80, location: "Seattle", wind: "15 km/h", uv: "2" },
    { temp: 25, condition: "Clear", humidity: 30, location: "Los Angeles", wind: "5 km/h", uv: "8" }
  ];
  const weather = weatherData[Math.floor(Math.random() * weatherData.length)];
  
  createCard("weather-card", "Weather Forecast", "fa-cloud-sun text-yellow-300", `
    <div class="grid grid-cols-2 gap-6 mb-8">
      <div class="text-center p-6 bg-gradient-to-br from-white/15 to-white/5 rounded-2xl backdrop-blur-sm">
        <div class="text-5xl font-black mb-3 title-font">${weather.temp}°C</div>
        <div class="text-base opacity-80">Temperature</div>
      </div>
      <div class="text-center p-6 bg-gradient-to-br from-white/15 to-white/5 rounded-2xl backdrop-blur-sm">
        <div class="text-2xl font-semibold mb-3 accent-font">${weather.condition}</div>
        <div class="text-base opacity-80">Current Condition</div>
      </div>
    </div>
    <div class="space-y-4 text-base">
      <div class="flex justify-between items-center p-4 bg-white/5 rounded-xl">
        <span class="flex items-center"><i class="fas fa-tint mr-3 text-blue-300 text-lg"></i>Humidity</span>
        <span class="font-semibold">${weather.humidity}%</span>
      </div>
      <div class="flex justify-between items-center p-4 bg-white/5 rounded-xl">
        <span class="flex items-center"><i class="fas fa-wind mr-3 text-gray-300 text-lg"></i>Wind Speed</span>
        <span class="font-semibold">${weather.wind}</span>
      </div>
      <div class="flex justify-between items-center p-4 bg-white/5 rounded-xl">
        <span class="flex items-center"><i class="fas fa-sun mr-3 text-yellow-300 text-lg"></i>UV Index</span>
        <span class="font-semibold">${weather.uv}</span>
      </div>
      <div class="flex justify-between items-center p-4 bg-white/5 rounded-xl">
        <span class="flex items-center"><i class="fas fa-map-marker-alt mr-3 text-red-300 text-lg"></i>Location</span>
        <span class="font-semibold">${weather.location}</span>
      </div>
    </div>
  `);
  
  addToChatHistory("show weather", "Weather Forecast");
}

let calcVal = "";

/**
 * Displays an interactive calculator card.
 */
function showCalculator() {
  createCard("calculator-card", "Advanced Calculator", "fa-calculator text-green-300", `
    <div class="bg-black/50 p-6 rounded-2xl mb-6 border border-white/10">
      <input id="calc-display" type="text" disabled class="w-full p-5 bg-transparent text-4xl text-right text-white border-none outline-none title-font" value="0"/>
    </div>
    <div class="grid grid-cols-4 gap-4">
      ${["C","±","%","÷","7","8","9","×","4","5","6","−","1","2","3","+","0",".","⌫","="].map(v =>
        `<button onclick="calcInput('${v}')" class="calc-btn rounded-2xl p-4 text-xl font-semibold hover:scale-110 transition-all duration-300">${v}</button>`).join("")}
    </div>
    <button onclick="calcClear()" class="w-full bg-red-500/80 hover:bg-red-500 rounded-2xl mt-6 p-4 font-semibold transition-all duration-300 accent-font text-lg">
      <i class="fas fa-trash mr-3"></i>Clear All
    </button>`);
  
  addToChatHistory("show calculator", "Advanced Calculator");
}

/**
 * Handles calculator button input.
 */
function calcInput(val) {
  const display = document.getElementById("calc-display");
  if (!display) return;
  
  if (val === "=") {
    try { 
      let expression = calcVal.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
      calcVal = eval(expression).toString(); 
    } catch { 
      calcVal = "Error"; 
    }
  } else if (val === "C") {
    calcVal = "0";
  } else if (val === "⌫") {
    calcVal = calcVal.slice(0, -1) || "0";
  } else if (val === "±") {
    if (calcVal !== "0" && !calcVal.includes("Error")) {
      calcVal = calcVal.startsWith("-") ? calcVal.slice(1) : "-" + calcVal;
    }
  } else { 
    if (calcVal === "0" && val !== ".") calcVal = "";
    calcVal += val; 
  }
  
  display.value = calcVal || "0";
}

/**
 * Clears the calculator display.
 */
function calcClear() {
  calcVal = "";
  const display = document.getElementById("calc-display");
  if (display) display.value = "0";
}

/**
 * Displays a GPS location card.
 */
function showGPS() {
  createCard("gps-card", "GPS Location Services", "fa-map-marker-alt text-red-300", `
    <div class="text-center">
      <div class="inline-block p-6 bg-white/10 rounded-full mb-6">
        <i class="fas fa-location-arrow text-4xl text-red-300 animate-spin"></i>
      </div>
      <p id='gps-info' class="text-xl accent-font">
        <i class="fas fa-spinner fa-spin mr-3"></i>Acquiring precise location...
      </p>
    </div>
  `);
  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const info = document.getElementById("gps-info");
        if (info) {
          info.innerHTML = `
            <div class="space-y-4 text-left">
              <div class="p-4 bg-white/5 rounded-xl">
                <strong class="accent-font">Latitude:</strong> 
                <span class="body-font">${pos.coords.latitude.toFixed(6)}</span>
              </div>
              <div class="p-4 bg-white/5 rounded-xl">
                <strong class="accent-font">Longitude:</strong> 
                <span class="body-font">${pos.coords.longitude.toFixed(6)}</span>
              </div>
              <div class="p-4 bg-white/5 rounded-xl">
                <strong class="accent-font">Accuracy:</strong> 
                <span class="body-font">±${Math.round(pos.coords.accuracy)} meters</span>
              </div>
              ${pos.coords.altitude ? `
              <div class="p-4 bg-white/5 rounded-xl">
                <strong class="accent-font">Altitude:</strong> 
                <span class="body-font">${Math.round(pos.coords.altitude)} meters</span>
              </div>` : ''}
            </div>
          `;
        }
      }, 
      (error) => {
        const info = document.getElementById("gps-info");
        if (info) {
          info.innerHTML = `
            <div class="text-red-300 text-center">
              <i class="fas fa-exclamation-triangle mr-3 text-2xl"></i>
              <div class="accent-font text-lg">Location Access Denied</div>
              <div class="body-font text-sm mt-2">Please enable location services to use GPS features</div>
            </div>
          `;
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }
  
  addToChatHistory("show gps", "GPS Location Services");
}

/**
 * Displays a live clock card.
 */
function showClock() {
  createCard("clock-card", "Live World Clock", "fa-clock text-blue-300", `
    <div class="text-center">
      <p id='clock-time' class='text-6xl font-mono font-bold mb-6 bg-black/30 p-6 rounded-2xl title-font'>--:--:--</p>
      <p id='clock-date' class='text-xl opacity-80 accent-font mb-4'>Loading...</p>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div class="p-3 bg-white/5 rounded-lg">
          <div class="font-semibold">UTC</div>
          <div id="utc-time" class="body-font">--:--</div>
        </div>
        <div class="p-3 bg-white/5 rounded-lg">
          <div class="font-semibold">Local</div>
          <div id="local-time" class="body-font">--:--</div>
        </div>
      </div>
    </div>
  `);
  
  function updateClock() {
    const now = new Date();
    const timeEl = document.getElementById("clock-time");
    const dateEl = document.getElementById("clock-date");
    const utcEl = document.getElementById("utc-time");
    const localEl = document.getElementById("local-time");
    
    if (timeEl && dateEl) {
      timeEl.textContent = now.toLocaleTimeString();
      dateEl.textContent = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      if (utcEl) utcEl.textContent = now.toUTCString().split(' ')[4];
      if (localEl) localEl.textContent = now.toLocaleTimeString();
    }
  }
  
  updateClock();
  setInterval(updateClock, 1000);
  
  addToChatHistory("show clock", "Live World Clock");
}

/**
 * Creates a new, interactive note card.
 */
function createNote() {
  const noteId = `note-${Date.now()}`;
  createCard(noteId, "New Note", "fa-sticky-note text-blue-300", `
    <textarea class="note-card-content p-4 rounded-xl body-font bg-white/5 h-48 focus:bg-white/10 transition-colors" placeholder="Type or speak your note here..."></textarea>
  `);
  notesCount++;
  updateStats();
  addToChatHistory("create a note", "New Note Created");
}

/**
 * Adds a note programmatically, updates UI and recommends music.
 */
function addNote(text) {
  if (typeof notes === 'undefined') notes = [];
  notes.push({ text, timestamp: Date.now() });
  
  if (typeof renderNotes === 'function') {
    renderNotes();
  } else {
    // Minimal fallback: log and ensure there is a notes card
    console.log('Note added:', text);
    const existing = document.getElementById('notes-list-card');
    const html = `<div class="space-y-3">${(notes||[]).map(n=>`<div class="p-3 bg-white/5 rounded-lg body-font text-sm">${n.text}</div>`).join('')}</div>`;
    if (existing) {
      existing.querySelector('.body-font').innerHTML = html;
    } else {
      createCard('notes-list-card', 'Notes', 'fa-sticky-note text-blue-300', html);
    }
  }
  notesCount++;
  updateStats();

  recommendMusic(); // detects mood and updates music card

  speak('Note added');
  addToChatHistory(`add note: ${text}`, 'Note Added');
}

/**
 * Renders notes if no renderNotes function exists
 */
if (typeof renderNotes !== 'function') {
  function renderNotes() {
    console.log('Rendering notes', notes);
    const existing = document.getElementById('notes-list-card');
    const html = `<div class="space-y-3">${(notes||[]).map(n=>`<div class="p-3 bg-white/5 rounded-lg body-font text-sm">${n.text}</div>`).join('')}</div>`;
    if (existing) {
      existing.querySelector('.body-font').innerHTML = html;
    } else {
      createCard('notes-list-card', 'Notes', 'fa-sticky-note text-blue-300', html);
    }
  }
}

/**
 * Creates a new task card.
 */
function addTask(taskText = 'New Task') {
  const taskId = `task-${Date.now()}`;
  createCard(taskId, "New Task", "fa-tasks text-purple-300", `
    <div class="task-item p-4 bg-white/5 rounded-xl">
      <input type="checkbox" id="${taskId}-checkbox" onclick="toggleTaskCompletion('${taskId}')">
      <label for="${taskId}-checkbox" class="task-text body-font text-lg ml-3">${taskText}</label>
    </div>
  `);
  tasksCount++;
  updateStats();
  addToChatHistory(`add a task: ${taskText}`, "New Task Added");
}

/**
 * Toggles the completion state of a task.
 */
function toggleTaskCompletion(taskId) {
  const checkbox = document.getElementById(`${taskId}-checkbox`);
  const taskLabel = document.querySelector(`#${taskId} .task-text`);
  
  if (checkbox && checkbox.checked) {
    showNotification({
      title: "Task Completed! 🎉",
      subtitle: `"${taskLabel.textContent}" has been marked as done.`
    }, 'success', 'fa-check-circle');
    tasksCount = Math.max(0, tasksCount - 1);
  } else {
    tasksCount++;
  }
  updateStats();
}

/**
 * Sets a new timer card.
 */
function setTimer(minutes) {
  const timerId = `timer-${Date.now()}`;
  let duration = minutes * 60;
  
  createCard(timerId, "Countdown Timer", "fa-hourglass-half text-orange-300", `
    <div class="timer-display text-center" id="${timerId}-display">
      <div class="text-6xl font-mono font-bold mb-4">00:00</div>
    </div>
    <div class="mt-4 text-center text-sm opacity-80">Timer set for ${minutes} minutes.</div>
    <div class="mt-4 text-center">
      <button onclick="stopTimer('${timerId}')" class="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg">
        <i class="fas fa-stop mr-2"></i>Stop Timer
      </button>
    </div>
  `);
  
  const timerDisplay = document.getElementById(`${timerId}-display`);
  if (!timerDisplay) return;
  
  const interval = setInterval(() => {
    duration--;
    if (duration < 0) {
      clearInterval(activeTimers[timerId]);
      delete activeTimers[timerId];
      const displayDiv = timerDisplay.querySelector('div');
      if (displayDiv) displayDiv.textContent = "Time's Up!";
      showNotification({
        title: "Timer Expired! ⏰",
        subtitle: `Your ${minutes}-minute timer has finished.`
      }, 'warning', 'fa-bell');
      return;
    }
    
    const mins = Math.floor(duration / 60).toString().padStart(2, '0');
    const secs = (duration % 60).toString().padStart(2, '0');
    const displayDiv = timerDisplay.querySelector('div');
    if (displayDiv) displayDiv.textContent = `${mins}:${secs}`;
  }, 1000);
  
  activeTimers[timerId] = interval;
  addToChatHistory(`set a timer for ${minutes} minutes`, "Countdown Timer");
}

/**
 * Stops a running timer
 */
function stopTimer(timerId) {
  if (activeTimers[timerId]) {
    clearInterval(activeTimers[timerId]);
    delete activeTimers[timerId];
    showNotification({
      title: "Timer Stopped",
      subtitle: "Timer has been manually stopped."
    }, 'info', 'fa-stop');
  }
}

/**
 * Fetches and displays a random quote with expanded collection.
 */
function showQuote() {
  const quotes = [
    // Success & Achievement
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
    { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
    { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
    { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
    { text: "If you really look closely, most overnight successes took a long time.", author: "Steve Jobs" },
    { text: "Success is going from failure to failure without losing your enthusiasm.", author: "Winston Churchill" },
    { text: "The successful warrior is the average man with laser-like focus.", author: "Bruce Lee" },
    
    // Dreams & Future
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "The best way to predict the future is to create it.", author: "Abraham Lincoln" },
    { text: "All our dreams can come true, if we have the courage to pursue them.", author: "Walt Disney" },
    { text: "Dream big and dare to fail.", author: "Norman Vaughan" },
    { text: "The future belongs to those who prepare for it today.", author: "Malcolm X" },
    { text: "A goal is a dream with a deadline.", author: "Napoleon Hill" },
    
    // Perseverance & Growth
    { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
    { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
    { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
    { text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
    { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
    { text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
    
    // Wisdom & Philosophy
    { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
    { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
    { text: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.", author: "Albert Einstein" },
    { text: "A room without books is like a body without a soul.", author: "Marcus Tullius Cicero" },
    { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi" },
    { text: "In three words I can sum up everything I've learned about life: it goes on.", author: "Robert Frost" },
    { text: "The unexamined life is not worth living.", author: "Socrates" },
    
    // Motivation & Action
    { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
    { text: "Your limitation—it's only your imagination.", author: "Unknown" },
    { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
    { text: "Great things never come from comfort zones.", author: "Unknown" },
    { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
    { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
    { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
    { text: "Little things make big days.", author: "Unknown" },
    { text: "It's going to be hard, but hard does not mean impossible.", author: "Unknown" },
    
    // Leadership & Influence
    { text: "A leader is one who knows the way, goes the way, and shows the way.", author: "John C. Maxwell" },
    { text: "The way I see it, if you want the rainbow, you gotta put up with the rain.", author: "Dolly Parton" },
    { text: "Don't judge each day by the harvest you reap but by the seeds that you plant.", author: "Robert Louis Stevenson" },
    { text: "If your actions inspire others to dream more, learn more, do more and become more, you are a leader.", author: "John Quincy Adams" },
    
    // Technology & Innovation
    { text: "Technology is best when it brings people together.", author: "Matt Mullenweg" },
    { text: "The advance of technology is based on making it fit in so that you don't really even notice it, so it's part of everyday life.", author: "Bill Gates" },
    { text: "Any sufficiently advanced technology is indistinguishable from magic.", author: "Arthur C. Clarke" },
    { text: "The real problem is not whether machines think but whether men do.", author: "B.F. Skinner" },
    { text: "I think it's fair to say that personal computers have become the most empowering tool we've ever created. They're tools of communication, they're tools of creativity, and they can be shaped by their user.", author: "Bill Gates" },
    
    // Creativity & Art
    { text: "Creativity is intelligence having fun.", author: "Albert Einstein" },
    { text: "The secret to creativity is knowing how to hide your sources.", author: "Einstein" },
    { text: "Every artist was first an amateur.", author: "Ralph Waldo Emerson" },
    { text: "Art enables us to find ourselves and lose ourselves at the same time.", author: "Thomas Merton" },
    
    // Happiness & Life
    { text: "Happiness is not something ready made. It comes from your own actions.", author: "Dalai Lama" },
    { text: "The purpose of our lives is to be happy.", author: "Dalai Lama" },
    { text: "Life is really simple, but we insist on making it complicated.", author: "Confucius" },
    { text: "The good life is one inspired by love and guided by knowledge.", author: "Bertrand Russell" },
    { text: "Yesterday is history, tomorrow is a mystery, today is a gift of God, which is why we call it the present.", author: "Bill Keane" }
  ];
  
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  
  createCard("quote-card", "Inspirational Quote", "fa-quote-left text-teal-300", `
    <div class="text-center p-6 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl">
      <blockquote class="text-2xl italic mb-6 body-font">"${quote.text}"</blockquote>
      <p class="text-lg font-semibold accent-font">- ${quote.author}</p>
    </div>
    <div class="mt-6 text-center">
      <button onclick="showQuote(); removeCard('quote-card');" class="bg-teal-500 hover:bg-teal-600 px-6 py-2 rounded-lg">
        <i class="fas fa-refresh mr-2"></i>New Quote
      </button>
    </div>
  `);
  
  addToChatHistory("show a random quote", "Random Quote");
}

/**
 * Displays a simple news card.
 */
function showNews() {
  const newsHeadlines = [
    "Tech Giants Unveil Breakthrough in AI Ethics",
    "Global Markets Surge as Inflation Concerns Ease", 
    "Sustainable Energy Project Launched in Major City",
    "Space Agency Announces New Mission to Mars",
    "Revolutionary Medical Treatment Shows Promise",
    "Climate Summit Reaches Historic Agreement",
    "Breakthrough in Quantum Computing Achieved",
    "New Renewable Energy Storage Solution Developed",
    "International Cooperation on Ocean Cleanup Expands",
    "Digital Education Revolution Transforms Learning",
    "Healthcare Innovation Reduces Treatment Costs",
    "Smart City Initiative Shows Environmental Benefits"
  ];
  const headline = newsHeadlines[Math.floor(Math.random() * newsHeadlines.length)];
  
  createCard("news-card", "Latest News", "fa-newspaper text-gray-300", `
    <div class="p-6 bg-white/5 rounded-xl mb-4">
      <h3 class="text-xl font-semibold mb-4 body-font">${headline}</h3>
      <p class="text-sm opacity-80 body-font mb-4">A brief summary of the top news story of the day. This is a simulated news headline for demonstration purposes.</p>
      <div class="flex items-center text-xs text-white/60">
        <i class="fas fa-calendar mr-2"></i>
        <span>${new Date().toLocaleDateString()}</span>
        <i class="fas fa-clock ml-4 mr-2"></i>
        <span>${new Date().toLocaleTimeString()}</span>
      </div>
    </div>
    <div class="text-center">
      <a href="https://news.google.com" target="_blank" class="inline-block bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-lg transition-colors">
        <i class="fas fa-external-link-alt mr-2"></i>Read More News
      </a>
    </div>
  `);
  
  addToChatHistory("show the news", "News Headlines");
}

/**
 * Shows YouTube player card
 */
function showYouTube() {
  createCard("youtube-card", "YouTube Player", "fa-play text-red-500", `
    <div class="youtube-player mb-6">
      <iframe width="100%" height="300" 
        src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen>
      </iframe>
    </div>
    <div class="text-center">
      <h4 class="text-xl font-semibold mb-2">🎥 Featured Video</h4>
      <p class="text-sm opacity-80">Enjoy this featured video content!</p>
    </div>
  `);
  
  addToChatHistory("show youtube", "YouTube Player");
}

// =========================================================================
// Main Voice Recognition Logic
// =========================================================================

/**
 * Initializes and starts the voice recognition service.
 */
function startVoiceRecognition() {
  const status = document.getElementById("status");
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    showNotification({
      title: "Speech Recognition Unavailable",
      subtitle: "Your browser doesn't support voice recognition."
    }, 'error', 'fa-microphone-slash');
    return;
  }

  // Stop any existing recognition
  if (currentRecognition) {
    currentRecognition.stop();
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;
  currentRecognition = recognition;

  if (status) status.classList.remove("hidden");

  recognition.onresult = (e) => {
    const cmd = e.results[0][0].transcript.toLowerCase();
    console.log("Voice command received:", cmd);
    
    // If we're expecting a mood response, handle it differently
    if (expectingMood) {
      handleMoodResponse(cmd);
      return;
    }
    
    // Check for specific commands
    const timerMatch = cmd.match(/set a timer for (\d+) minutes?/);
    const taskMatch = cmd.match(/add a task (.+)/);
    const noteMatch = cmd.match(/add a note (.+)/);
    
    if (cmd.includes("show weather") || cmd.includes("weather forecast")) {
      showWeather();
    } else if (cmd.includes("show calculator") || cmd.includes("calculator")) {
      showCalculator();
    } else if (cmd.includes("show gps") || cmd.includes("gps") || cmd.includes("location")) {
      showGPS();
    } else if (cmd.includes("show clock") || cmd.includes("live clock")) {
      showClock();
    } else if (cmd.includes("show youtube") || cmd.includes("youtube")) {
      showYouTube();
    } else if (cmd.includes("play background music") || cmd.includes("background music")) {
      askMood();
      addToChatHistory(cmd, "Asked for Mood & Music");
    } else if (cmd.includes("play music") || cmd.includes("music")) {
      askMood();
      addToChatHistory(cmd, "Asked for Mood & Music");
    } else if (cmd.includes("ask my mood") || cmd.includes("detect mood") || cmd.includes("how is my mood")) {
      askMood();
      addToChatHistory(cmd, "Asked Mood & Recommended Music");
    } else if (cmd.includes("recommend music") || cmd.includes("music for my mood")) {
      recommendMusic();
      addToChatHistory(cmd, "Music Recommendation Based on Notes");
    } else if (cmd.includes("create a note")) {
      createNote();
    } else if (noteMatch) {
      const noteText = noteMatch[1];
      addNote(noteText);
    } else if (taskMatch) {
      const taskText = taskMatch[1];
      addTask(taskText);
    } else if (cmd.includes("add a task")) {
      const taskText = cmd.replace('add a task', '').trim() || 'New Task';
      addTask(taskText);
    } else if (timerMatch) {
      const minutes = parseInt(timerMatch[1]);
      setTimer(minutes);
    } else if (cmd.includes("show the news") || cmd.includes("news")) {
      showNews();
    } else if (cmd.includes("show a random quote") || cmd.includes("random quote") || cmd.includes("quote")) {
      showQuote();
    } else if (cmd.includes("clear all cards")) {
      clearAllCards();
    } else {
      showNotification({
        title: "Command Not Recognized",
        subtitle: `"${cmd}" - Try: weather, calculator, timer, notes, tasks, music, etc.`
      }, 'warning', 'fa-question-circle');
      addToChatHistory(cmd, "Unrecognized Command");
    }
    
    if (status) status.classList.add("hidden");
  };

  recognition.onerror = (e) => {
    console.error("Speech recognition error:", e.error);
    
    // Don't show error if we cancelled it intentionally
    if (e.error !== 'aborted') {
      showNotification({
        title: "Voice Recognition Error",
        subtitle: "Please try again or check microphone permissions"
      }, 'error', 'fa-microphone-slash');
    }
    
    if (status) status.classList.add("hidden");
  };
  
  recognition.onend = () => {
    if (status) status.classList.add("hidden");
    currentRecognition = null;
  };

  recognition.start();
}

// =========================================================================
// Initialization & Startup
// =========================================================================

/**
 * Initialize application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
  // Initialize stats and displays
  updateStats();
  updateChatHistoryDisplay();
  
  // Session time updater
  setInterval(updateSessionTime, 60000);
  
  // Welcome sequence
  setTimeout(() => {
    showNotification({
      title: "Welcome to VocalHub",
      subtitle: "Click 'Begin Voice Recognition' to start your voice-controlled experience"
    }, 'info', 'fa-magic');
  }, 1500);
  
  // Additional welcome message about music feature
  setTimeout(() => {
    showNotification({
      title: "🎵 Music Feature Available",
      subtitle: "Say 'Play background music' to get mood-based music recommendations!"
    }, 'info', 'fa-music');
  }, 8000);
});

// Export functions for global access if needed
window.VocalHub = {
  startVoiceRecognition,
  askMood,
  playMoodMusic,
  recommendMusic,
  showWeather,
  showCalculator,
  showGPS,
  showClock,
  showYouTube,
  createNote,
  addNote,
  addTask,
  setTimer,
  showQuote,
  showNews,
  clearAllCards,
  toggleSidebar,
  updateStats,
  speak
};
