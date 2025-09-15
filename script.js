
// =========================================================================
// Global State & Utility Functions
// =========================================================================
let commandCount = 0;
let notesCount = 0;
let tasksCount = 0;
let chatHistory = [];
let sessionStartTime = Date.now();
const activeTimers = {}; // To manage multiple timers

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
  const commandProgress = Math.min((commandCount / 20) * 100, 100); // Scale for more commands

  document.querySelector('#header-cards .stat-card:nth-child(1) .bg-gradient-to-r').style.width = notesProgress + '%';
  document.querySelector('#header-cards .stat-card:nth-child(2) .bg-gradient-to-r').style.width = tasksProgress + '%';
  document.querySelector('#header-cards .stat-card:nth-child(3) .bg-gradient-to-r').style.width = commandProgress + '%';

  updateSessionTime();
}


const musicCard = document.getElementById("music-card");




/**
 * Updates the session duration display.
 */
function updateSessionTime() {
  const elapsed = Math.floor((Date.now() - sessionStartTime) / 60000);
  document.getElementById('session-time').textContent = elapsed + 'm';
}

/**
 * Adds a new entry to the chat history.
 * @param {string} command - The voice command given by the user.
 * @param {string} action - The action performed in response to the command.
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

  sidebar.classList.toggle('open');
  mainContent.classList.toggle('shifted');
  hamburger.classList.toggle('open');
}

/**
 * Creates and displays a temporary notification.
 * @param {object} message - An object containing title and subtitle.
 * @param {string} type - 'success', 'error', 'warning', or 'info'.
 * @param {string} icon - Font Awesome icon class.
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
 * @param {string} id - Unique ID for the card.
 * @param {string} title - Card title.
 * @param {string} icon - Font Awesome icon class.
 * @param {string} html - Inner HTML content for the card.
 */
function createCard(id, title, icon, html) {
  if (document.getElementById(id)) return;

  const card = document.createElement("div");
  card.id = id;
  card.className = "glass-card p-10 rounded-3xl slide-in card-hover-effect";
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

  document.getElementById("card-container").appendChild(card);
  commandCount++;
  updateStats();
}

/**
 * Removes a dynamic card from the dashboard with an animation.
 * @param {string} id - The ID of the card to remove.
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
// Card Creation Functions (Enhanced)
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
      ${["C", "±", "%", "÷", "7", "8", "9", "×", "4", "5", "6", "−", "1", "2", "3", "+", "0", ".", "⌫", "="].map(v =>
    `<button onclick="calcInput('${v}')" class="calc-btn rounded-2xl p-4 text-xl font-semibold hover:scale-110 transition-all duration-300">${v}</button>`).join("")}
    </div>
    <button onclick="calcClear()" class="w-full bg-red-500/80 hover:bg-red-500 rounded-2xl mt-6 p-4 font-semibold transition-all duration-300 accent-font text-lg">
      <i class="fas fa-trash mr-3"></i>Clear All
    </button>`);

  addToChatHistory("show calculator", "Advanced Calculator");
}

/**
 * Handles calculator button input.
 * @param {string} val - The button value.
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
 * @param {string} text - Note text
 */
function addNote(text) {
  if (typeof notes === 'undefined') notes = [];
  notes.push({ text, timestamp: Date.now() });
  if (typeof renderNotes === 'function') {
    renderNotes();
  } else {
    // Minimal fallback: log and ensure there is a notes card
    console.log('Note added:', text);
    // If no notes card exists, create one summary card
    const existing = document.getElementById('notes-list-card');
    const html = `<div class="space-y-3">${(notes || []).map(n => `<div class=\"p-3 bg-white/5 rounded-lg body-font text-sm\">${n.text}</div>`).join('')}</div>`;
    if (existing) {
      existing.querySelector('.body-font').innerHTML = html;
    } else {
      createCard('notes-list-card', 'Notes', 'fa-sticky-note text-blue-300', html);
    }
  }
  updateStats();

  recommendMusic(); // detects mood and updates music card

  speak('Note added');
  addToChatHistory(`add note: ${text}`, 'Note Added');
}

