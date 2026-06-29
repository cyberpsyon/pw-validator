// Lazy, subtle Web Audio cues. No-ops until enabled and after a user gesture.
let ctx = null;
let enabled = false;

export function setSoundEnabled(on) { enabled = on; }

function audio() {
  if (!enabled) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export function playTick() {
  const ac = audio(); if (!ac) return;
  const o = ac.createOscillator(); const g = ac.createGain();
  o.type = 'sine'; o.frequency.value = 660;
  g.gain.setValueAtTime(0.0001, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.05, ac.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.18);
  o.connect(g).connect(ac.destination);
  o.start(); o.stop(ac.currentTime + 0.2);
}

export function playReveal() {
  const ac = audio(); if (!ac) return;
  const o = ac.createOscillator(); const g = ac.createGain();
  o.type = 'triangle'; o.frequency.setValueAtTime(220, ac.currentTime);
  o.frequency.exponentialRampToValueAtTime(440, ac.currentTime + 0.25);
  g.gain.setValueAtTime(0.0001, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.04, ac.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.4);
  o.connect(g).connect(ac.destination);
  o.start(); o.stop(ac.currentTime + 0.42);
}
