function isFingerUp(tipIdx, pipIdx, lm) {
  return lm[tipIdx].y < lm[pipIdx].y;
}

function classifyGesture(lm) {
  const indexUp  = isFingerUp(8,  6,  lm);
  const middleUp = isFingerUp(12, 10, lm);
  const ringUp   = isFingerUp(16, 14, lm);
  const pinkyUp  = isFingerUp(20, 18, lm);

  const pinchDist = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);
  if (pinchDist < 0.06) return 'pinch';

  if (indexUp && middleUp && ringUp && pinkyUp) return 'open_palm';
  if (indexUp && middleUp && !ringUp && !pinkyUp) return 'peace';
  if (indexUp && !middleUp && !ringUp && !pinkyUp) return 'point';
  if (!indexUp && !middleUp && !ringUp && !pinkyUp) return 'fist';

  return 'none';
}

const HOLD_MS  = 300;
const BUF_SIZE = 5;
const recent   = [];
let activeGesture    = 'none';
let gestureStartTime = null;
let lastFired        = 'none';

function majorityVote(arr) {
  const counts = {};
  for (const g of arr) counts[g] = (counts[g] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function processGesture(raw) {
  recent.push(raw);
  if (recent.length > BUF_SIZE) recent.shift();
  const smoothed = majorityVote(recent);

  const el = document.getElementById('gesture-label');
  if (el) el.textContent = smoothed === 'none' ? '—' : smoothed.replace('_', ' ');

  const now = Date.now();
  if (smoothed !== activeGesture) {
    activeGesture    = smoothed;
    gestureStartTime = now;
    lastFired        = 'none';
  }

  if (smoothed !== 'none' && (now - gestureStartTime) >= HOLD_MS && lastFired !== smoothed) {
    lastFired = smoothed;
    activateSpell(smoothed);
  }
}

const GESTURE_TO_SPELL = {
  open_palm: 'wind',
  fist:      'earth',
  point:     'lightning',
  pinch:     'ice',
  peace:     'fire',
};

const SPELL_META = {
  wind:      { name: 'Wind',      color: '#00FFFF' },
  earth:     { name: 'Earth',     color: '#C8A050' },
  lightning: { name: 'Lightning', color: '#FFFF00' },
  ice:       { name: 'Ice',       color: '#88CCFF' },
  fire:      { name: 'Fire',      color: '#FF6622' },
};

const SPELLS = {
  wind:      new WindSpell(),
  earth:     new EarthSpell(),
  lightning: new LightningSpell(),
  ice:       new IceSpell(),
  fire:      new FireSpell(),
};

let currentSpellName = null;
let currentSpell     = null;

function activateSpell(gesture) {
  const name = GESTURE_TO_SPELL[gesture];
  if (!name || name === currentSpellName) return;
  currentSpellName = name;
  currentSpell     = SPELLS[name];

  const label = document.getElementById('spell-label');
  if (label) {
    label.textContent = SPELL_META[name].name;
    label.style.color = SPELL_META[name].color;
  }
}

const canvas  = document.getElementById('canvas');
const ctx     = canvas.getContext('2d');
const preview = document.getElementById('preview-canvas');
const pCtx    = preview.getContext('2d');
preview.width  = 160;
preview.height = 120;

let W = canvas.width  = window.innerWidth;
let H = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
});

let currentLandmarks = null;
let palmAnchor = null;
let palmSize   = 80;

function lmToCanvas(lm, idx) {
  return { x: (1 - lm[idx].x) * W, y: lm[idx].y * H };
}

function updatePalm(lm) {
  // wrist + base of each finger
  const ids = [0, 5, 9, 13, 17];
  let sx = 0, sy = 0;
  for (const i of ids) { sx += lm[i].x; sy += lm[i].y; }
  palmAnchor = { x: (1 - sx / 5) * W, y: (sy / 5) * H };
  palmSize = Math.max(40, Math.hypot(
    (lm[0].x - lm[9].x) * W,
    (lm[0].y - lm[9].y) * H
  ));
}

const video = document.createElement('video');
video.autoplay = video.playsInline = true;
video.style.display = 'none';
document.body.appendChild(video);

const hands = new Hands({
  locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${f}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.72,
  minTrackingConfidence:  0.55,
});

hands.onResults(results => {
  pCtx.clearRect(0, 0, 160, 120);
  pCtx.drawImage(results.image, 0, 0, 160, 120);

  if (results.multiHandLandmarks?.length > 0) {
    currentLandmarks = results.multiHandLandmarks[0];
    updatePalm(currentLandmarks);
    processGesture(classifyGesture(currentLandmarks));
    drawConnectors(pCtx, currentLandmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 1 });
    drawLandmarks(pCtx, currentLandmarks, { color: '#FF0000', radius: 2 });
  } else {
    currentLandmarks = null;
    palmAnchor       = null;
    processGesture('none');
  }
});

const cam = new Camera(video, {
  onFrame: async () => await hands.send({ image: video }),
  width: 640, height: 480,
});

cam.start().catch(err => {
  const el = document.getElementById('gesture-label');
  if (el) el.textContent = 'camera error';
  console.error(err);
});

let lastTs = 0;

function render(ts) {
  // cap dt so a tab switch doesn't produce a huge jump
  const dt = Math.min((ts - lastTs) / 1000, 0.05);
  lastTs = ts;

  ctx.clearRect(0, 0, W, H);

  if (video.readyState >= 2) {
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -W, 0, W, H);
    ctx.restore();
  }

  if (palmAnchor) {
    let ax = palmAnchor.x, ay = palmAnchor.y;

    // lightning tracks the index tip rather than palm center
    if (currentSpellName === 'lightning' && currentLandmarks) {
      ({ x: ax, y: ay } = lmToCanvas(currentLandmarks, 8));
    }

    if (currentSpell) {
      currentSpell.update(dt, ax, ay, palmSize);
      currentSpell.draw(ctx, ax, ay, palmSize);
    } else {
      const pulse = 1 + 0.2 * Math.sin(ts / 420);
      ctx.save();
      ctx.shadowColor = '#AAAAFF';
      ctx.shadowBlur  = 22 * pulse;
      const g = ctx.createRadialGradient(
        palmAnchor.x, palmAnchor.y, 0,
        palmAnchor.x, palmAnchor.y, palmSize * 0.42 * pulse
      );
      g.addColorStop(0, 'rgba(200,200,255,0.7)');
      g.addColorStop(1, 'rgba(100,100,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(palmAnchor.x, palmAnchor.y, palmSize * 0.42 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