// If there is no renderNotes implementation, add a simple one
if (typeof renderNotes !== 'function') {
  function renderNotes() {
    // Simple console render + ensure notes card exists
    console.log('Rendering notes', notes);
    const existing = document.getElementById('notes-list-card');
    const html = `<div class="space-y-3">${(notes || []).map(n => `<div class=\"p-3 bg-white/5 rounded-lg body-font text-sm\">${n.text}</div>`).join('')}</div>`;
    if (existing) {
      existing.querySelector('.body-font').innerHTML = html;
    } else {
      createCard('notes-list-card', 'Notes', 'fa-sticky-note text-blue-300', html);
    }
  }
}

/**
 * Creates a new task card.
 * @param {string} [taskText='New Task'] - The text content of the task.
 */
function addTask(taskText = 'New Task') {
  const taskId = `task-${Date.now()}`;
  createCard(taskId, "New Task", "fa-tasks text-purple-300", `
    <div class="task-item p-4 bg-white/5 rounded-xl">
      <input type="checkbox" id="${taskId}-checkbox" onclick="toggleTaskCompletion('${taskId}')">
      <label for="${taskId}-checkbox" class="task-text body-font text-lg">${taskText}</label>
    </div>
  `);
  tasksCount++;
  updateStats();
  addToChatHistory(`add a task: ${taskText}`, "New Task Added");
}

/**
 * Toggles the completion state of a task.
 * @param {string} taskId - The ID of the task card.
 */
