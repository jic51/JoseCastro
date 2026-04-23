// Polyfill para ctx.roundRect (no soportado en Safari/Firefox antiguos)
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (typeof r === 'number') r = [r, r, r, r];
    if (!Array.isArray(r)) r = [0,0,0,0];
    const [tl, tr, br, bl] = r;
    this.moveTo(x + tl, y);
    this.lineTo(x + w - tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + tr);
    this.lineTo(x + w, y + h - br);
    this.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
    this.lineTo(x + bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - bl);
    this.lineTo(x, y + tl);
    this.quadraticCurveTo(x, y, x + tl, y);
    return this;
  };
}

const UI = {
  // ===== CONFETTI =====
  launchConfetti(intensity = 'medium') {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    container.innerHTML = '';
    const colors = ['#f59e0b', '#fbbf24', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6'];
    const count = intensity === 'high' ? 80 : intensity === 'low' ? 20 : 40;

    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      piece.style.width = (Math.random() * 8 + 6) + 'px';
      piece.style.height = (Math.random() * 8 + 6) + 'px';
      piece.style.animationDuration = (Math.random() * 2 + 2) + 's';
      piece.style.animationDelay = (Math.random() * 0.5) + 's';
      container.appendChild(piece);
    }
    setTimeout(() => { if(container) container.innerHTML = ''; }, 4000);
  },

  // ===== SUSPENSE SCREEN =====
  showSuspense() {
    const el = document.getElementById('suspense-screen');
    if (el) { el.style.display = 'flex'; el.classList.add('animate-fade'); }
    if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
  },
  hideSuspense() {
    const el = document.getElementById('suspense-screen');
    if (el) el.style.display = 'none';
  },

  // ===== COUNTDOWN =====
  updateCountdown(targetDate, elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const update = () => {
      const diff = targetDate - Date.now();
      if (diff <= 0) { el.innerHTML = '<div class="countdown-number">00</div>'; return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      el.innerHTML = `
        <div class="countdown-unit"><div class="countdown-number">${String(h).padStart(2,'0')}</div><div class="countdown-label-unit">${t('hours')}</div></div>
        <div class="countdown-sep">:</div>
        <div class="countdown-unit"><div class="countdown-number">${String(m).padStart(2,'0')}</div><div class="countdown-label-unit">${t('minutes')}</div></div>
        <div class="countdown-sep">:</div>
        <div class="countdown-unit"><div class="countdown-number">${String(s).padStart(2,'0')}</div><div class="countdown-label-unit">${t('seconds')}</div></div>
      `;
    };
    update();
    return setInterval(update, 1000);
  },

  // ===== ACCURACY RING =====
  renderAccuracyRing(percentage, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    container.innerHTML = `
      <svg width="140" height="140" viewBox="0 0 140 140">
        <defs><linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#f59e0b"/><stop offset="100%" style="stop-color:#fbbf24"/></linearGradient></defs>
        <circle class="accuracy-ring-bg" cx="70" cy="70" r="${radius}"/>
        <circle class="accuracy-ring-fill" cx="70" cy="70" r="${radius}" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}"/>
      </svg>
      <div class="accuracy-text">${Math.round(percentage)}%</div>
    `;
    setTimeout(() => {
      const fill = container.querySelector('.accuracy-ring-fill');
      if (fill) fill.style.strokeDashoffset = offset;
    }, 100);
  },

  // ===== SHARE CARD CANVAS =====
  generateShareCard(data, callback) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const w = 1080, h = 1920;
    const dpr = 2;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#1a1b2e');
    grad.addColorStop(0.5, '#16213e');
    grad.addColorStop(1, '#0f3460');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Decorative circles
    ctx.beginPath();
    ctx.arc(w, 0, 400, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(245,158,11,0.06)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, h, 500, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(251,191,36,0.04)';
    ctx.fill();

    // Header
    ctx.font = 'bold 72px "Segoe UI", sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.fillText('🧠 SecondGuess', w/2, 120);

    ctx.font = '32px "Segoe UI", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(currentLang === 'es' ? '¿Qué tan bien lees a la multitud?' : 'How well do you read the crowd?', w/2, 175);

    // Divider
    ctx.beginPath();
    ctx.moveTo(120, 210);
    ctx.lineTo(w-120, 210);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Question - FULL TEXT with dynamic sizing
    ctx.font = 'bold 42px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffffff';
    const qLines = this.wrapText(ctx, data.question, w/2, 280, w-200, 58, 'center');
    const qBottom = 280 + (qLines * 58);

    // Result box - dynamic position based on question height
    const boxTop = qBottom + 60;
    const boxHeight = 520;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.roundRect(100, boxTop, w-200, boxHeight, 40);
    ctx.fill();
    ctx.strokeStyle = 'rgba(245,158,11,0.3)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // User answer
    const innerTop = boxTop + 50;
    ctx.font = '36px "Segoe UI", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(currentLang === 'es' ? 'TU RESPUESTA' : 'YOUR ANSWER', w/2, innerTop);
    ctx.font = 'bold 90px "Segoe UI", sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(data.userAnswer, w/2, innerTop + 90);

    // Average
    ctx.font = '36px "Segoe UI", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(currentLang === 'es' ? 'PROMEDIO DE LA MULTITUD' : 'CROWD AVERAGE', w/2, innerTop + 180);
    ctx.font = 'bold 76px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(data.average, w/2, innerTop + 260);

    // Accuracy - inside the box, below average
    ctx.font = 'bold 64px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(data.accuracy + '% ' + (currentLang === 'es' ? 'precisión' : 'accuracy'), w/2, innerTop + 360);

    // Streak - below box
    const belowBox = boxTop + boxHeight + 50;
    if (data.streak > 0) {
      ctx.font = '44px "Segoe UI", sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('🔥 ' + data.streak + (currentLang === 'es' ? ' días de racha' : ' day streak'), w/2, belowBox);
    }

    // Badge
    const badgeY = belowBox + (data.streak > 0 ? 100 : 30);
    ctx.fillStyle = 'rgba(245,158,11,0.15)';
    ctx.beginPath();
    ctx.roundRect(200, badgeY, w-400, 90, 45);
    ctx.fill();
    ctx.font = 'bold 40px "Segoe UI", sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(data.badge, w/2, badgeY + 60);

    // QR code area
    const qrY = badgeY + 150;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.roundRect(390, qrY, 300, 300, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw simple QR pattern
    ctx.fillStyle = '#ffffff';
    const qrSize = 200;
    const qrX = 440;
    const qrYinner = qrY + 50;
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        if (Math.random() > 0.5) {
          ctx.fillRect(qrX + col * 20, qrYinner + row * 20, 18, 18);
        }
      }
    }
    // QR corners
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.strokeRect(qrX, qrYinner, 60, 60);
    ctx.strokeRect(qrX + 140, qrYinner, 60, 60);
    ctx.strokeRect(qrX, qrYinner + 140, 60, 60);

    // Footer
    const footerY = h - 180;
    ctx.font = '32px "Segoe UI", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('secondguess.app', w/2, footerY);
    ctx.fillText(currentLang === 'es' ? '¿Puedes superarme?' : 'Can you beat me?', w/2, footerY + 50);

    callback(canvas);
  },

  wrapText(ctx, text, x, y, maxWidth, lineHeight, align) {
    const words = text.split(' ');
    let line = '';
    let testLine = '';
    let lineArray = [];
    for (let n = 0; n < words.length; n++) {
      testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        lineArray.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lineArray.push(line);
    for (let k = 0; k < lineArray.length; k++) {
      ctx.textAlign = align;
      ctx.fillText(lineArray[k], x, y + k * lineHeight);
    }
    return lineArray.length;
  },

  // ===== LEADERBOARD SIMULATED =====
  generateLeaderboard(userScore, userName) {
    const names = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Skyler', 'Dakota', 'Reese', 'Rowan', 'Emerson', 'Finley'];
    const entries = [];
    const userRank = Math.floor(Math.random() * 15) + 5;

    for (let i = 1; i <= 20; i++) {
      if (i === userRank) {
        entries.push({ rank: i, name: userName || 'You', score: userScore, isUser: true });
      } else {
        const score = Math.max(100, userScore + Math.floor(Math.random() * 400 - 200) + (userRank - i) * 30);
        entries.push({ rank: i, name: names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random()*99), score: Math.max(50, score), isUser: false });
      }
    }
    entries.sort((a, b) => b.score - a.score);
    entries.forEach((e, i) => e.rank = i + 1);
    return entries;
  },

  renderLeaderboard(entries, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = entries.map(e => `
      <div class="leaderboard-item ${e.isUser ? 'you' : ''} animate-fade" style="animation-delay:${e.rank * 0.05}s">
        <div class="leaderboard-rank ${e.rank <= 3 ? 'top' : ''}">${e.rank}</div>
        <div class="leaderboard-avatar">${e.name.charAt(0).toUpperCase()}</div>
        <div class="leaderboard-name">${e.name} ${e.isUser ? '👤' : ''}</div>
        <div class="leaderboard-score">${e.score}</div>
      </div>
    `).join('');
  },

  // ===== BADGE CALCULATOR =====
  getBadge(accuracy, streak) {
    if (accuracy >= 99) return { label: t('exactMatch'), title: t('crowdWhisperer'), color: '#fbbf24' };
    if (accuracy >= 90) return { label: t('almostThere'), title: t('oracle'), color: '#f59e0b' };
    if (accuracy >= 70) return { label: t('notBad'), title: t('intuitive'), color: '#3b82f6' };
    return { label: t('keepTrying'), title: t('novice'), color: '#64748b' };
  },

  // ===== TITLE BY HISTORY =====
  getTitle(avgAccuracy) {
    if (avgAccuracy >= 85) return t('crowdWhisperer');
    if (avgAccuracy >= 60) return t('oracle');
    if (avgAccuracy >= 40) return t('intuitive');
    return t('novice');
  }
};