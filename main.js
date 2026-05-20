/* ===== PARTICLES ===== */
(function(){
  const c=document.getElementById('dots-canvas');
  if(!c)return;
  const ctx=c.getContext('2d');
  let W,H,pts=[];
  function resize(){ W=c.width=window.innerWidth; H=c.height=window.innerHeight; }
  resize(); window.addEventListener('resize',resize);
  class P{
    constructor(init){
      this.x=Math.random()*W; this.y=init?Math.random()*H:H+10;
      this.r=Math.random()*1.5+.3; this.vy=-(Math.random()*.3+.06);
      this.vx=(Math.random()-.5)*.12; this.a=Math.random()*.45+.04;
    }
    tick(){ this.x+=this.vx; this.y+=this.vy; if(this.y<-8)Object.assign(this,new P(false)); }
    draw(){ ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fillStyle=`rgba(134,239,172,${this.a})`; ctx.fill(); }
  }
  for(let i=0;i<70;i++) pts.push(new P(true));
  function loop(){ ctx.clearRect(0,0,W,H); pts.forEach(p=>{p.tick();p.draw();}); requestAnimationFrame(loop); }
  loop();
})();

/* ===== SLIDES + ANIMATIONS ===== */
(function(){
  const TOTAL=12;
  let cur=1;

  /* ── 슬라이드 이동 ── */
  function goTo(n,dir){
    if(n<1||n>TOTAL)return;
    const prev=document.getElementById(`s${cur}`);
    const next=document.getElementById(`s${n}`);
    prev.classList.remove('active');
    prev.classList.add(dir>0?'exit-l':'exit-r');
    setTimeout(()=>prev.classList.remove('exit-l','exit-r'),560);
    next.classList.add('active');
    cur=n;
    updateNav();
    if(n===5) setTimeout(runStatAnim, 350);
    if(n===6){
      s6Step=-1; s6Phase=0; s6Active=true;
      setTimeout(()=>{
        document.querySelectorAll('.s6-step-item').forEach((el,i)=>{
          el.onclick=()=>{ s6Phase=1; s6GoTo(i); };
        });
        s6GoTo(-1);
      }, 300);
    }
    if(n!==6) s6Active=false;
    if(n===7) setTimeout(runGridAnim, 200);
    if(n===8) setTimeout(runDataAnim, 350);
  }
  function next(){ goTo(cur+1,1); }
  function prev(){ goTo(cur-1,-1); }
  function updateNav(){
    document.querySelectorAll('.nb-dot').forEach((d,i)=>d.classList.toggle('on',i+1===cur));
  }
  const dotsEl=document.getElementById('nb-dots');
  for(let i=1;i<=TOTAL;i++){
    const d=document.createElement('div');
    d.className='nb-dot'+(i===1?' on':'');
    d.onclick=()=>goTo(i,i>cur?1:-1);
    dotsEl.appendChild(d);
  }
  document.getElementById('s1').classList.add('active');
  document.addEventListener('keydown',e=>{
    if(cur===6){
      if(e.key==='ArrowRight'||e.key==='ArrowDown'){ e.preventDefault(); s6Next(); return; }
      if(e.key==='ArrowLeft' ||e.key==='ArrowUp')  { e.preventDefault(); s6Prev(); return; }
    }
    if(e.key==='ArrowRight'||e.key==='ArrowDown') next();
    if(e.key==='ArrowLeft' ||e.key==='ArrowUp')   prev();
  });
  let tx=0;
  document.addEventListener('touchstart',e=>tx=e.touches[0].clientX);
  document.addEventListener('touchend',e=>{ const dx=e.changedTouches[0].clientX-tx; if(Math.abs(dx)>50) dx<0?next():prev(); });
  window.next=next; window.prev=prev;

  /* ── 슬라이드 5: 선별률 카운트업 ── */
  function runStatAnim(){
    const numEl=document.getElementById('stat-num');
    const fillEl=document.getElementById('stat-bar');
    if(!numEl||!fillEl)return;
    fillEl.style.transition='none'; fillEl.style.width='0%';
    numEl.textContent='0';
    const target=62.5, duration=1800, start=performance.now();
    function tick(now){
      const p=Math.min((now-start)/duration,1);
      const ease=1-Math.pow(1-p,3);
      const val=target*ease;
      numEl.textContent=val.toFixed(1);
      fillEl.style.width=val+'%';
      if(p<1) requestAnimationFrame(tick);
      else{ numEl.textContent='62.5'; fillEl.style.width='62.5%'; }
    }
    requestAnimationFrame(tick);
  }

  /* ── 슬라이드 6: 사진 줌인 + 단계 클릭/키보드 ── */
  const ZOOM = [
    { ox:'50%', oy:'50%', scale:1   },  // 전체샷
    { ox:'92%', oy:'60%', scale:2.2 },  // ① 쓰레기 투입
    { ox:'78%', oy:'55%', scale:2.4 },  // ② 적층 방지
    { ox:'52%', oy:'8%',  scale:2.8 },  // ③ 카메라 인식
    { ox:'20%', oy:'78%', scale:2.2 },  // ④ 자동 분류
    { ox:'68%', oy:'80%', scale:2.6 },  // ⑤ 재순환
  ];
  const S6_LABELS = ['전체 시스템 구조','① 쓰레기 투입','② 적층 방지','③ 카메라 인식','④ 자동 분류','⑤ 재순환'];

  // phase: 0=첫전체샷 1=단계진행 2=두번째전체샷
  let s6Step = -1;
  let s6Phase = 0;
  let s6Active = false;

  // 각 단계별 translate(x,y) + scale
  // 컨테이너 기준으로 이미지를 이동시켜서 pan+zoom 효과
  // translate 방식 - 하나의 사진에서 카메라 이동처럼 부드럽게
  const CAM = [
    { tx:   0.0, ty:   0.0, s: 1.0 },  // 전체샷
    { tx: -22.9, ty:  -5.5, s: 2.2 },  // ① 쓰레기 투입
    { tx: -16.3, ty:  -2.9, s: 2.4 },  // ② 적층 방지
    { tx:  -1.2, ty:  25.8, s: 2.6 },  // ③ 카메라 인식
    { tx:  16.4, ty: -15.3, s: 2.2 },  // ④ 자동 분류
    { tx: -11.6, ty: -19.3, s: 2.8 },  // ⑤ 재순환
  ];

  function s6GoTo(n){
    s6Step = n;
    const items = document.querySelectorAll('.s6-step-item');
    const img   = document.getElementById('s6-img');
    const title = document.getElementById('s6-subtitle');
    if(!img) return;

    items.forEach((el,i) => el.classList.toggle('active', i===n));

    const idx = n === -1 ? 0 : n+1;
    const c = CAM[idx];

    // transform-origin 고정, translate+scale만 변경 → 완전히 부드러운 이동
    img.style.transformOrigin = 'center center';
    img.style.transition = 'transform .9s cubic-bezier(.25,.46,.45,.94)';
    img.style.transform = `scale(${c.s}) translate(${c.tx}%, ${c.ty}%)`;

    if(title){
      title.style.opacity = '0';
      setTimeout(()=>{
        title.textContent = n === -1 ? S6_LABELS[0] : S6_LABELS[n+1];
        title.style.opacity = '1';
      }, 200);
    }
  }

  function s6Next(){
    if(s6Phase === 0){
      // 첫 전체샷 → ① 시작
      s6Phase = 1;
      s6GoTo(0);
    } else if(s6Phase === 1 && s6Step < 4){
      // 단계 진행
      s6GoTo(s6Step + 1);
    } else if(s6Phase === 1 && s6Step === 4){
      // ⑤ 끝 → 두번째 전체샷
      s6Phase = 2;
      s6GoTo(-1);
    } else if(s6Phase === 2){
      // 두번째 전체샷 → 다음 슬라이드
      goTo(7, 1);
    }
  }

  function s6Prev(){
    if(s6Phase === 2){
      // 두번째 전체샷에서 뒤로 → ⑤
      s6Phase = 1;
      s6GoTo(4);
    } else if(s6Phase === 1 && s6Step > 0){
      s6GoTo(s6Step - 1);
    } else if(s6Phase === 1 && s6Step === 0){
      // ① 에서 뒤로 → 첫 전체샷
      s6Phase = 0;
      s6GoTo(-1);
    } else {
      goTo(5, -1);
    }
  }

  /* ── 슬라이드 6: 플로우 순차 등장 ── */
  // 각 단계별 사진 줌 위치 (originX%, originY%, scale)
  const ZOOM_STEPS = [
    { ox: '92%', oy: '60%', scale: 2.2 },  // ① 쓰레기 투입 - 오른쪽 프레임
    { ox: '78%', oy: '55%', scale: 2.4 },  // ② 적층 방지 - 파란 커튼
    { ox: '52%', oy: '8%',  scale: 2.6 },  // ③ 카메라 인식 - 상단 카메라
    { ox: '20%', oy: '78%', scale: 2.2 },  // ④ 자동 분류 - 2번 컨베이어
    { ox: '68%', oy: '80%', scale: 2.8 },  // ⑤ 재순환 - 검은 박스
  ];

  function runFlowHighlight(){
    const steps = document.querySelectorAll('#s6 .flow-step');
    const img   = document.querySelector('.system-img-top');
    if(!steps.length || !img) return;
    let i = 0;
    function highlightNext(){
      // 카드 하이라이트
      steps.forEach(s => s.classList.remove('highlight'));
      if(i < steps.length){
        steps[i].classList.add('highlight');
        // 사진 줌인
        const z = ZOOM_STEPS[i];
        img.style.transition = 'transform .6s ease';
        img.style.transformOrigin = z.ox + ' ' + z.oy;
        img.style.transform = `scale(${z.scale})`;
        i++;
        setTimeout(highlightNext, 1600);
      } else {
        // 초기화 후 반복
        img.style.transform = 'scale(1)';
        img.style.transformOrigin = 'center center';
        steps.forEach(s => s.classList.remove('highlight'));
        i = 0;
        setTimeout(highlightNext, 1000);
      }
    }
    highlightNext();
  }

  /* ── 슬라이드 6: 플로우 순차 등장 ── */
  function runFlowHighlight(){
    const steps = document.querySelectorAll('#s6 .flow-step');
    if(!steps.length) return;
    let i = 0;
    function highlightNext(){
      steps.forEach(s => s.classList.remove('highlight'));
      if(i < steps.length){
        steps[i].classList.add('highlight');
        // 스크롤 없이 해당 카드로 부드럽게 포커스
        steps[i].scrollIntoView({behavior:'smooth', block:'nearest', inline:'center'});
        i++;
        setTimeout(highlightNext, 1200);
      } else {
        // 전체 순환 후 다시 반복
        i = 0;
        setTimeout(highlightNext, 800);
      }
    }
    highlightNext();
  }

  /* ── 슬라이드 6: 플로우 순차 등장 ── */
  function runFlowAnim(){
    const steps=document.querySelectorAll('#s6 .flow-step');
    const arrows=document.querySelectorAll('#s6 .flow-arr');
    const note=document.querySelector('#s6 .flow-note');
    steps.forEach(el=>{ el.style.opacity='0'; el.style.transform='translateY(24px)'; el.style.transition='none'; });
    arrows.forEach(el=>{ el.style.opacity='0'; el.style.transition='none'; });
    if(note){ note.style.opacity='0'; note.style.transition='none'; }
    steps.forEach((el,i)=>{
      setTimeout(()=>{
        el.style.transition='opacity .4s ease, transform .4s ease';
        el.style.opacity='1'; el.style.transform='translateY(0)';
      }, i*150);
    });
    arrows.forEach((el,i)=>{
      setTimeout(()=>{ el.style.transition='opacity .3s ease'; el.style.opacity='1'; }, i*150+100);
    });
    if(note){ setTimeout(()=>{ note.style.transition='opacity .4s ease'; note.style.opacity='1'; }, steps.length*150+100); }
  }

  /* ── 슬라이드 7: 카드 순차 등장 + 글로우 ── */
  function runGridAnim(){
    const cards=document.querySelectorAll('#s7 .sg-card');
    cards.forEach(el=>{ el.style.opacity='0'; el.style.transform='translateY(24px) scale(.95)'; el.style.transition='none'; el.classList.remove('glow'); });
    cards.forEach((el,i)=>{
      setTimeout(()=>{
        el.style.transition='opacity .4s ease, transform .4s ease';
        el.style.opacity='1'; el.style.transform='translateY(0) scale(1)';
        setTimeout(()=>el.classList.add('glow'), 300);
      }, i*120);
    });
  }

  /* ── 슬라이드 8: 숫자 카운트업 ── */
  function runDataAnim(){
    const el40=document.getElementById('num-40');
    const el23=document.getElementById('num-23');
    if(!el40||!el23)return;
    el40.textContent='0'; el23.textContent='0';
    function countUp(el,target,duration,delay){
      setTimeout(()=>{
        const start=performance.now();
        function tick(now){
          const p=Math.min((now-start)/duration,1);
          const ease=1-Math.pow(1-p,3);
          el.textContent=Math.floor(target*ease);
          if(p<1) requestAnimationFrame(tick);
          else el.textContent=target;
        }
        requestAnimationFrame(tick);
      }, delay);
    }
    countUp(el40,40,1600,0);
    countUp(el23,23,1600,250);
  }

})();

