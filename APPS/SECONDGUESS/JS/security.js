const Security = {
  UUID_KEY: 'sg_uuid',
  DATA_KEY: 'sg_data',
  CHECK_KEY: 'sg_checks',

  generateUUID() {
    return 'sg-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  },

  getUUID() {
    let uuid = localStorage.getItem(this.UUID_KEY);
    if (!uuid) {
      uuid = this.generateUUID();
      localStorage.setItem(this.UUID_KEY, uuid);
    }
    return uuid;
  },

  hash(obj) {
    const str = JSON.stringify(obj);
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      h = ((h << 5) - h) + char;
      h = h & h;
    }
    return h.toString(16);
  },

  saveData(data) {
    const payload = { data, ts: Date.now(), hash: this.hash(data) };
    localStorage.setItem(this.DATA_KEY, JSON.stringify(payload));
    this.addTimestampCheck();
  },

  loadData() {
    try {
      const raw = localStorage.getItem(this.DATA_KEY);
      if (!raw) return null;
      const payload = JSON.parse(raw);
      if (payload.hash !== this.hash(payload.data)) {
        console.warn('Data tampering detected');
        return null;
      }
      return payload.data;
    } catch(e) {
      return null;
    }
  },

  addTimestampCheck() {
    const checks = JSON.parse(localStorage.getItem(this.CHECK_KEY) || '[]');
    checks.push(Date.now());
    if (checks.length > 10) checks.shift();
    localStorage.setItem(this.CHECK_KEY, JSON.stringify(checks));
  },

  detectTimeTampering() {
    const checks = JSON.parse(localStorage.getItem(this.CHECK_KEY) || '[]');
    if (checks.length < 2) return false;
    for (let i = 1; i < checks.length; i++) {
      if (checks[i] < checks[i-1]) return true;
      if (checks[i] - checks[i-1] > 1000 * 60 * 60 * 48) return true;
    }
    return false;
  },

  canPlayToday(lastPlayedDate) {
    const now = new Date();
    const today = now.toDateString();

    if (this.detectTimeTampering()) {
      return { canPlay: false, reason: 'time_tampering', fallback: true };
    }

    if (!lastPlayedDate) return { canPlay: true };

    const last = new Date(lastPlayedDate);
    const diffHours = (now - last) / (1000 * 60 * 60);

    if (last.toDateString() === today) {
      return { canPlay: false, reason: 'already_played' };
    }

    if (diffHours < 20) {
      return { canPlay: false, reason: 'too_soon', fallback: true };
    }

    return { canPlay: true };
  },

  getTodayString() {
    return new Date().toDateString();
  }
};
