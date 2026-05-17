// FIREBASE_CONFIG is loaded from app.config.js (not checked in).
// Copy app.config.example.js → app.config.js and fill in your values.
const FIREBASE_READY = typeof FIREBASE_CONFIG !== 'undefined' && !!FIREBASE_CONFIG.apiKey;

let _db = null;
function getDb() {
  if (_db) return _db;
  if (!FIREBASE_READY) throw new Error("Firebase not configured — fill in FIREBASE_CONFIG in app.js");
  firebase.initializeApp(FIREBASE_CONFIG);
  _db = firebase.database();
  return _db;
}

// ── Utilities ────────────────────────────────────────────────

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function formatTime(ms) {
  if (ms <= 0) return "00:00";
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// Warning thresholds (ms)
const T_YELLOW = 5 * 60 * 1000;
const T_RED    = 1 * 60 * 1000;
const T_PULSE  = 30 * 1000;

function colorClass(remainingMs) {
  if (remainingMs <= T_RED)    return "red";
  if (remainingMs <= T_YELLOW) return "yellow";
  return "green";
}

// ── Timer math (connected mode) ──────────────────────────────
//
// elapsed = (now − startedAt) − totalPausedMs
// remaining = (duration + durationAdjustmentMs) − elapsed
//
// When paused: elapsed is frozen at (pausedAt − startedAt) − totalPausedMs
// When idle:   show full duration (not counting down)

function calcRemaining(session) {
  const { duration, durationAdjustmentMs, startedAt, pausedAt, totalPausedMs, state } = session;
  const total = (duration || 0) + (durationAdjustmentMs || 0);
  if (state === "idle")     return total;
  if (state === "finished") return 0;
  const base = state === "paused" ? pausedAt : Date.now();
  const elapsed = (base - startedAt) - (totalPausedMs || 0);
  return Math.max(0, total - elapsed);
}

// ── Firebase session operations ──────────────────────────────

function sessionRef(code) {
  return getDb().ref(`sessions/${code}`);
}

function createSession(code, durationMs, speakers = []) {
  return sessionRef(code).set({
    duration:             durationMs,
    durationAdjustmentMs: 0,
    startedAt:            0,
    pausedAt:             0,
    totalPausedMs:        0,
    state:                "idle",
    currentSpeakerIndex:  0,
    speakerActive:        false,
    speakers,
    message: { text: "", sentAt: 0 }
  });
}

function updateSession(code, updates) {
  return sessionRef(code).update(updates);
}

function watchSession(code, callback) {
  const ref = sessionRef(code);
  ref.on("value", snap => callback(snap.exists() ? snap.val() : null));
  return () => ref.off("value");
}

function calcOvertime(session) {
  const { duration, durationAdjustmentMs, startedAt, totalPausedMs, state } = session;
  if (state !== "running") return 0;
  const total   = (duration || 0) + (durationAdjustmentMs || 0);
  const elapsed = (Date.now() - startedAt) - (totalPausedMs || 0);
  return Math.max(0, elapsed - total);
}

function formatOvertime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `+${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ── Audio alerts ─────────────────────────────────────────────

let _audioCtx = null;
let _audioUnlocked = false;

function unlockAudio() {
  if (_audioUnlocked) return;
  _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  _audioUnlocked = true;
}

function beep(frequency = 880, durationSec = 0.15, volume = 0.4) {
  if (!_audioUnlocked || !_audioCtx) return;
  const osc  = _audioCtx.createOscillator();
  const gain = _audioCtx.createGain();
  osc.connect(gain);
  gain.connect(_audioCtx.destination);
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, _audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + durationSec);
  osc.start(_audioCtx.currentTime);
  osc.stop(_audioCtx.currentTime + durationSec);
}

function alertYellow() { beep(660, 0.18); setTimeout(() => beep(660, 0.18), 280); }
function alertRed()    { beep(440, 0.18); setTimeout(() => beep(440, 0.18), 250); setTimeout(() => beep(440, 0.18), 500); }