/* ===== CLASSIFIER ===== */
(function(){
  const CFG={
    MODEL_URL:'https://teachablemachine.withgoogle.com/models/ChPvPgdOk/',
    CLASSES:[
      {name:'Cardboard',emoji:'📦'},{name:'Glass',emoji:'🍶'},
      {name:'Metal',emoji:'🥫'},{name:'Paper',emoji:'📄'},
      {name:'Plastic',emoji:'🧴'},{name:'Trash',emoji:'🗑️'},
    ],
    MS:500,
  };
  let stream=null,model=null,intv=null,running=false;
  const $=id=>document.getElementById(id);

  function initBars(){
    const el=$('dr-bars'); if(!el)return; el.innerHTML='';
    CFG.CLASSES.forEach((c,i)=>{
      el.innerHTML+=`<div class="bar-item">
        <span class="bar-lbl">${c.emoji} ${c.name}</span>
        <div class="bar-trk"><div class="bar-fill" id="bf-${i}" style="width:0%"></div></div>
        <span class="bar-pct" id="bp-${i}">0%</span>
      </div>`;
    });
  }
  initBars();

  let frozen = false;

  async function captureFrame(){
    const btn = document.getElementById('btn-capture');
    if(!frozen){
      frozen = true;
      clearInterval(intv);
      // running 무시하고 강제 예측
      await predictForce();
      btn.textContent = '▶ 재개';
      btn.classList.add('frozen');
      document.getElementById('cf-scan').classList.remove('on');
    } else {
      frozen = false;
      intv = setInterval(predict, CFG.MS);
      btn.textContent = '📸 캡처 분류';
      btn.classList.remove('frozen');
      document.getElementById('cf-scan').classList.add('on');
    }
  }

  async function predictForce(){
    const vid = $('webcam');
    let ps;
    if(model){
      const r = await model.predict(vid);
      ps = r.map((p,i)=>({name:p.className, probability:p.probability, emoji:CFG.CLASSES[i]?.emoji||'❓'}));
    } else {
      const w = Math.floor(Math.random() * CFG.CLASSES.length);
      ps = CFG.CLASSES.map((c,i)=>({name:c.name, emoji:c.emoji, probability:i===w?0.7+Math.random()*.25:0.04+Math.random()*.08}));
    }
    const best = ps.reduce((a,b)=>a.probability>b.probability?a:b);
    const em = $('dr-emoji'); em.classList.remove('pop'); void em.offsetWidth; em.classList.add('pop');
    em.textContent = best.emoji;
    $('dr-label').textContent = best.name;
    $('dr-conf').textContent = `신뢰도: ${(best.probability*100).toFixed(1)}%`;
    ps.forEach((p,i)=>{
      const f=$(`bf-${i}`), c=$(`bp-${i}`);
      if(f) f.style.width=(p.probability*100).toFixed(1)+'%';
      if(c) c.textContent=(p.probability*100).toFixed(0)+'%';
    });
  }

  async function startCamera(){
    try{
      stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
      const v=$('webcam'); v.srcObject=stream; v.style.display='block';
      $('cam-idle').style.display='none';
      $('btn-start').style.display='none';
      $('btn-capture').style.display='flex';
      $('btn-stop').style.display='flex';
      $('cf-scan').classList.add('on');
      $('dr-status').textContent='● LIVE'; $('dr-status').classList.add('on');
      running=true;
      await loadModel();
      intv=setInterval(predict,CFG.MS);
    }catch{ alert('카메라 접근 권한이 필요합니다.'); }
  }

  function stopCamera(){
    if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}
    clearInterval(intv);
    const v=$('webcam'); v.style.display='none'; v.srcObject=null;
    $('cam-idle').style.display='flex';
    $('btn-start').style.display='flex';
    $('btn-capture').style.display='none';
    $('btn-stop').style.display='none';
    $('cf-scan').classList.remove('on');
    $('dr-status').textContent='READY'; $('dr-status').classList.remove('on');
    running=false; frozen=false; reset();
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
    }else{
      tick++;
      const w=Math.floor(tick/6)%CFG.CLASSES.length;
      ps=CFG.CLASSES.map((c,i)=>({name:c.name,emoji:c.emoji,probability:i===w?0.7+Math.random()*.25:0.04+Math.random()*.08}));
    }
    const best=ps.reduce((a,b)=>a.probability>b.probability?a:b);
    const em=$('dr-emoji'); em.classList.remove('pop'); void em.offsetWidth; em.classList.add('pop');
    em.textContent=best.emoji;
    $('dr-label').textContent=best.name;
    $('dr-conf').textContent=`신뢰도: ${(best.probability*100).toFixed(1)}%`;
    ps.forEach((p,i)=>{
      const f=$(`bf-${i}`),c=$(`bp-${i}`);
      if(f)f.style.width=(p.probability*100).toFixed(1)+'%';
      if(c)c.textContent=(p.probability*100).toFixed(0)+'%';
    });
  }

  function reset(){
    $('dr-emoji').textContent='❓'; $('dr-label').textContent='대기 중';
    $('dr-conf').textContent='카메라를 시작하면 분류가 시작됩니다';
    CFG.CLASSES.forEach((c,i)=>{
      const f=$(`bf-${i}`),p=$(`bp-${i}`);
      if(f)f.style.width='0%'; if(p)p.textContent='0%';
    });
  }
  function setStatus(t,msg){ $('dm-text').textContent=msg; $('dm-dot').className='dm-dot'+(t==='ok'?' ok':''); }
  window.startCamera=startCamera; window.stopCamera=stopCamera; window.captureFrame=captureFrame;
})();
