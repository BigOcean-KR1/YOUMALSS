// ===== AI 쓰레기 분류기 =====
// 티처블 머신 연동 준비된 구조
// 나중에 MODEL_URL 만 바꾸면 됩니다!

// ──────────────────────────────────────
// 1. 설정 (나중에 여기만 수정)
// ──────────────────────────────────────
const CONFIG = {
  // 티처블 머신 모델 URL - 나중에 여기에 붙여넣기!
  MODEL_URL: null,  // 예: "https://teachablemachine.withgoogle.com/models/xxxxxxxx/"

  // 분류 항목 (티처블 머신 클래스 이름과 동일하게 맞추세요)
  CLASSES: [
    { name: '플라스틱', emoji: '🧴', color: '#74c69d' },
    { name: '캔',       emoji: '🥫', color: '#52b788' },
    { name: '종이',     emoji: '📄', color: '#40916c' },
    { name: '유리',     emoji: '🍶', color: '#2d6a4f' },
    { name: '스티로폼', emoji: '📦', color: '#95d5b2' },
    { name: '비닐',     emoji: '🛍️', color: '#b7e4c7' },
  ],

  INTERVAL_MS: 500,  // 예측 주기 (ms)
};

// ──────────────────────────────────────
// 2. 상태
// ──────────────────────────────────────
let stream     = null;
let model      = null;
let intervalId = null;
let isRunning  = false;

// ──────────────────────────────────────
// 3. DOM 요소
// ──────────────────────────────────────
const webcamEl      = document.getElementById('webcam');
const camOverlay    = document.getElementById('cam-overlay');
const btnStart      = document.getElementById('btn-start');
const btnStop       = document.getElementById('btn-stop');
const scanLine      = document.getElementById('scan-line');
const liveBadge     = document.getElementById('live-badge');
const resultEmoji   = document.getElementById('result-emoji');
const resultLabel   = document.getElementById('result-label');
const resultConf    = document.getElementById('result-confidence');
const resultBars    = document.getElementById('result-bars');
const statusDot     = document.getElementById('status-dot');
const statusText    = document.getElementById('status-text');
const resultPanel   = document.querySelector('.result-panel');

// ──────────────────────────────────────
// 4. 바 차트 초기화
// ──────────────────────────────────────
function initBars() {
  resultBars.innerHTML = '';
  CONFIG.CLASSES.forEach(cls => {
    const div = document.createElement('div');
    div.className = 'bar-item';
    div.innerHTML = `
      <span class="bar-label">${cls.emoji} ${cls.name}</span>
      <div class="bar-track"><div class="bar-fill" id="bar-${cls.name}" style="width:0%"></div></div>
      <span class="bar-pct" id="pct-${cls.name}">0%</span>
    `;
    resultBars.appendChild(div);
  });
}
initBars();

// ──────────────────────────────────────
// 5. 카메라 시작
// ──────────────────────────────────────
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    webcamEl.srcObject = stream;
    webcamEl.style.display = 'block';
    camOverlay.style.display = 'none';
    btnStart.style.display = 'none';
    btnStop.style.display = 'flex';
    scanLine.classList.add('active');
    liveBadge.textContent = '● LIVE';
    liveBadge.classList.add('active');
    isRunning = true;

    // 모델 로드 시도
    await loadModel();

    // 예측 시작
    intervalId = setInterval(predict, CONFIG.INTERVAL_MS);

  } catch (err) {
    alert('카메라 접근 권한이 필요합니다.\n브라우저 설정에서 카메라를 허용해주세요.');
    console.error(err);
  }
}

// ──────────────────────────────────────
// 6. 카메라 정지
// ──────────────────────────────────────
function stopCamera() {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  clearInterval(intervalId);
  webcamEl.style.display = 'none';
  webcamEl.srcObject = null;
  camOverlay.style.display = 'flex';
  btnStart.style.display = 'flex';
  btnStop.style.display = 'none';
  scanLine.classList.remove('active');
  liveBadge.textContent = '● READY';
  liveBadge.classList.remove('active');
  isRunning = false;
  resetResult();
}

