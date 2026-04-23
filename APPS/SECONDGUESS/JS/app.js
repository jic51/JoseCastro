// ===== STATE =====
const App = {
  data: {
    name: '',
    streak: 0,
    bestStreak: 0,
    gamesPlayed: 0,
    totalAccuracy: 0,
    totalPoints: 0,
    history: [],
    answeredDates: {},
    lastPlayed: null,
    onboardingDone: false,
    leaderboardCache: null,
    leaderboardCacheDate: null
  },
  today: new Date(),
  currentQuestion: null,
  timerInterval: null,

  init() {
    this.loadData();
    this.setupLanguage();
    this.registerSW();

    if (!this.data.onboardingDone) {
      this.showOnboarding();
    } else {
      this.showApp();
    }

    this.bindEvents();
  },

  registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  },

  setupLanguage() {
    document.documentElement.lang = currentLang;
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) langToggle.textContent = currentLang.toUpperCase();
  },

  loadData() {
    const saved = Security.loadData();
    if (saved) {
      this.data = { ...this.data, ...saved };
    }
    // Check streak break
    if (this.data.lastPlayed) {
      const last = new Date(this.data.lastPlayed);
      const diff = Math.floor((this.today - last) / (1000 * 60 * 60 * 24));
      if (diff > 1) {
        this.data.streak = 0;
      }
    }
  },

  saveData() {
    Security.saveData(this.data);
  },

  // ===== ONBOARDING =====
  showOnboarding() {
    document.getElementById('onboarding').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
    this.renderOnboardingStep(1);
  },

  renderOnboardingStep(step) {
    document.querySelectorAll('.onboarding-step').forEach((el, i) => {
      el.classList.toggle('active', i + 1 === step);
    });
    document.querySelectorAll('.dot').forEach((el, i) => {
      el.classList.toggle('active', i + 1 === step);
    });

    const btn = document.getElementById('onboarding-btn');
    if (step === 3) {
      btn.textContent = t('startPlaying');
      btn.onclick = () => {
        this.data.onboardingDone = true;
        this.saveData();
        this.showApp();
      };
    } else {
      btn.textContent = t('next');
      btn.onclick = () => this.renderOnboardingStep(step + 1);
    }
  },

  showApp() {
    document.getElementById('onboarding').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    this.renderMainView();
  },

  // ===== MAIN VIEW ROUTING =====
  renderMainView() {
    const view = document.getElementById('main-view');
    this.currentQuestion = getQuestionForDate(this.today);

    const check = Security.canPlayToday(this.data.lastPlayed);
    const todayStr = Security.getTodayString();
    const alreadyAnswered = this.data.answeredDates[todayStr];

    if (alreadyAnswered) {
      this.renderResults(view, todayStr);
    } else if (!check.canPlay && check.reason === 'already_played') {
      this.renderResults(view, todayStr);
    } else if (!check.canPlay && check.fallback) {
      // Time tampering or too soon — show countdown from last played + 24h
      this.renderCountdown(view, new Date(this.data.lastPlayed).getTime() + 24 * 60 * 60 * 1000);
    } else {
      this.renderQuestion(view);
    }
  },

  // ===== QUESTION VIEW =====
  renderQuestion(container) {
    const q = this.currentQuestion;
    const qData = q[currentLang];
    const isNumeric = q.type === 'numeric';

    container.innerHTML = `
      <div class="streak-bar animate-fade">
        <span class="streak-flame">${this.data.streak > 0 ? '🔥' : '⚡'}</span>
        <span class="streak-count">${this.data.streak}</span>
        <span class="streak-text">${t('streak')}</span>
      </div>

      <div class="question-card animate-pop">
        <div class="question-label">${t('questionOfDay')}</div>
        <div class="question-text">${qData.q}</div>

        ${isNumeric ? `
          <div class="input-group">
            <input type="number" class="number-input" id="answer-input" placeholder="${t('enterNumber')}" inputmode="numeric">
            <span class="unit-suffix">${q.unit || ''}</span>
          </div>
        ` : `
          <div class="options-grid" id="options-grid">
            ${qData.options.map((opt, i) => `
              <button class="option-btn" data-index="${i}" onclick="App.selectOption(this, ${i})">
                ${opt}
              </button>
            `).join('')}
          </div>
        `}

        <button class="submit-btn shine" id="submit-btn" onclick="App.submitAnswer()" disabled>
          ${t('submit')}
        </button>
      </div>

      <div class="stats-grid animate-fade" style="animation-delay:0.2s">
        <div class="stat-box"><div class="stat-value">${this.data.gamesPlayed}</div><div class="stat-label">${t('gamesPlayed')}</div></div>
        <div class="stat-box"><div class="stat-value">${this.data.gamesPlayed > 0 ? Math.round(this.data.totalAccuracy / this.data.gamesPlayed) : 0}%</div><div class="stat-label">${t('avgAccuracy')}</div></div>
        <div class="stat-box"><div class="stat-value">${this.data.totalPoints}</div><div class="stat-label">${t('totalPoints')}</div></div>
      </div>
    `;

    if (isNumeric) {
      const input = document.getElementById('answer-input');
      input.addEventListener('input', () => {
        document.getElementById('submit-btn').disabled = !input.value;
      });
      input.focus();
    }
  },

  selectedOption: null,

  selectOption(btn, index) {
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    this.selectedOption = index;
    document.getElementById('submit-btn').disabled = false;
  },

  // ===== SUBMIT =====
  submitAnswer() {
    const q = this.currentQuestion;
    let userVal;

    if (q.type === 'numeric') {
      const input = document.getElementById('answer-input');
      userVal = parseFloat(input.value);
      if (isNaN(userVal)) return;
    } else {
      if (this.selectedOption === null) return;
      userVal = this.selectedOption;
    }

    UI.showSuspense();
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

    setTimeout(() => {
      UI.hideSuspense();
      this.processAnswer(userVal);
    }, 2500);
  },

  processAnswer(userVal) {
    const q = this.currentQuestion;
    const todayStr = Security.getTodayString();

    let accuracy, points, avgDisplay;

    if (q.type === 'numeric') {
      const avg = q.simulatedAvg;
      const diff = Math.abs(userVal - avg);
      const maxDiff = avg * 2;
      accuracy = Math.max(0, Math.round(100 - (diff / maxDiff) * 100));
      points = Math.round(accuracy * 10);
      avgDisplay = avg.toLocaleString();
    } else {
      const dist = q.simulatedDist;
      const maxDist = Math.max(...dist);
      const userDist = dist[userVal];
      accuracy = Math.round((userDist / maxDist) * 100);
      points = Math.round(accuracy * 10);
      avgDisplay = q[currentLang].options[dist.indexOf(maxDist)];
    }

    // Update stats
    this.data.gamesPlayed++;
    this.data.totalAccuracy += accuracy;
    this.data.totalPoints += points;
    this.data.lastPlayed = new Date().toISOString();
    this.data.answeredDates[todayStr] = {
      questionId: q.id,
      answer: userVal,
      accuracy: accuracy,
      points: points,
      date: todayStr
    };

    // Streak logic
    const yesterday = new Date(this.today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (this.data.answeredDates[yesterday.toDateString()]) {
      this.data.streak++;
    } else {
      this.data.streak = 1;
    }
    if (this.data.streak > this.data.bestStreak) this.data.bestStreak = this.data.streak;

    this.saveData();
    this.renderResults(document.getElementById('main-view'), todayStr);

    // Effects
    if (accuracy >= 90) UI.launchConfetti('high');
    else if (accuracy >= 70) UI.launchConfetti('medium');
    else UI.launchConfetti('low');
  },

  // ===== RESULTS VIEW =====
  renderResults(container, dateStr) {
    const record = this.data.answeredDates[dateStr];
    if (!record) { this.renderQuestion(container); return; }

    const q = QUESTIONS.find(q => q.id === record.questionId) || this.currentQuestion;
    const qData = q[currentLang];
    const badge = UI.getBadge(record.accuracy, this.data.streak);
    const userAnswerStr = q.type === 'numeric' ? record.answer.toLocaleString() + (q.unit || '') : qData.options[record.answer];
    const avgStr = q.type === 'numeric' ? q.simulatedAvg.toLocaleString() + (q.unit || '') : qData.options[q.simulatedDist.indexOf(Math.max(...q.simulatedDist))];

    container.innerHTML = `
      <div class="streak-bar animate-fade">
        <span class="streak-flame">${this.data.streak > 0 ? '🔥' : '⚡'}</span>
        <span class="streak-count">${this.data.streak}</span>
        <span class="streak-text">${t('streak')}</span>
      </div>

      <div class="result-card animate-pop">
        <div class="result-badge">${badge.label}</div>
        <div class="result-title">${badge.title}</div>
        <div class="result-subtitle">${t('youAre')} <strong style="color:#fbbf24">${badge.title}</strong></div>

        <div class="accuracy-ring" id="accuracy-ring"></div>

        <div class="comparison-box">
          <div class="comparison-item">
            <div class="comparison-label">${t('yourGuess')}</div>
            <div class="comparison-value highlight">${userAnswerStr}</div>
          </div>
          <div class="comparison-item">
            <div class="comparison-label">${t('crowdAverage')}</div>
            <div class="comparison-value">${avgStr}</div>
          </div>
        </div>

        <div style="font-size:1.1rem;color:#94a3b8;margin-bottom:0.5rem">
          ${t('difference')}: <strong style="color:#fff">${q.type === 'numeric' ? Math.abs(record.answer - q.simulatedAvg).toLocaleString() : '-'}</strong>
        </div>
        <div style="font-size:1.1rem;color:#94a3b8">
          ${t('topPercent')}: <strong style="color:#fbbf24">${Math.max(1, 100 - record.accuracy)}%</strong>
        </div>
      </div>

      <div class="insight-card animate-fade" style="animation-delay:0.2s">
        <div class="insight-label">💡 ${t('funFactUnlock')}</div>
        <div class="insight-text">${qData.fact}</div>
      </div>

      <div class="share-actions animate-fade" style="animation-delay:0.3s">
        <button class="share-btn" onclick="App.shareResult()">
          📤 ${t('share')}
        </button>
        <button class="share-btn" onclick="App.downloadCard()">
          💾 ${t('downloadCard')}
        </button>
      </div>

      <div style="margin-top:1.5rem">
        <div style="font-size:0.85rem;color:#64748b;text-align:center;margin-bottom:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">
          ${t('leaderboard')}
        </div>
        <div class="leaderboard-list" id="leaderboard-list"></div>
      </div>

      <div class="countdown-card animate-fade" style="animation-delay:0.4s;margin-top:1.5rem">
        <div class="countdown-label">${t('nextQuestionIn')}</div>
        <div class="countdown-timer" id="results-countdown"></div>
      </div>
    `;

    UI.renderAccuracyRing(record.accuracy, 'accuracy-ring');

    const tomorrow = new Date(this.today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = UI.updateCountdown(tomorrow, 'results-countdown');

    // Use cached leaderboard or generate new one
    const todayStr = Security.getTodayString();
    let lb;
    if (this.data.leaderboardCacheDate === todayStr && this.data.leaderboardCache) {
      lb = this.data.leaderboardCache;
    } else {
      lb = UI.generateLeaderboard(this.data.totalPoints, this.data.name);
      this.data.leaderboardCache = lb;
      this.data.leaderboardCacheDate = todayStr;
      this.saveData();
    }
    UI.renderLeaderboard(lb, 'leaderboard-list');
  },

  // ===== COUNTDOWN VIEW (anti-cheat fallback) =====
  renderCountdown(container, targetTime) {
    container.innerHTML = `
      <div class="countdown-card animate-pop" style="margin-top:2rem">
        <div style="font-size:3rem;margin-bottom:1rem">⏳</div>
        <div style="font-size:1.25rem;font-weight:700;color:#fff;margin-bottom:0.5rem">
          ${t('alreadyAnswered')}
        </div>
        <div style="color:#94a3b8;margin-bottom:1.5rem">
          ${t('comeBack')}
        </div>
        <div class="countdown-timer" id="wait-countdown"></div>
      </div>

      <div class="stats-grid animate-fade" style="animation-delay:0.2s;margin-top:1.5rem">
        <div class="stat-box"><div class="stat-value">${this.data.gamesPlayed}</div><div class="stat-label">${t('gamesPlayed')}</div></div>
        <div class="stat-box"><div class="stat-value">${this.data.gamesPlayed > 0 ? Math.round(this.data.totalAccuracy / this.data.gamesPlayed) : 0}%</div><div class="stat-label">${t('avgAccuracy')}</div></div>
        <div class="stat-box"><div class="stat-value">${this.data.bestStreak}</div><div class="stat-label">${t('bestStreak')}</div></div>
      </div>
    `;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = UI.updateCountdown(targetTime, 'wait-countdown');
  },

    // ===== SHARE =====
  getShareData() {
    const todayStr = Security.getTodayString();
    const record = this.data.answeredDates[todayStr];
    if (!record) return null;
    const q = QUESTIONS.find(q => q.id === record.questionId);
    const qData = q[currentLang];
    const badge = UI.getBadge(record.accuracy, this.data.streak);
    const avgStr = q.type === 'numeric' ? q.simulatedAvg.toLocaleString() + (q.unit || '') : qData.options[q.simulatedDist.indexOf(Math.max(...q.simulatedDist))];
    const userStr = q.type === 'numeric' ? record.answer.toLocaleString() + (q.unit || '') : qData.options[record.answer];
    return {
      question: qData.q,
      userAnswer: userStr,
      average: avgStr,
      accuracy: record.accuracy,
      streak: this.data.streak,
      badge: badge.title,
      rawAnswer: record.answer,
      simulatedAvg: q.simulatedAvg,
      qData,
      q
    };
  },

  shareResult() {
    this.showSharePreview();
  },

  showSharePreview() {
    const data = this.getShareData();
    if (!data) return;

    const modal = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    modal.classList.add('active');

    UI.generateShareCard(data, (canvas) => {
      const previewUrl = canvas.toDataURL('image/png');

      const shareText = currentLang === 'es'
        ? `🧠 SecondGuess — ¿Qué tan bien leo a la multitud?%0A%0A📌 ${data.question}%0A👤 Mi respuesta: ${data.userAnswer}%0A👥 Promedio: ${data.average}%0A🎯 Precisión: ${data.accuracy}%25%0A🔥 Racha: ${data.streak} días%0A%0A¿Puedes superarme? 🎯 secondguess.app`
        : `🧠 SecondGuess — How well do I read the crowd?%0A%0A📌 ${data.question}%0A👤 My answer: ${data.userAnswer}%0A👥 Average: ${data.average}%0A🎯 Accuracy: ${data.accuracy}%25%0A🔥 Streak: ${data.streak} days%0A%0ACan you beat me? 🎯 secondguess.app`;

      const plainText = currentLang === 'es'
        ? `🧠 SecondGuess — ¿Qué tan bien leo a la multitud?

📌 ${data.question}
👤 Mi respuesta: ${data.userAnswer}
👥 Promedio: ${data.average}
🎯 Precisión: ${data.accuracy}%
🔥 Racha: ${data.streak} días

¿Puedes superarme? 🎯 secondguess.app`
        : `🧠 SecondGuess — How well do I read the crowd?

📌 ${data.question}
👤 My answer: ${data.userAnswer}
👥 Average: ${data.average}
🎯 Accuracy: ${data.accuracy}%
🔥 Streak: ${data.streak} days

Can you beat me? 🎯 secondguess.app`;

      content.innerHTML = `
        <div class="modal-title">📤 ${t('share')}</div>
        <div style="text-align:center;margin-bottom:1rem">
          <img src="${previewUrl}" style="max-width:100%;border-radius:16px;border:2px solid rgba(245,158,11,0.3);max-height:50vh;object-fit:contain" alt="Preview">
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.5rem;margin-bottom:1rem">
          <a href="https://wa.me/?text=${shareText}" target="_blank" class="share-btn" style="text-decoration:none;background:#25d366;color:#fff">
            💬 WhatsApp
          </a>
          <a href="https://twitter.com/intent/tweet?text=${shareText}" target="_blank" class="share-btn" style="text-decoration:none;background:#000;color:#fff">
            🐦 X / Twitter
          </a>
          <a href="https://www.facebook.com/sharer/sharer.php?quote=${shareText}" target="_blank" class="share-btn" style="text-decoration:none;background:#1877f2;color:#fff">
            📘 Facebook
          </a>
          <a href="sms:?body=${shareText}" class="share-btn" style="text-decoration:none;background:#34c759;color:#fff">
            ✉️ SMS
          </a>
          <a href="mailto:?subject=SecondGuess&body=${shareText}" class="share-btn" style="text-decoration:none;background:#ea4335;color:#fff">
            📧 Email
          </a>
          <button class="share-btn" onclick="App.copyShareText()" style="background:#8b5cf6;color:#fff;border:none">
            📋 ${currentLang === 'es' ? 'Copiar' : 'Copy'}
          </button>
        </div>
        <button class="modal-btn modal-btn-primary" style="width:100%" onclick="App.downloadCard()">
          💾 ${t('downloadCard')}
        </button>
      `;

      this._sharePlainText = plainText;
    });
  },

  copyShareText() {
    if (this._sharePlainText) {
      navigator.clipboard.writeText(this._sharePlainText).then(() => {
        const btn = event.target;
        const original = btn.textContent;
        btn.textContent = currentLang === 'es' ? '✅ Copiado!' : '✅ Copied!';
        setTimeout(() => btn.textContent = original, 2000);
      });
    }
  },

  downloadCard() {
    const data = this.getShareData();
    if (!data) return;
    UI.generateShareCard(data, (canvas) => {
      const link = document.createElement('a');
      link.download = 'secondguess-result.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  },

// ===== MODALS =====
  showSettings() {
    const modal = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    modal.classList.add('active');
    content.innerHTML = `
      <div class="modal-title">⚙️ ${t('settings')}</div>
      <div style="margin-bottom:1rem">
        <label style="display:block;color:#94a3b8;font-size:0.85rem;margin-bottom:0.5rem">${t('enterName')}</label>
        <input type="text" class="modal-input" id="settings-name" value="${this.data.name}" placeholder="Player">
      </div>
      <div style="margin-bottom:1.5rem">
        <label style="display:block;color:#94a3b8;font-size:0.85rem;margin-bottom:0.5rem">${t('language')}</label>
        <div style="display:flex;gap:0.5rem">
          <button class="modal-btn ${currentLang === 'es' ? 'modal-btn-primary' : 'modal-btn-secondary'}" onclick="App.setLanguage('es')">Español</button>
          <button class="modal-btn ${currentLang === 'en' ? 'modal-btn-primary' : 'modal-btn-secondary'}" onclick="App.setLanguage('en')">English</button>
        </div>
      </div>
      <button class="modal-btn modal-btn-secondary" style="width:100%;margin-bottom:0.75rem;color:#ef4444;border:1px solid rgba(239,68,68,0.3)" onclick="App.confirmReset()">
        🗑️ ${t('resetProgress')}
      </button>
      <button class="modal-btn modal-btn-primary" style="width:100%" onclick="App.saveSettings()">
        ${t('save')}
      </button>
    `;
  },

  saveSettings() {
    const nameInput = document.getElementById('settings-name');
    if (nameInput) this.data.name = nameInput.value.trim() || 'Player';
    this.saveData();
    this.closeModal();
    this.renderMainView();
  },

  setLanguage(lang) {
    setLang(lang);
    this.closeModal();
    this.renderMainView();
    document.getElementById('lang-toggle').textContent = lang.toUpperCase();
  },

  confirmReset() {
    const content = document.getElementById('modal-content');
    content.innerHTML = `
      <div class="modal-title" style="color:#ef4444">⚠️ ${t('resetProgress')}</div>
      <p style="color:#94a3b8;margin-bottom:1.5rem">${t('confirmReset')}</p>
      <div class="modal-actions">
        <button class="modal-btn modal-btn-secondary" onclick="App.closeModal()">${t('cancel')}</button>
        <button class="modal-btn modal-btn-primary" style="background:#ef4444" onclick="App.doReset()">${t('yesReset')}</button>
      </div>
    `;
  },

  doReset() {
    this.data = {
      name: '', streak: 0, bestStreak: 0, gamesPlayed: 0,
      totalAccuracy: 0, totalPoints: 0, history: [],
      answeredDates: {}, lastPlayed: null, onboardingDone: true
    };
    localStorage.removeItem(Security.DATA_KEY);
    localStorage.removeItem(Security.CHECK_KEY);
    this.saveData();
    this.closeModal();
    this.renderMainView();
  },

  openFeedback() {
    const formUrl = currentLang === 'es' 
      ? 'https://forms.gle/EXAMPLE_SPANISH' 
      : 'https://forms.gle/EXAMPLE_ENGLISH';
    window.open(formUrl, '_blank');
  },

  showInfo() {
    const modal = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    modal.classList.add('active');
    content.innerHTML = `
      <div class="modal-title">🧠 ${t('howItWorks')}</div>
      <div style="color:#cbd5e1;line-height:1.7;font-size:0.95rem">
        <p style="margin-bottom:1rem"><strong style="color:#fbbf24">SecondGuess</strong> ${currentLang === 'es' ? 'no es un juego de conocimiento. Es un juego de psicología social.' : 'is not a knowledge game. It is a social psychology game.'}</p>
        <p style="margin-bottom:1rem">• ${currentLang === 'es' ? 'Recibes una pregunta al día' : 'You get one question per day'}</p>
        <p style="margin-bottom:1rem">• ${currentLang === 'es' ? 'No busques la respuesta correcta. Busca la respuesta que dará la mayoría.' : 'Don\'t look for the right answer. Look for the answer the majority will give.'}</p>
        <p style="margin-bottom:1rem">• ${currentLang === 'es' ? 'Ganas puntos por estar cerca del promedio de todos los jugadores' : 'You earn points by being close to the average of all players'}</p>
        <p>• ${currentLang === 'es' ? 'Mantén tu racha respondiendo todos los días' : 'Keep your streak by answering every day'}</p>
      </div>
      <button class="modal-btn modal-btn-primary" style="width:100%;margin-top:1rem" onclick="App.closeModal()">OK</button>
    `;
  },

  closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
  },

  // ===== EVENTS =====
  bindEvents() {
    const btnSettings = document.getElementById('btn-settings');
    const btnInfo = document.getElementById('btn-info');
    const langToggle = document.getElementById('lang-toggle');
    const modalOverlay = document.getElementById('modal-overlay');

    if (btnSettings) btnSettings.addEventListener('click', () => this.showSettings());
    if (btnInfo) btnInfo.addEventListener('click', () => this.showInfo());
    if (langToggle) {
      langToggle.addEventListener('click', () => {
        const newLang = currentLang === 'es' ? 'en' : 'es';
        this.setLanguage(newLang);
      });
    }
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target.id === 'modal-overlay') this.closeModal();
      });
    }
  }
};

// Start
document.addEventListener('DOMContentLoaded', () => App.init());