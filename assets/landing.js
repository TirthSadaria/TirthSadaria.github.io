(function(){
// Background canvases always animate (calmer when the OS asks for reduced motion).
var calm=window.matchMedia('(prefers-reduced-motion: reduce)').matches?0.5:1,DPR=Math.min(window.devicePixelRatio||1,2);
function fit(c){var w=c.clientWidth,h=c.clientHeight;c.width=w*DPR;c.height=h*DPR;var x=c.getContext('2d');x.setTransform(DPR,0,0,DPR,0,0);return{x:x,w:w,h:h}}
function run(c,fn){var on=true,last=0;if('IntersectionObserver' in window)new IntersectionObserver(function(e){on=e[0].isIntersecting}).observe(c);
 (function loop(t){var dt=Math.min((t-last)/1000,.05)*calm;last=t;if(on&&!document.hidden&&dt>0)fn(dt,t/1000*calm);requestAnimationFrame(loop)})(0)}

/* ================= ROBOTICS: live rotating LiDAR with moving traffic ================= */
var lc=document.getElementById('scan');
if(lc){
 var H=1.8,LAS=24,AZ=1080,EL=[],TAU=Math.PI*2;for(var l=0;l<LAS;l++)EL.push(Math.tan((-24+l*26/(LAS-1))*Math.PI/180));
 // actors: x,y,len,wid,h,vx,vy,color  (ego drives +x at 0; world scrolls)
 var actors=[
  {x:9,y:-3.5,l:4.6,w:1.9,h:1.5,vx:3.2,vy:0},{x:-12,y:-3.5,l:4.4,w:1.9,h:1.6,vx:4.5,vy:0},
  {x:22,y:3.5,l:4.6,w:2,h:1.5,vx:-11,vy:0},{x:-2,y:3.5,l:5.5,w:2.2,h:2.6,vx:-9,vy:0},
  {x:4,y:-8,l:.6,w:.6,h:1.75,vx:.2,vy:1.1},{x:-7,y:8.5,l:.6,w:.6,h:1.7,vx:.9,vy:-.15}];
 var poles=[];for(var k=-4;k<=4;k++){poles.push({x:k*9,y:-11.5});poles.push({x:k*9+4.5,y:11.5})}
 var pts=new Array(AZ*LAS),tracked=[];
 function hitBox(dx,dy,a){var x0=a.x-a.l/2,x1=a.x+a.l/2,y0=a.y-a.w/2,y1=a.y+a.w/2,t0=0,t1=1e9,p,q,s;
  if(Math.abs(dx)<1e-9){if(x0>0||x1<0)return 1e9}else{p=x0/dx;q=x1/dx;if(p>q){s=p;p=q;q=s}t0=Math.max(t0,p);t1=Math.min(t1,q)}
  if(Math.abs(dy)<1e-9){if(y0>0||y1<0)return 1e9}else{p=y0/dy;q=y1/dy;if(p>q){s=p;p=q;q=s}t0=Math.max(t0,p);t1=Math.min(t1,q)}
  return t1>=t0&&t0>0?t0:1e9}
 function scanCol(i){var az=i/AZ*TAU,dx=Math.cos(az),dy=Math.sin(az);
  for(var l=0;l<LAS;l++){var te=EL[l],best=1e9,kind=0,z=0,b;
   for(b=0;b<actors.length;b++){var t=hitBox(dx,dy,actors[b]);if(t<best){var zz=H+t*te;if(zz>=0&&zz<=actors[b].h){best=t;kind=1;z=zz}}}
   for(b=0;b<poles.length;b++){var pl=poles[b],pt=pl.x*dx+pl.y*dy;if(pt>0){var px=pl.x-pt*dx,py=pl.y-pt*dy;if(px*px+py*py<.04&&pt<best){var zp=H+pt*te;if(zp>=0&&zp<=5){best=pt;kind=3;z=zp}}}}
   // road edge walls (barriers) at |y|=13
   if(Math.abs(dy)>1e-3){var tw=13/Math.abs(dy);if(tw<best){var zw=H+tw*te;if(zw>=0&&zw<=1.0+.4*Math.sin((tw*dx)*.3)){best=tw;kind=2;z=zw}}}
   if(best>1e8&&te<0){var g=H/-te;if(g<45){best=g;kind=0;z=0}}
   pts[i*LAS+l]=best<1e8?{x:best*dx,y:best*dy,z:z,k:kind,d:best,t:0}:null}}
 for(var i0=0;i0<AZ;i0++)scanCol(i0);
 var L;function rs(){L=fit(lc)}rs();window.addEventListener('resize',rs);
 var sweep=0,cam=.6,clock=0;
 run(lc,function(dt){var x=L.x,w=L.w,h=L.h;clock+=dt;
  // move traffic (relative to ego driving +x at 8 m/s)
  actors.forEach(function(a){a.x+=(a.vx-(a.l<1?0:0))*dt;a.y+=a.vy*dt;if(a.x>30)a.x-=60;if(a.x<-30)a.x+=60;if(a.y>10)a.vy=-Math.abs(a.vy);if(a.y<-10)a.vy=Math.abs(a.vy)});
  poles.forEach(function(p){p.x-=8*dt;if(p.x<-38)p.x+=81});
  // rotate the scanner and re-scan the columns it just passed (10 Hz feel, slowed for viewing)
  var prev=sweep;sweep=(sweep+dt*TAU*.55)%TAU;var i1=Math.floor(prev/TAU*AZ),i2=Math.floor(sweep/TAU*AZ),n=(i2-i1+AZ)%AZ;for(var s=0;s<n;s++){var ci=(i1+s)%AZ;scanCol(ci);for(var q=0;q<LAS;q++)if(pts[ci*LAS+q])pts[ci*LAS+q].t=clock}
  cam+=dt*.18;
  x.clearRect(0,0,w,h);
  var S=Math.min(w,h)*.042,cx=w*.52,cy=h*.46,pitch=.9+.12*Math.sin(clock*.2),cp=Math.cos(pitch),sp=Math.sin(pitch),cc=Math.cos(cam),sc=Math.sin(cam),f=40;
  function P(px,py,pz){var rx=px*cc-py*sc,ry=px*sc+py*cc,yy=ry*cp-pz*sp,zz=ry*sp+pz*cp,k=f/(f+yy);return[cx+rx*S*k,cy-zz*S*k,k]}
  // lane lines scrolling
  x.lineWidth=1;var off=(clock*8)%6;[-7,0,7].forEach(function(ly){for(var lx=-36;lx<36;lx+=6){var a=P(lx-off,ly,0),b=P(lx-off+3,ly,0);x.strokeStyle='rgba(34,211,238,.18)';x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);x.stroke()}});
  // points with decay since last hit
  for(var j=0;j<pts.length;j++){var p0=pts[j];if(!p0)continue;var age=clock-p0.t,fr=Math.max(.15,1-age*.35),pp=P(p0.x,p0.y,p0.z),sz=Math.max(1,1.9*pp[2]);
   if(p0.k===1)x.fillStyle='rgba(182,242,60,'+fr+')';else if(p0.k===3)x.fillStyle='rgba(255,200,90,'+fr*.9+')';else if(p0.k===2)x.fillStyle='rgba(120,160,255,'+fr*.8+')';else x.fillStyle='rgba(34,211,238,'+(fr*(.3+.7*Math.max(0,1-p0.d/45)))+')';
   x.fillRect(pp[0],pp[1],sz,sz)}
  // tracked boxes + velocity arrows
  x.lineWidth=1.2;actors.forEach(function(a,ai){if(P(a.x,a.y,a.h)[2]>2.2)return;var c=[[-1,-1],[1,-1],[1,1],[-1,1]].map(function(s){return[a.x+s[0]*a.l/2,a.y+s[1]*a.w/2]});x.strokeStyle='rgba(182,242,60,.75)';
   [0,a.h].forEach(function(z){x.beginPath();c.forEach(function(v,i){var p=P(v[0],v[1],z);i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])});x.closePath();x.stroke()});
   c.forEach(function(v){var p=P(v[0],v[1],0),q=P(v[0],v[1],a.h);x.beginPath();x.moveTo(p[0],p[1]);x.lineTo(q[0],q[1]);x.stroke()});
   var o=P(a.x,a.y,a.h+.3),e=P(a.x+a.vx*.35,a.y+a.vy*.35,a.h+.3);x.strokeStyle='#B6F23C';x.beginPath();x.moveTo(o[0],o[1]);x.lineTo(e[0],e[1]);x.stroke();
   if(w>520){x.fillStyle='rgba(182,242,60,.9)';x.font='10px "JetBrains Mono",monospace';x.fillText(a.l<1?'PED '+Math.hypot(a.vx,a.vy).toFixed(1)+'m/s':'CAR_'+(ai+1)+' '+Math.abs(a.vx+8).toFixed(1)+'m/s',o[0]+4,o[1]-4)}});
  // sweep wedge
  var bp=P(0,0,H);x.beginPath();x.moveTo(bp[0],bp[1]);for(var q2=0;q2<=12;q2++){var aa=sweep-.35*q2/12,e2=P(30*Math.cos(aa),30*Math.sin(aa),0);x.lineTo(e2[0],e2[1])}x.closePath();
  var gr=x.createRadialGradient(bp[0],bp[1],0,bp[0],bp[1],30*S);gr.addColorStop(0,'rgba(182,242,60,.28)');gr.addColorStop(1,'rgba(182,242,60,0)');x.fillStyle=gr;x.fill();
  // ego vehicle
  x.strokeStyle='#22D3EE';x.lineWidth=1.6;[0].forEach(function(z){x.beginPath();[[2.3,1],[-2.3,1],[-2.3,-1],[2.3,-1]].forEach(function(v,i){var p=P(v[0],v[1],z);i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])});x.closePath();x.stroke()});
  x.fillStyle='#B6F23C';x.beginPath();x.arc(bp[0],bp[1],3.5+1.5*Math.sin(clock*8),0,7);x.fill();
  if(w<520)return;x.font='11px "JetBrains Mono",monospace';x.fillStyle='rgba(147,167,181,.95)';var hx=Math.max(16,w*.05),hy=Math.max(80,h*.13);
  ['LIDAR_TOP   '+LAS+'-CH  10 Hz','EGO SPEED   8.0 m/s','TRACKS      '+actors.length+' OBJ','POINTS/SWP  '+(AZ*LAS/1000).toFixed(1)+'k','AZIMUTH     '+(sweep*57.3).toFixed(0).padStart(3,'0')+'°'].forEach(function(s,i){x.fillText(s,hx,hy+i*16)});
 });
}

