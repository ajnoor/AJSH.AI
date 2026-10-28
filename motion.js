(function(){
'use strict';
var d=document,root=d.documentElement,hero=d.querySelector('.hero'),header=d.getElementById('hd');
if(!hero||!header)return;
root.classList.add('mo');
try{
 var reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 var fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
 var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};
 /* Hero atmosphere: particle canvas with bounded count and DPR. */
 var fx=hero.querySelector('.fx'),cv=fx&&fx.querySelector('.fx-cv');
 if(cv&&cv.getContext&&!reduced){
  var ctx=cv.getContext('2d'),W=0,H=0,dpr=1,parts=[],raf=0,visible=true,last=0,px=0,py=0,tx=0,ty=0,cx=0,cy=0,has=false;
  function resize(){
   var r=fx.getBoundingClientRect(),nw=Math.max(1,Math.round(r.width)),nh=Math.max(1,Math.round(r.height)),oldW=W||nw,oldH=H||nh;
   W=nw;H=nh;dpr=Math.min(window.devicePixelRatio||1,window.innerWidth<700?1:1.5);
   cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
   parts.forEach(function(p){p.x=p.x/oldW*W;p.y=p.y/oldH*H});
   var count=clamp(Math.round(W*H/18000),14,48);
   while(parts.length<count)parts.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.24,vy:(Math.random()-.5)*.22,z:.35+Math.random()*.65,phase:Math.random()*6.28});
   parts.length=count;
  }
  function draw(t){
   ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
   var l=root.getAttribute('data-theme')==='light',rgb=l?'109,40,217':'196,181,253',dist=Math.min(145,Math.max(90,W*.12));
   for(var i=0;i<parts.length;i++){
    var p=parts[i];p.x+=p.vx;p.y+=p.vy;
    if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;
    if(fine&&has){var dx=p.x-cx,dy=p.y-cy,dd=dx*dx+dy*dy;if(dd<16000){var ddn=Math.sqrt(dd)||1;p.x+=dx/ddn*(1-ddn/126)*.7;p.y+=dy/ddn*(1-ddn/126)*.7}}
    var x=p.x+px*12*p.z,y=p.y+py*8*p.z;
    ctx.fillStyle='rgba('+rgb+','+(.35+.4*(.5+.5*Math.sin(t*.001+p.phase)))+')';
    ctx.beginPath();ctx.arc(x,y,p.z*1.4,0,Math.PI*2);ctx.fill();
    for(var j=i+1;j<parts.length;j++){var q=parts[j],qx=q.x+px*12*q.z,qy=q.y+py*8*q.z,dx2=x-qx,dy2=y-qy,dd2=dx2*dx2+dy2*dy2;if(dd2<dist*dist){ctx.strokeStyle='rgba('+rgb+','+((1-Math.sqrt(dd2)/dist)*.2)+')';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(qx,qy);ctx.stroke()}}
   }
  }
  function frame(t){raf=0;if(!visible||d.hidden)return;var dt=last?Math.min(2,(t-last)/16.67):1;last=t;if(fine){px+=(tx-px)*.06;py+=(ty-py)*.06}draw(t);raf=requestAnimationFrame(frame)}
  function start(){if(!reduced&&!raf&&visible&&!d.hidden){last=0;raf=requestAnimationFrame(frame)}}
  function stop(){if(raf){cancelAnimationFrame(raf);raf=0}}
  resize();if('ResizeObserver'in window)new ResizeObserver(resize).observe(fx);else addEventListener('resize',resize);
  if(fine){hero.addEventListener('pointermove',function(e){var r=hero.getBoundingClientRect();tx=clamp((e.clientX-r.left-r.width/2)/(r.width/2),-1,1);ty=clamp((e.clientY-r.top-r.height/2)/(r.height/2),-1,1);var cr=cv.getBoundingClientRect();cx=e.clientX-cr.left;cy=e.clientY-cr.top;has=true},{passive:true});hero.addEventListener('pointerleave',function(){has=false;tx=ty=0})}
  if('IntersectionObserver'in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;hero.classList.toggle('off',!visible);if(visible)start();else stop()}).observe(hero);
  d.addEventListener('visibilitychange',function(){if(d.hidden)stop();else start()});start();
 }
 /* Scroll reveals: only hide targets when observer is available. */
 var targets=d.querySelectorAll('.svc .card,.about,.fq details,.band .cg .btn,.fr,.step,.sh .eyebrow,.sh h2,.lui,.loop,.band');
 if(!reduced&&'IntersectionObserver'in window){
  targets.forEach(function(el,i){el.style.setProperty('--motion-delay',Math.min(i%6,5)*70+'ms')});
  var io=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting||e.boundingClientRect.bottom<0){e.target.classList.add('vs');io.unobserve(e.target)}})},{threshold:0,rootMargin:'0px 0px -7% 0px'});
  targets.forEach(function(el){io.observe(el)});
 }else targets.forEach(function(el){el.classList.add('vs')});
 /* Header progress and scroll state. */
 var maxS=1,scrollPending=false;
 function measure(){maxS=Math.max(1,root.scrollHeight-innerHeight)}
 function scroll(){scrollPending=false;var y=window.scrollY||0;header.classList.toggle('sc',y>8);header.style.setProperty('--motion-progress',Math.min(1,y/maxS).toFixed(4));}
 measure();scroll();addEventListener('scroll',function(){if(!scrollPending){scrollPending=true;requestAnimationFrame(scroll)}},{passive:true});addEventListener('resize',function(){measure();scroll()});addEventListener('load',function(){measure();scroll()});
 /* Sliding desktop navigation indicator. */
 var nav=d.getElementById('nav'),ul=nav&&nav.querySelector('ul');
 if(ul&&!reduced){
  var ni=d.createElement('li'),mq=matchMedia('(min-width:861px)'),hovering=false;ni.className='ni';ni.setAttribute('aria-hidden','true');ni.setAttribute('role','presentation');ul.appendChild(ni);nav.classList.add('ix');
  function place(a){if(!a||!mq.matches){ni.classList.remove('on');return}var r=a.getBoundingClientRect(),u=ul.getBoundingClientRect(),was=ni.classList.contains('on');if(!was)ni.classList.add('nt');ni.style.setProperty('--x',(r.left-u.left)+'px');ni.style.setProperty('--y',(r.top-u.top)+'px');ni.style.setProperty('--w',r.width+'px');ni.style.setProperty('--h',r.height+'px');if(!was){void ni.offsetWidth;ni.classList.add('on');requestAnimationFrame(function(){ni.classList.remove('nt')})}}
  function reset(){place(ul.querySelector('a.on'))}
  [].slice.call(ul.querySelectorAll('a')).forEach(function(a){a.addEventListener('pointerenter',function(){hovering=true;place(a)});a.addEventListener('focus',function(){place(a)});a.addEventListener('blur',function(){if(!hovering)reset()});new MutationObserver(function(){if(!hovering)reset()}).observe(a,{attributes:true,attributeFilter:['class']})});
  ul.addEventListener('pointerleave',function(){hovering=false;reset()});addEventListener('resize',reset);if(d.fonts&&d.fonts.ready)d.fonts.ready.then(reset);
 }
 /* Card tilt and subtle CTA magnet on fine pointers only. */
 if(fine&&!reduced){
  d.querySelectorAll('.svc .card').forEach(function(card){var frameId=0,ex=0,ey=0;function apply(){frameId=0;var r=card.getBoundingClientRect(),x=clamp((ex-r.left)/Math.max(1,r.width),0,1),y=clamp((ey-r.top)/Math.max(1,r.height),0,1);card.style.setProperty('--ry',((x-.5)*7).toFixed(2)+'deg');card.style.setProperty('--rx',((.5-y)*5).toFixed(2)+'deg');card.style.setProperty('--mx',(x*100).toFixed(1)+'%');card.style.setProperty('--my',(y*100).toFixed(1)+'%')}card.addEventListener('pointermove',function(e){ex=e.clientX;ey=e.clientY;if(!frameId)frameId=requestAnimationFrame(apply)},{passive:true});card.addEventListener('pointerleave',function(){if(frameId)cancelAnimationFrame(frameId);frameId=0;card.style.setProperty('--rx','0deg');card.style.setProperty('--ry','0deg')})});
  d.querySelectorAll('.hero .btn.p,.hbtn').forEach(function(b){var r=null;b.addEventListener('pointerenter',function(){r=b.getBoundingClientRect()});b.addEventListener('pointermove',function(e){if(!r)return;var x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;b.style.translate=(x*5).toFixed(1)+'px '+(y*4).toFixed(1)+'px'},{passive:true});b.addEventListener('pointerleave',function(){b.style.translate='';r=null})});
 }
 root.classList.add('rvr');
}catch(err){root.classList.remove('mo','rvr');if(window.console)console.error('[AJSH motion]',err)}
})();