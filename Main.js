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