/* ================= HARDWARE: CNC laser cutting a nested sheet ================= */
var gc=document.getElementById('shop');
if(gc){
 var G;function rs2(){G=fit(gc)}rs2();window.addEventListener('resize',rs2);
 var ink='#123466',red='#C2371F';
 function circ(cx,cy,r,n,a0){var p=[];for(var i=0;i<=n;i++){var a=(a0||0)+i/n*Math.PI*2;p.push([cx+r*Math.cos(a),cy+r*Math.sin(a)])}return p}
 function rrect(x0,y0,w,h,r){var p=[],k,a;function arc(cx,cy,s){for(k=0;k<=6;k++){a=s+k/6*Math.PI/2;p.push([cx+r*Math.cos(a),cy+r*Math.sin(a)])}}
  arc(x0+w-r,y0+r,-Math.PI/2);arc(x0+w-r,y0+h-r,0);arc(x0+r,y0+h-r,Math.PI/2);arc(x0+r,y0+r,Math.PI);p.push(p[0]);return p}
 function sprocket(cx,cy,R,n){var p=[];for(var i=0;i<=n*8;i++){var a=i/(n*8)*Math.PI*2,r=R*(1-.12*Math.max(0,Math.cos(a*n)));p.push([cx+r*Math.cos(a),cy+r*Math.sin(a)])}return p}
 function slot(cx,cy,l,r){var p=[],k,a;for(k=0;k<=8;k++){a=-Math.PI/2+k/8*Math.PI;p.push([cx+l/2+r*Math.cos(a),cy+r*Math.sin(a)])}for(k=0;k<=8;k++){a=Math.PI/2+k/8*Math.PI;p.push([cx-l/2+r*Math.cos(a),cy+r*Math.sin(a)])}p.push(p[0]);return p}
 // sheet in mm (300 x 180); inner features first, then outer profiles (real CAM order)
 var jobs=[
  {name:'BRACKET',paths:[circ(45,55,8,20),circ(105,55,8,20),slot(75,115,40,7),rrect(20,25,110,120,14)]},
  {name:'SPROCKET Z14',paths:[circ(205,70,10,20),circ(205,70,4,12,0).map(function(q){return[q[0]+22,q[1]]}),sprocket(205,70,48,14)]},
  {name:'MOTOR PLATE',paths:[circ(185,150,11,20),circ(160,150,3,10),circ(210,150,3,10),rrect(150,128,70,44,6)]},
  {name:'SPACER',paths:[circ(262,145,6,16),circ(262,145,20,32)]},
  {name:'TAB',paths:[slot(262,40,30,9)]}];
 // flatten into a toolpath with rapid moves
 var tp=[];jobs.forEach(function(j,ji){j.paths.forEach(function(p,pi){var len=0;for(var i=1;i<p.length;i++)len+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);tp.push({job:ji,pts:p,len:len,outer:pi===j.paths.length-1})})});
 var total=tp.reduce(function(s,c){return s+c.len},0),rapidSpeed=900,cutSpeed=240;
 var state={seg:0,dist:0,rapid:true,from:[0,0],t:0,done:[],dropT:-1},sparks=[],smoke=[],gcode=[],clock=0;
 function pushG(s){gcode.push(s);if(gcode.length>7)gcode.shift()}
 pushG('G21 G90 ; mm, absolute');pushG('M3 S0 ; laser armed');
 function pos(){var c=tp[state.seg];if(state.rapid){var to=c.pts[0],L=Math.hypot(to[0]-state.from[0],to[1]-state.from[1]),k=L?Math.min(1,state.dist/L):1;return[state.from[0]+(to[0]-state.from[0])*k,state.from[1]+(to[1]-state.from[1])*k]}
  var d=state.dist,p=c.pts;for(var i=1;i<p.length;i++){var sl=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);if(d<=sl){var k2=sl?d/sl:0;return[p[i-1][0]+(p[i][0]-p[i-1][0])*k2,p[i-1][1]+(p[i][1]-p[i-1][1])*k2]}d-=sl}return p[p.length-1]}
 run(gc,function(dt){var x=G.x,w=G.w,h=G.h,narrow=w<520;clock+=dt;x.clearRect(0,0,w,h);
  // advance machine
  if(state.dropT>=0){state.dropT+=dt;if(state.dropT>2.2){state={seg:0,dist:0,rapid:true,from:[0,0],t:0,done:[],dropT:-1};pushG('M30 ; next sheet')}}
  else{var c=tp[state.seg];if(state.rapid){var to=c.pts[0];state.dist+=rapidSpeed*dt;if(state.dist>=Math.hypot(to[0]-state.from[0],to[1]-state.from[1])){state.rapid=false;state.dist=0;pushG('G0 X'+to[0].toFixed(1)+' Y'+to[1].toFixed(1));pushG('M3 S'+(c.outer?'1000':'850')+' ; pierce')}}
   else{state.dist+=cutSpeed*dt;if(state.dist>=c.len){state.done.push(state.seg);pushG('G1 ... F1800 ; '+jobs[c.job].name+(c.outer?' profile':' hole'));pushG('M5');state.from=c.pts[c.pts.length-1];state.seg++;state.dist=0;state.rapid=true;if(state.seg>=tp.length){state.dropT=0;state.seg=tp.length-1;pushG('G0 X0 Y0 ; park')}}}}
  // layout: sheet area
  var sw=narrow?w*.5:Math.min(w*.62,(h*.36)*300/180),sh=sw*180/300,sx=w-sw-(narrow?14:w*.08),sy=narrow?h*.07:h*.27,k=sw/300;
  function M(p){return[sx+p[0]*k,sy+p[1]*k]}
  // machine frame & rails
  x.strokeStyle=ink;x.lineWidth=1;x.globalAlpha=.5;x.strokeRect(sx-14,sy-14,sw+28,sh+28);x.globalAlpha=1;
  // slats under sheet
  x.save();x.globalAlpha=.25;x.setLineDash([2,3]);for(var s=1;s<12;s++){x.beginPath();x.moveTo(sx+s*sw/12,sy);x.lineTo(sx+s*sw/12,sy+sh);x.stroke()}x.restore();
  // sheet (drops down after finishing)
  var drop=state.dropT>=0?Math.max(0,state.dropT-1)*sh*.9:0;x.save();x.beginPath();x.rect(sx-14,sy-14,sw+28,sh+28);x.clip();
  x.fillStyle='rgba(18,52,102,.05)';x.fillRect(sx,sy+drop,sw,sh);x.strokeStyle=ink;x.lineWidth=1.2;x.strokeRect(sx,sy+drop,sw,sh);
  // ghost (to cut)
  x.save();x.setLineDash([3,3]);x.globalAlpha=.35;tp.forEach(function(c,ci){if(state.done.indexOf(ci)>=0||ci===state.seg&&!state.rapid)return;x.beginPath();c.pts.forEach(function(p,i){var m=M(p);i?x.lineTo(m[0],m[1]+drop):x.moveTo(m[0],m[1]+drop)});x.stroke()});x.restore();
  // finished cuts (outer profiles get a light fill = part freed)
  tp.forEach(function(c,ci){if(state.done.indexOf(ci)<0)return;x.beginPath();c.pts.forEach(function(p,i){var m=M(p);i?x.lineTo(m[0],m[1]+drop):x.moveTo(m[0],m[1]+drop)});x.strokeStyle=ink;x.lineWidth=1.6;x.stroke();if(c.outer){x.fillStyle='rgba(18,52,102,.08)';x.fill()}});
  x.restore();
  // current cut with hot trailing kerf
  var hp=pos(),H2=M(hp),cur=tp[state.seg],cutting=!state.rapid&&state.dropT<0;
  if(cutting){var d=0,p=cur.pts;x.lineWidth=1.8;for(var i=1;i<p.length&&d<state.dist;i++){var sl=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]),a=M(p[i-1]),b=i===p.length-1||d+sl>state.dist?M(pos()):M(p[i]);var age=(state.dist-d)/cutSpeed;x.strokeStyle=age<.35?'rgba(255,110,40,'+(1-age*2)+')':ink;x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);x.stroke();d+=sl}}
  else if(state.dropT<0){var fm=M(state.from);x.save();x.setLineDash([6,5]);x.strokeStyle=red;x.globalAlpha=.6;x.beginPath();x.moveTo(fm[0],fm[1]);x.lineTo(M(cur.pts[0])[0],M(cur.pts[0])[1]);x.stroke();x.restore()}
  // gantry (X beam + Y carriage)
  x.strokeStyle=ink;x.lineWidth=1.4;x.beginPath();x.moveTo(sx-14,H2[1]);x.lineTo(sx+sw+14,H2[1]);x.stroke();x.fillStyle='#fff';x.fillRect(sx-22,H2[1]-6,8,12);x.strokeRect(sx-22,H2[1]-6,8,12);x.fillRect(sx+sw+14,H2[1]-6,8,12);x.strokeRect(sx+sw+14,H2[1]-6,8,12);
  x.fillStyle='#fff';x.fillRect(H2[0]-9,H2[1]-9,18,18);x.strokeRect(H2[0]-9,H2[1]-9,18,18);x.beginPath();x.arc(H2[0],H2[1],4,0,7);x.stroke();
  if(cutting){var gl=x.createRadialGradient(H2[0],H2[1],0,H2[0],H2[1],22);gl.addColorStop(0,'rgba(255,150,70,.95)');gl.addColorStop(.4,'rgba(255,90,40,.45)');gl.addColorStop(1,'rgba(194,55,31,0)');x.fillStyle=gl;x.beginPath();x.arc(H2[0],H2[1],22,0,7);x.fill();
   for(var q=0;q<4;q++)sparks.push({x:H2[0],y:H2[1],vx:(Math.random()-.5)*180,vy:(Math.random()-.1)*160,l:1});if(Math.random()<.3)smoke.push({x:H2[0],y:H2[1],r:3,l:1})}
  sparks=sparks.filter(function(p){p.l-=dt*2.4;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=320*dt;if(p.l>0){x.fillStyle='rgba('+(200+55*p.l|0)+','+(80+100*p.l|0)+',40,'+p.l+')';x.fillRect(p.x,p.y,2,2)}return p.l>0});
  smoke=smoke.filter(function(p){p.l-=dt*.8;p.y-=18*dt;p.r+=10*dt;if(p.l>0){x.fillStyle='rgba(79,93,117,'+p.l*.12+')';x.beginPath();x.arc(p.x,p.y,p.r,0,7);x.fill()}return p.l>0});
  // readouts
  var cutLen=0;state.done.forEach(function(i){cutLen+=tp[i].len});if(cutting)cutLen+=state.dist;
  x.fillStyle=red;x.font='10px "IBM Plex Mono",monospace';
  x.fillText((state.dropT>=0?'SHEET DONE · UNLOAD':cutting?'LASER ON  '+jobs[cur.job].name:'RAPID')+'   X '+hp[0].toFixed(1)+'  Y '+hp[1].toFixed(1),sx-14,sy+sh+30);
  // progress bar
  x.strokeStyle=ink;x.strokeRect(sx-14,sy+sh+38,sw+28,5);x.fillStyle=red;x.fillRect(sx-14,sy+sh+38,(sw+28)*Math.min(1,cutLen/total),5);
  if(!narrow){var gx=Math.max(20,w*.07),gy=sy+4;x.fillStyle=ink;x.font='10px "IBM Plex Mono",monospace';x.globalAlpha=.85;x.fillText('NC PROGRAM  sheet_06.nc',gx,gy);x.globalAlpha=.6;gcode.forEach(function(s,i){x.fillText(s.slice(0,22),gx,gy+16+i*14)});x.globalAlpha=1;
   x.fillStyle=red;x.fillText('PARTS  '+state.done.filter(function(i){return tp[i].outer}).length+' / '+jobs.length,gx,gy+16+8*14);x.fillText('CUT    '+(cutLen/1000).toFixed(2)+' m',gx,gy+16+9*14)}
 });
}
})();
