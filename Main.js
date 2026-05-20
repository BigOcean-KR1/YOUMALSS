(function(){
  const c=document.getElementById('dots-canvas');
  if(!c)return;
  const ctx=c.getContext('2d');
  let W,H,pts=[];

  function resize(){
    W=c.width=window.innerWidth;
    H=c.height=window.innerHeight;
  }
  resize(); window.addEventListener('resize',resize);

  class P{
    constructor(init){
      this.x=Math.random()*W;
      this.y=init?Math.random()*H:H+10;
      this.r=Math.random()*1.5+.3;
      this.vy=-(Math.random()*.3+.06);
      this.vx=(Math.random()-.5)*.12;
      this.a=Math.random()*.45+.04;
    }
    tick(){ this.x+=this.vx; this.y+=this.vy; if(this.y<-8)Object.assign(this,new P(false)); }
    draw(){
      ctx.beginPath();
      ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(134,239,172,${this.a})`;
      ctx.fill();
    }
  }

  for(let i=0;i<70;i++) pts.push(new P(true));

  function loop(){
    ctx.clearRect(0,0,W,H);
    pts.forEach(p=>{p.tick();p.draw();});
    requestAnimationFrame(loop);
  }
  loop();
})();
const TOTAL = 12;
let cur = 1;

function goTo(n, dir) {
  if (n < 1 || n > TOTAL) return;
  const prev = document.getElementById(`s${cur}`);
  const next = document.getElementById(`s${n}`);
  prev.classList.remove('active');
  prev.classList.add(dir > 0 ? 'exit-l' : 'exit-r');
  setTimeout(() => prev.classList.remove('exit-l','exit-r'), 560);
  next.classList.add('active');
  cur = n;
  updateNav();
}
function next() { goTo(cur+1, 1); }
function prev() { goTo(cur-1,-1); }

function updateNav() {
  document.querySelectorAll('.nb-dot').forEach((d,i) => d.classList.toggle('on', i+1===cur));
}

// Build dots
const dotsEl = document.getElementById('nb-dots');
for (let i=1;i<=TOTAL;i++) {
  const d = document.createElement('div');
  d.className = 'nb-dot'+(i===1?' on':'');
  d.onclick = () => goTo(i, i>cur?1:-1);
  dotsEl.appendChild(d);
}
document.getElementById('s1').classList.add('active');

// Keyboard
document.addEventListener('keydown', e => {
  if (e.key==='ArrowRight'||e.key==='ArrowDown') next();
  if (e.key==='ArrowLeft' ||e.key==='ArrowUp')   prev();
});

// Swipe
let tx=0;
document.addEventListener('touchstart', e=>tx=e.touches[0].clientX);
document.addEventListener('touchend',   e=>{ const dx=e.changedTouches[0].clientX-tx; if(Math.abs(dx)>50) dx<0?next():prev(); });

window.next=next; window.prev=prev;
const CFG = {
  MODEL_URL: null,
  CLASSES: [
    {name:'플라스틱',emoji:'🧴'},{name:'캔',emoji:'🥫'},
    {name:'종이',emoji:'📄'},{name:'유리',emoji:'🍶'},
    {name:'스티로폼',emoji:'📦'},{name:'비닐',emoji:'🛍️'},
  ],
  MS: 500,
};
let stream=null,model=null,intv=null,running=false;
const $=id=>document.getElementById(id);

function initBars(){
  const el=$('dr-bars'); if(!el)return; el.innerHTML='';
  CFG.CLASSES.forEach(c=>{
    el.innerHTML+=`<div class="bar-item">
      <span class="bar-lbl">${c.emoji} ${c.name}</span>
      <div class="bar-trk"><div class="bar-fill" id="bf-${c.name}" style="width:0%"></div></div>
      <span class="bar-pct" id="bp-${c.name}">0%</span>
    </div>`;
  });
}
initBars();

async function startCamera(){
  try {
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
    const v=$('webcam'); v.srcObject=stream; v.style.display='block';
    $('cam-idle').style.display='none';
    $('btn-start').style.display='none';
    $('btn-stop').style.display='flex';
    $('cf-scan').classList.add('on');
    $('dr-status').textContent='● LIVE'; $('dr-status').classList.add('on');
    running=true;
    await loadModel();
    intv=setInterval(predict,CFG.MS);
  } catch { alert('카메라 접근 권한이 필요합니다.'); }
}

function stopCamera(){
  if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}
  clearInterval(intv);
  const v=$('webcam'); v.style.display='none'; v.srcObject=null;
  $('cam-idle').style.display='flex';
  $('btn-start').style.display='flex';
  $('btn-stop').style.display='none';
  $('cf-scan').classList.remove('on');
  $('dr-status').textContent='READY'; $('dr-status').classList.remove('on');
  running=false; reset();
}

async function loadModel(){
  if(!CFG.MODEL_URL){setStatus('demo','데모 모드 (랜덤 시뮬레이션)');return;}
  try{
    setStatus('load','모델 로딩 중...');
    model=await window.tmImage.load(CFG.MODEL_URL+'model.json',CFG.MODEL_URL+'metadata.json');
    setStatus('ok','모델 로드 완료 ✓');
  }catch{setStatus('demo','데모 모드 (모델 연동 전)');}
}

let tick=0;
async function predict(){
  if(!running)return;
  let ps;
  if(model){
    const r=await model.predict($('webcam'));
    ps=r.map((p,i)=>({name:p.className,probability:p.probability,emoji:CFG.CLASSES[i]?.emoji||'❓'}));
  } else {
    tick++;
    const w=Math.floor(tick/6)%CFG.CLASSES.length;
    ps=CFG.CLASSES.map((c,i)=>({name:c.name,emoji:c.emoji,probability:i===w?0.7+Math.random()*.25:0.04+Math.random()*.08}));
  }
  const best=ps.reduce((a,b)=>a.probability>b.probability?a:b);
  const em=$('dr-emoji'); em.classList.remove('pop'); void em.offsetWidth; em.classList.add('pop');
  em.textContent=best.emoji;
  $('dr-label').textContent=best.name;
  $('dr-conf').textContent=`신뢰도: ${(best.probability*100).toFixed(1)}%`;
  ps.forEach(p=>{
    const f=$(`bf-${p.name}`),c=$(`bp-${p.name}`);
    if(f)f.style.width=(p.probability*100).toFixed(1)+'%';
    if(c)c.textContent=(p.probability*100).toFixed(0)+'%';
  });
}

function reset(){
  $('dr-emoji').textContent='❓'; $('dr-label').textContent='대기 중';
  $('dr-conf').textContent='카메라를 시작하면 분류가 시작됩니다';
  CFG.CLASSES.forEach(c=>{
    const f=$(`bf-${c.name}`),p=$(`bp-${c.name}`);
    if(f)f.style.width='0%'; if(p)p.textContent='0%';
  });
}
function setStatus(t,msg){ $('dm-text').textContent=msg; $('dm-dot').className='dm-dot'+(t==='ok'?' ok':''); }

window.startCamera=startCamera; window.stopCamera=stopCamera;
