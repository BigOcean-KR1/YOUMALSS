// ===== 티처블 머신 분류기 =====
// MODEL_URL 만 바꾸면 연동 완료!

const CONFIG = {
  MODEL_URL: null, // "https://teachablemachine.withgoogle.com/models/xxxxx/"
  CLASSES: [
    { name: '플라스틱', emoji: '🧴' },
    { name: '캔',       emoji: '🥫' },
    { name: '종이',     emoji: '📄' },
    { name: '유리',     emoji: '🍶' },
    { name: '스티로폼', emoji: '📦' },
    { name: '비닐',     emoji: '🛍️' },
  ],
  INTERVAL_MS: 500,
};

let stream = null, model = null, intervalId = null, isRunning = false;

const $ = id => document.getElementById(id);

function initBars() {
  const el = $('res-bars');
  if (!el) return;
  el.innerHTML = '';
  CONFIG.CLASSES.forEach(c => {
    el.innerHTML += `
      <div class="bar-item">
        <span class="bar-label">${c.emoji} ${c.name}</span>
        <div class="bar-track"><div class="bar-fill" id="bar-${c.name}"></div></div>
        <span class="bar-pct" id="pct-${c.name}">0%</span>
      </div>`;
  });
}
initBars();

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    const vid = $('webcam');
    vid.srcObject = stream;
    vid.style.display = 'block';
    $('cam-overlay').style.display = 'none';
    $('btn-start').style.display = 'none';
    $('btn-stop').style.display = 'flex';
    $('scan-line').classList.add('active');
    $('live-badge').textContent = '● LIVE';
    $('live-badge').classList.add('active');
    isRunning = true;
    await loadModel();
    intervalId = setInterval(predict, CONFIG.INTERVAL_MS);
  } catch { alert('카메라 접근 권한이 필요합니다.'); }
}

function stopCamera() {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  clearInterval(intervalId);
  const vid = $('webcam');
  vid.style.display = 'none'; vid.srcObject = null;
  $('cam-overlay').style.display = 'flex';
  $('btn-start').style.display = 'flex';
  $('btn-stop').style.display = 'none';
  $('scan-line').classList.remove('active');
  $('live-badge').textContent = 'READY';
  $('live-badge').classList.remove('active');
  isRunning = false;
  reset();
}

async function loadModel() {
  if (!CONFIG.MODEL_URL) { setStatus('demo', '데모 모드 (랜덤 시뮬레이션)'); return; }
  try {
    setStatus('loading', '모델 로딩 중...');
    model = await window.tmImage.load(CONFIG.MODEL_URL + 'model.json', CONFIG.MODEL_URL + 'metadata.json');
    setStatus('ready', '모델 로드 완료 ✓');
  } catch { setStatus('demo', '데모 모드 (모델 연동 전)'); }
}

let tick = 0;
async function predict() {
  if (!isRunning) return;
  let preds;
  if (model) {
    const raw = await model.predict($('webcam'));
    preds = raw.map((p, i) => ({ name: p.className, probability: p.probability, emoji: CONFIG.CLASSES[i]?.emoji || '❓' }));
  } else {
    tick++;
    const w = Math.floor(tick / 6) % CONFIG.CLASSES.length;
    preds = CONFIG.CLASSES.map((c, i) => ({ name: c.name, emoji: c.emoji, probability: i === w ? 0.7 + Math.random() * 0.25 : 0.04 + Math.random() * 0.08 }));
  }
  const best = preds.reduce((a, b) => a.probability > b.probability ? a : b);
  const emo = $('res-emoji');
  emo.classList.remove('pop'); void emo.offsetWidth; emo.classList.add('pop');
  emo.textContent = best.emoji;
  $('res-label').textContent = best.name;
  $('res-conf').textContent  = `신뢰도: ${(best.probability * 100).toFixed(1)}%`;
  preds.forEach(p => {
    const f = $(`bar-${p.name}`), c = $(`pct-${p.name}`);
    if (f) f.style.width = (p.probability * 100).toFixed(1) + '%';
    if (c) c.textContent  = (p.probability * 100).toFixed(0) + '%';
  });
}

function reset() {
  $('res-emoji').textContent = '❓';
  $('res-label').textContent = '대기 중';
  $('res-conf').textContent  = '카메라를 시작하면 분류가 시작됩니다';
  CONFIG.CLASSES.forEach(c => {
    const f = $(`bar-${c.name}`), p = $(`pct-${c.name}`);
    if (f) f.style.width = '0%';
    if (p) p.textContent = '0%';
  });
}

function setStatus(type, msg) {
  $('st-text').textContent = msg;
  $('st-dot').className = 'st-dot' + (type === 'ready' ? ' ready' : '');
}

window.startCamera = startCamera;
window.stopCamera  = stopCamera;
