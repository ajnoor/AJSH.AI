/* AJSH.AI ambient background. Neural network + signal pulses on one small canvas, plus pointer parallax,
   scroll progress and section awareness. Fails safe: without JS/canvas the CSS layers still render. */
(function(){
'use strict';
var root=document.querySelector('.ab-root');if(!root)return;
try{
var d=document,html=d.documentElement,cv=root.querySelector('.ab-cv'),
 ctx=cv&&cv.getContext?cv.getContext('2d'):null,
 rm=matchMedia('(prefers-reduced-motion:reduce)').matches||matchMedia('(max-width:900px),(pointer:coarse)').matches,
 fine=matchMedia('(hover:hover) and (pointer:fine)').matches,
 nav=navigator,con=nav.connection||{},
 lite=!!(con.saveData||(nav.hardwareConcurrency&&nav.hardwareConcurrency<=2)||(nav.deviceMemory&&nav.deviceMemory<=2)),
 W=0,H=0,dpr=1,N=[],E=[],pulses=[],rings=[],sprV,sprP,sprL,col,
 px=0,py=0,tx=0,ty=0,sy=0,maxY=1,raf=0,last=0,ema=16,frames=0,nextPulse=0,nextRing=3000;
function clamp(v,a,b){return v<a?a:v>b?b:v}
if(lite)root.classList.add('ab-lite');

function pal(){var l=html.getAttribute('data-theme')==='light';
 return l?{n:'109,40,217',p:'124,58,237',k:'190,24,93',a:.8}:{n:'196,181,253',p:'233,213,255',k:'244,114,182',a:1}}
function sprite(c){var s=32,o=d.createElement('canvas');o.width=o.height=s;var g=o.getContext('2d'),r=g.createRadialGradient(16,16,0,16,16,16);
 r.addColorStop(0,'rgba('+c+',1)');r.addColorStop(.25,'rgba('+c+',.7)');r.addColorStop(.6,'rgba('+c+',.12)');r.addColorStop(1,'rgba('+c+',0)');g.fillStyle=r;g.fillRect(0,0,s,s);return o}
function theme(){col=pal();sprV=sprite(col.n);sprP=sprite(col.p);sprL=sprite(col.k);if(rm&&ctx&&W)draw(0)}

function build(){
 var want=Math.round(clamp(W*H/(lite?52000:30000),14,lite?24:50));
 if(N.length>want)N.length=want;
 while(N.length<want)N.push({bx:Math.random(),by:Math.random(),z:.4+Math.random()*.6,ph:Math.random()*6.283,sp:.0002+Math.random()*.0004})}
function size(){
 if(!ctx)return;
 var w=root.clientWidth||innerWidth,h=root.clientHeight||innerHeight;
 dpr=Math.min(devicePixelRatio||1,lite?1:1.5);
 if(w===W&&h===H&&cv.width===Math.round(w*dpr))return;
 W=w;H=h;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);build();if(rm)draw(0)}
function wrap(v,m){return((v%m)+m)%m}
var X=[],Y=[],A=[];
function place(t){
 var ox=px*-22,oy=py*-14,n=N.length;
 for(var i=0;i<n;i++){var p=N[i];
  X[i]=p.bx*W+Math.sin(t*p.sp+p.ph)*16*p.z+ox*p.z;
  Y[i]=wrap(p.by*H+Math.cos(t*p.sp*.8+p.ph)*12*p.z-sy*.10*p.z+oy*p.z,H);
  var e=Math.min(Y[i],H-Y[i])/70;A[i]=e<1?e*e*(3-2*e):1}}
function links(){
 E.length=0;var n=N.length,D=clamp(W*.12,100,160),D2=D*D;
 for(var i=0;i<n;i++)for(var j=i+1;j<n;j++){var dx=X[i]-X[j],dy=Y[i]-Y[j],dd=dx*dx+dy*dy;
  if(dd<D2)E.push([i,j,1-Math.sqrt(dd)/D])}}
function spawn(){
 if(!E.length||pulses.length>=(lite?2:5))return;
 var e=E[(Math.random()*E.length)|0];
 pulses.push({a:e[0],b:e[1],t:0,dur:900+Math.random()*900,k:Math.random()<.18?2:1,hops:0})}
function neighbor(b,from){var c=[];for(var i=0;i<E.length;i++){var e=E[i];if(e[0]===b&&e[1]!==from)c.push(e[1]);else if(e[1]===b&&e[0]!==from)c.push(e[0])}return c.length?c[(Math.random()*c.length)|0]:-1}

function draw(t,dt){
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
 place(t);links();var i,e,a;
 ctx.lineWidth=1;
 for(i=0;i<E.length;i++){e=E[i];a=e[2]*e[2]*.34*col.a*Math.min(A[e[0]],A[e[1]]);
  if(a>.015){ctx.strokeStyle='rgba('+col.n+','+a.toFixed(3)+')';ctx.beginPath();ctx.moveTo(X[e[0]],Y[e[0]]);ctx.lineTo(X[e[1]],Y[e[1]]);ctx.stroke()}}
 for(i=0;i<N.length;i++){var tw=.65+.35*Math.sin(t*.0011+N[i].ph),s=(5+N[i].z*7)*2.2;
  ctx.globalAlpha=Math.min(1,tw*(.35+N[i].z*.6)*col.a*A[i]);ctx.drawImage(sprV,X[i]-s/2,Y[i]-s/2,s,s)}
 ctx.globalAlpha=1;
 if(dt){
  for(i=pulses.length-1;i>=0;i--){var p=pulses[i];p.t+=dt/p.dur;
   var ax=X[p.a],ay=Y[p.a],bx=X[p.b],by=Y[p.b];
   if(Math.hypot(ax-bx,ay-by)>200){pulses.splice(i,1);continue}
   var u=clamp(p.t,0,1),qx=ax+(bx-ax)*u,qy=ay+(by-ay)*u,spr=p.k===2?sprL:sprP,c=p.k===2?col.k:col.p;
   var g=ctx.createLinearGradient(ax,ay,qx,qy);g.addColorStop(0,'rgba('+c+',0)');g.addColorStop(1,'rgba('+c+',.55)');
   ctx.strokeStyle=g;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(qx,qy);ctx.stroke();
   ctx.globalAlpha=col.a;ctx.drawImage(spr,qx-11,qy-11,22,22);ctx.globalAlpha=1;
   if(p.t>=1){var nx=p.hops<3?neighbor(p.b,p.a):-1;if(nx>=0){p.a=p.b;p.b=nx;p.t=0;p.hops++}else pulses.splice(i,1)}}
  for(i=rings.length-1;i>=0;i--){var r=rings[i];r.t+=dt/2600;if(r.t>=1){rings.splice(i,1);continue}
   var rr=r.t*170,al=(1-r.t)*(1-r.t)*.3*col.a;ctx.strokeStyle='rgba('+col.n+','+al.toFixed(3)+')';ctx.lineWidth=1;
   ctx.beginPath();ctx.arc(X[r.i],Y[r.i],rr,0,6.283);ctx.stroke()}}}

/* ---------- pointer, scroll, sections ---------- */
if(fine&&!rm)addEventListener('pointermove',function(e){if(e.pointerType==='touch')return;tx=e.clientX/innerWidth*2-1;ty=e.clientY/innerHeight*2-1},{passive:true});
function meas(){maxY=Math.max(1,html.scrollHeight-innerHeight)}
var st=false;
function onScroll(){st=false;sy=window.scrollY||0;root.style.setProperty('--ab-s',clamp(sy/maxY,0,1).toFixed(4))}
addEventListener('scroll',function(){if(!st){st=true;requestAnimationFrame(onScroll)}},{passive:true});
addEventListener('resize',function(){meas();onScroll()});addEventListener('load',function(){meas();onScroll()});
meas();onScroll();
var ids=['services','automation','how','faq','contact'];
if('IntersectionObserver' in window){
 var so=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)root.setAttribute('data-sec',String(ids.indexOf(e.target.id)+1))})},{rootMargin:'-45% 0px -50% 0px'});
 ids.forEach(function(id){var s=d.getElementById(id);if(s)so.observe(s)});
 var top=d.querySelector('.hero');if(top)new IntersectionObserver(function(es){if(es[0].isIntersecting)root.setAttribute('data-sec','0')},{rootMargin:'-45% 0px -50% 0px'}).observe(top)}