// ──────────────────────────────────────
// 7. 모델 로드
// ──────────────────────────────────────
async function loadModel() {
  if (!CONFIG.MODEL_URL) {
    // 데모 모드 (모델 없이 랜덤 시뮬레이션)
    setStatus('demo', '데모 모드 (모델 미연동 - 랜덤 시뮬레이션)');
    return;
  }

  try {
    setStatus('loading', '모델 로딩 중...');
    // tmImage 는 티처블 머신 라이브러리 (index.html에 스크립트 추가 필요)
    const modelURL    = CONFIG.MODEL_URL + 'model.json';
    const metadataURL = CONFIG.MODEL_URL + 'metadata.json';
    model = await window.tmImage.load(modelURL, metadataURL);
    setStatus('ready', '모델 로드 완료 ✓');
  } catch (err) {
    console.warn('모델 로드 실패, 데모 모드로 전환:', err);
    setStatus('demo', '데모 모드 (모델 연동 전)');
  }
}

// ──────────────────────────────────────
// 8. 예측
// ──────────────────────────────────────
async function predict() {
  if (!isRunning) return;

  let predictions;

  if (model) {
    // 실제 티처블 머신 예측
    predictions = await model.predict(webcamEl);
    predictions = predictions.map((p, i) => ({
      name:        p.className,
      probability: p.probability,
      emoji:       CONFIG.CLASSES[i]?.emoji || '❓',
    }));
  } else {
    // 데모: 랜덤 시뮬레이션
    predictions = simulatePrediction();
  }

  updateResult(predictions);
}

// ──────────────────────────────────────
// 9. 결과 UI 업데이트
// ──────────────────────────────────────
function updateResult(predictions) {
  // 최고 확률 항목
  const best = predictions.reduce((a, b) => a.probability > b.probability ? a : b);

  // 이모지 팝 애니메이션
  resultEmoji.classList.remove('pop');
  void resultEmoji.offsetWidth;
  resultEmoji.classList.add('pop');

  resultEmoji.textContent = best.emoji;
  resultLabel.textContent = best.name;
  resultConf.textContent  = `신뢰도: ${(best.probability * 100).toFixed(1)}%`;

  // 패널 플래시
  resultPanel.classList.remove('flash');
  void resultPanel.offsetWidth;
  resultPanel.classList.add('flash');

  // 바 업데이트
  predictions.forEach(p => {
    const fill = document.getElementById(`bar-${p.name}`);
    const pct  = document.getElementById(`pct-${p.name}`);
    if (fill) fill.style.width = (p.probability * 100).toFixed(1) + '%';
    if (pct)  pct.textContent  = (p.probability * 100).toFixed(0) + '%';
  });
}

// ──────────────────────────────────────
// 10. 데모 시뮬레이션
// ──────────────────────────────────────
let demoTick = 0;
function simulatePrediction() {
  demoTick++;
  const winnerIdx = Math.floor(demoTick / 6) % CONFIG.CLASSES.length;
  return CONFIG.CLASSES.map((cls, i) => {
    let prob = 0.05 + Math.random() * 0.08;
    if (i === winnerIdx) prob = 0.65 + Math.random() * 0.25;
    return { name: cls.name, probability: prob, emoji: cls.emoji };
  });
}

// ──────────────────────────────────────
// 11. 결과 초기화
// ──────────────────────────────────────
function resetResult() {
  resultEmoji.textContent = '❓';
  resultLabel.textContent = '대기 중';
  resultConf.textContent  = '카메라를 시작하면 분류가 시작됩니다';
  CONFIG.CLASSES.forEach(cls => {
    const fill = document.getElementById(`bar-${cls.name}`);
    const pct  = document.getElementById(`pct-${cls.name}`);
    if (fill) fill.style.width = '0%';
    if (pct)  pct.textContent  = '0%';
  });
}

// ──────────────────────────────────────
// 12. 상태 표시
// ──────────────────────────────────────
function setStatus(type, msg) {
  statusText.textContent = msg;
  statusDot.className = 'status-dot';
  if (type === 'ready') statusDot.classList.add('ready');
  if (type === 'error') statusDot.classList.add('error');
}

// ──────────────────────────────────────
// 전역 노출 (HTML onclick용)
// ──────────────────────────────────────
window.startCamera = startCamera;
window.stopCamera  = stopCamera;