function toggleTaskCompletion(taskId) {
  const checkbox = document.getElementById(`${taskId}-checkbox`);
  const taskLabel = document.querySelector(`#${taskId} .task-text`);

  if (checkbox.checked) {
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
 * @param {number} minutes - The duration in minutes.
 */
function setTimer(minutes) {
  const timerId = `timer-${Date.now()}`;
  let duration = minutes * 60;

  createCard(timerId, "Countdown Timer", "fa-hourglass-half text-orange-300", `
    <div class="timer-display" id="${timerId}-display">00:00</div>
    <div class="mt-4 text-center text-sm opacity-80">Timer set for ${minutes} minutes.</div>
  `);

  const timerDisplay = document.getElementById(`${timerId}-display`);
  if (!timerDisplay) return;

  const interval = setInterval(() => {
    duration--;
    if (duration < 0) {
      clearInterval(activeTimers[timerId]);
      timerDisplay.textContent = "Time's Up!";
      showNotification({
        title: "Timer Expired! ⏰",
        subtitle: `Your ${minutes}-minute timer has finished.`
      }, 'warning', 'fa-bell');
      return;
    }

    const mins = Math.floor(duration / 60).toString().padStart(2, '0');
    const secs = (duration % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${mins}:${secs}`;
  }, 1000);

  activeTimers[timerId] = interval;
  addToChatHistory(`set a timer for ${minutes} minutes`, "Countdown Timer");
}

/**
 * Fetches and displays a random quote.
 */
function showQuote() {
  const quotes = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
    { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "The best way to predict the future is to create it.", author: "Abraham Lincoln" }
  ];
  const quote = quotes[Math.floor(Math.random() * quotes.length)];

  createCard("quote-card", "Inspirational Quote", "fa-quote-left text-teal-300", `
    <blockquote class="text-xl italic mb-4 body-font">"${quote.text}"</blockquote>
    <p class="text-lg font-semibold text-right accent-font">- ${quote.author}</p>
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
  ];
  const headline = newsHeadlines[Math.floor(Math.random() * newsHeadlines.length)];

  createCard("news-card", "Latest News", "fa-newspaper text-gray-300", `
    <div class="p-4 bg-white/5 rounded-xl mb-4">
      <h3 class="text-lg font-semibold mb-2 body-font">${headline}</h3>
      <p class="text-sm opacity-80 body-font">A brief summary of the top news story of the day. For more, check your favorite news source!</p>
    </div>
    <a href="https://news.google.com" target="_blank" class="text-sm text-blue-400 hover:underline">Read Full Story <i class="fas fa-external-link-alt ml-1"></i></a>
  `);

  addToChatHistory("show the news", "News Headlines");
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

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  status.classList.remove("hidden");

  recognition.onresult = (e) => {
    const cmd = e.results[0][0].transcript.toLowerCase();
    console.log("Voice command received:", cmd);

    // Check for specific commands
    const timerMatch = cmd.match(/set a timer for (\d+) minutes?/);

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
    } else if (cmd.includes("play music") || cmd.includes("background music")) {
      playMusic();
    } else if (cmd.includes("ask my mood") || cmd.includes("detect mood") || cmd.includes("how is my mood")) {
      askMood();
      addToChatHistory(cmd, "Asked Mood & Recommended Music");
    } else if (cmd.includes("recommend music") || cmd.includes("play music for my mood")) {
      recommendMusic();
      addToChatHistory(cmd, "Music Recommendation Based on Notes");
    } else if (cmd.includes("create a note")) {
      createNote();
    } else if (cmd.includes("add a task")) {
      const taskText = cmd.replace('add a task', '').trim() || 'New Task';
      addTask(taskText);
    } else if (timerMatch) {
      const minutes = parseInt(timerMatch[1]);
      setTimer(minutes);
    } else if (cmd.includes("show the news")) {
      showNews();
    } else if (cmd.includes("show a random quote") || cmd.includes("random quote")) {
      showQuote();
    } else if (cmd.includes("clear all cards")) {
      clearAllCards();
    } else {
      showNotification({
        title: "Command Not Recognized",
        subtitle: `"${cmd}" - Try one of the suggested commands`
      }, 'warning', 'fa-question-circle');
      addToChatHistory(cmd, "Unrecognized Command");
    }

    status.classList.add("hidden");
  };

  recognition.onerror = (e) => {
    console.error("Speech recognition error:", e.error);
    showNotification({
      title: "Voice Recognition Error",
      subtitle: "Please try again or check microphone permissions"
    }, 'error', 'fa-microphone-slash');
    status.classList.add("hidden");
  };

  recognition.onend = () => status.classList.add("hidden");
  recognition.start();
}

/* === Mood detection from notes === */
function detectMoodFromNotes() {
  const text = (notes || []).map(n => (n.text || '').toLowerCase()).join(' ');

  const keywords = {
    happy: ['happy', 'joy', 'excited', 'glad', 'great', 'wonderful', 'delighted', 'pleased', 'cheerful', 'elated'],
    sad: ['sad', 'unhappy', 'depressed', 'down', 'lonely', 'miserable', 'tear', 'sorrow', 'tired', 'blue', 'gloom'],
    angry: ['angry', 'mad', 'furious', 'annoyed', 'irritated', 'frustrated', 'rage', 'resentful'],
    calm: ['calm', 'relax', 'peace', 'tranquil', 'serene', 'chill', 'rested']
  };

  const tokens = text.split(/[^a-z0-9]+/).filter(Boolean);
  const counts = { happy: 0, sad: 0, angry: 0, calm: 0 };

  tokens.forEach(token => {
    for (const mood in keywords) {
      if (keywords[mood].includes(token)) counts[mood]++;
    }
  });

  const totalMatches = Object.values(counts).reduce((a, b) => a + b, 0);
  if (totalMatches === 0) return 'neutral';

  const priority = ['happy', 'calm', 'sad', 'angry'];
  let best = 'neutral';
  let bestScore = 0;
  for (const mood of Object.keys(counts)) {
    if (counts[mood] > bestScore) {
      best = mood;
      bestScore = counts[mood];
    } else if (counts[mood] === bestScore && counts[mood] > 0) {
      if (priority.indexOf(mood) < priority.indexOf(best)) best = mood;
    }
  }

  return best;
}

function askMood() {
  speak("How are you feeling right now? You can say: happy, sad, calm, or angry.");

  if (!("webkitSpeechRecognition" in window)) {
    alert("Speech Recognition not supported in this browser.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.start();

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript.toLowerCase();
    console.log("User said:", transcript);

    // Mood keywords dictionary
    const moodMap = {
      happy: ["happy", "joyful", "excited", "great"],
      sad: ["sad", "unhappy", "down", "depressed"],
      calm: ["calm", "relaxed", "peaceful", "chill"],
      angry: ["angry", "mad", "furious", "frustrated"]
    };

    let detectedMood = "neutral"; // default

    // Search transcript for any mood keyword
    for (const mood in moodMap) {
      if (moodMap[mood].some(word => transcript.includes(word))) {
        detectedMood = mood;
        break;
      }
    }

    console.log("Detected mood:", detectedMood);
    playMoodMusic(detectedMood);
  };

  recognition.onerror = function () {
    speak("Sorry, I couldn’t catch that. Please try again.");
  };
}

function playMoodMusic(mood) {
  let playlistUrl = "";

  switch (mood) {
    case "happy":
      playlistUrl = "37i9dQZF1DXdPec7aLTmlC"; // Happy Hits
      speak("You sound happy! Let me play some upbeat songs.");
      break;
    case "sad":
      playlistUrl = "37i9dQZF1DX7qK8ma5wgG1"; // Sad Songs
      speak("I hear you are sad. Here are some comforting songs.");
      break;
    case "angry":
      playlistUrl = "37i9dQZF1DWYxwmBaMqxsl"; // Rock Hard
      speak("You seem angry. Let's play some energetic rock.");
      break;
    case "calm":
      playlistUrl = "37i9dQZF1DWU0ScTcjJBdj"; // Chill Vibes
      speak("You sound calm. Here’s some relaxing vibes.");
      break;
    default:
      playlistUrl = "37i9dQZF1DXcBWIGoYBM5M"; // Today's Top Hits
      speak("I couldn’t detect a clear mood, so here’s today’s top hits.");
  }

  const musicContent = document.getElementById("music-content");
  musicContent.innerHTML = `
    <iframe src="https://open.spotify.com/embed/playlist/${playlistUrl}"
      width="100%" height="380" frameborder="0" allowtransparency="true" allow="encrypted-media">
    </iframe>
  `;

  const musicCard = document.getElementById("music-card");
  musicCard.classList.remove("opacity-0");
  musicCard.classList.add("visible");
}
function recommendMusic() {
  const mood = detectMoodFromNotes();
  console.log("Detected mood from notes:", mood);
  playMoodMusic(mood);
}

function recommendMusicForMood() {

}

// =========================================================================
// Initialization & Startup
// =========================================================================

// Initialize application
updateStats();
updateChatHistoryDisplay();

// --- Mood Detection + Music Recommendation (added) ---
// Provide a sample `notes` array if not already present
if (typeof notes === 'undefined') {
  var notes = [
    { text: 'I feel very happy today' },
    { text: 'Completed a big milestone at work' }
  ];
}

// Fallback speak function
function speak(msg) {
  if ('speechSynthesis' in window) {
    const ut = new SpeechSynthesisUtterance(msg);
    speechSynthesis.cancel(); // stop previous
    speechSynthesis.speak(ut);
  } else {
    console.log('speak:', msg);
  }
}




// Session time updater
setInterval(updateSessionTime, 60000);

// Welcome sequence
document.addEventListener('DOMContentLoaded', function () {
  setTimeout(() => {
    showNotification({
      title: "Welcome to VocalHub",
      subtitle: "Click 'Begin Voice Recognition' to start your session"
    }, 'info', 'fa-magic');
  }, 1500);
});



const getMusicBtn = document.getElementById('music-recommend-btn');
const moodModalContainer = document.getElementById('mood-modal-container');
const moodModalContent = document.getElementById('mood-modal-content');

/**
 * This is the main function that will be called with the selected mood.
 * For now, it just logs the mood to the console.
 * @param {string} mood The selected mood (e.g., "happy", "sad").
 */
function recommendMusicForMood(mood) {
  console.log(`Recommendation function called for mood: ${mood}`);
  alert(`Okay, finding music for when you're feeling ${mood}!`);
  // You can add your music recommendation logic here.
  playMoodMusic(mood);
}

// Show the modal when the "Get Music" button is clicked
getMusicBtn.addEventListener('click', () => {
  moodModalContainer.classList.remove('opacity-0', 'pointer-events-none');
});

// Use event delegation to handle clicks on any of the mood buttons
moodModalContent.addEventListener('click', (event) => {
  // Check if the clicked element is a mood button
  const target = event.target.closest('.mood-option');
  if (target) {
    // Get the mood from the data-mood attribute
    const selectedMood = target.dataset.mood;

    // Hide the modal
    moodModalContainer.classList.add('opacity-0', 'pointer-events-none');

    // Call the main function with the selected mood
    recommendMusicForMood(selectedMood);
  }
});

// Optional: Hide the modal if the user clicks on the background overlay
moodModalContainer.addEventListener('click', (event) => {
  if (event.target === moodModalContainer) {
    moodModalContainer.classList.add('opacity-0', 'pointer-events-none');
  }
});