/* ---------- loop ---------- */
function frame(t){
 raf=0;if(d.hidden)return;
 var dt=last?Math.min(48,t-last):16;last=t;
 ema+=(dt-ema)*.06;if(++frames===120&&ema>28&&!root.classList.contains('ab-lite')){lite=true;root.classList.add('ab-lite');dpr=1;size();build()}
 if(fine){px+=(tx-px)*.06;py+=(ty-py)*.06;root.style.setProperty('--ab-px',px.toFixed(3));root.style.setProperty('--ab-py',py.toFixed(3))}
 if(ctx){
  if(t>nextPulse){spawn();nextPulse=t+(lite?1600:800+Math.random()*700)}
  if(!lite&&t>nextRing&&N.length){rings.push({i:(Math.random()*N.length)|0,t:0});nextRing=t+5500+Math.random()*3500}
  draw(t,dt)}
 raf=requestAnimationFrame(frame)}
function go(){if(!rm&&!raf){last=0;raf=requestAnimationFrame(frame)}}
d.addEventListener('visibilitychange',function(){html.classList.toggle('ab-paused',d.hidden);if(d.hidden){cancelAnimationFrame(raf);raf=0}else go()});
if(ctx){theme();size();new MutationObserver(theme).observe(html,{attributes:true,attributeFilter:['data-theme']});
 if('ResizeObserver' in window)new ResizeObserver(size).observe(root)}
go();
}catch(err){if(window.console)console.error('[ambient]',err)}
})();
