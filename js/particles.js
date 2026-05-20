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
