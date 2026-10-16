(function(){
var still=window.matchMedia('(prefers-reduced-motion: reduce)').matches,DPR=Math.min(window.devicePixelRatio||1,2);
function fit(c){var w=c.clientWidth,h=c.clientHeight;c.width=w*DPR;c.height=h*DPR;var x=c.getContext('2d');x.setTransform(DPR,0,0,DPR,0,0);return{x:x,w:w,h:h}}
function onVis(c,fn){var on=true;if('IntersectionObserver' in window)new IntersectionObserver(function(e){on=e[0].isIntersecting}).observe(c);(function loop(t){if(on&&!document.hidden)fn(t);if(!still)requestAnimationFrame(loop)})(0)}

/* ---------- ROBOTICS: spinning 3D LiDAR point cloud ---------- */
var lc=document.getElementById('scan');
if(lc){
 var H=1.8,LAS=24,AZ=900,pts=[];
 var boxes=[[6,-2.2,4.6,1.9,1.5],[-9,2.6,4.4,1.9,1.6],[14,3,4.6,2,1.5],[-4,-6.5,1.2,1.2,1.8],[3,7,0.6,0.6,1.7],[-16,-3,5,2.2,2.6]]; // cx,cy,len,wid,h
 function rayBox(dx,dy,b){var x0=b[0]-b[2]/2,x1=b[0]+b[2]/2,y0=b[1]-b[3]/2,y1=b[1]+b[3]/2,tmin=0,tmax=1e9;
  if(Math.abs(dx)<1e-9){if(0<x0||0>x1)return 1e9}else{var a=x0/dx,c=x1/dx;if(a>c){var s=a;a=c;c=s}tmin=Math.max(tmin,a);tmax=Math.min(tmax,c)}
  if(Math.abs(dy)<1e-9){if(0<y0||0>y1)return 1e9}else{var a2=y0/dy,c2=y1/dy;if(a2>c2){var s2=a2;a2=c2;c2=s2}tmin=Math.max(tmin,a2);tmax=Math.min(tmax,c2)}
  return tmax>=tmin&&tmin>0?tmin:1e9}
 for(var i=0;i<AZ;i++){var az=i/AZ*Math.PI*2,dx=Math.cos(az),dy=Math.sin(az);
  for(var l=0;l<LAS;l++){var el=(-24+l*(26/(LAS-1)))*Math.PI/180,te=Math.tan(el),best=1e9,kind=0,zz=0;
   for(var b=0;b<boxes.length;b++){var t=rayBox(dx,dy,boxes[b]);if(t<best){var z=H+t*te;if(z>=0&&z<=boxes[b][4]){best=t;kind=1;zz=z}}}
   var wall=26+6*Math.sin(az*3)+3*Math.sin(az*7);if(best>wall){var zw=H+wall*te;if(zw>=0&&zw<=9){best=wall;kind=2;zz=zw}}
   if(best>1e8&&te<0){var g=H/-te;if(g<40){best=g;kind=0;zz=0}}
   if(best<1e8){var n=(Math.random()-.5)*.04;pts.push({x:(best+n)*dx,y:(best+n)*dy,z:zz,az:az,d:best,k:kind})}}}
 var L,a0=0,cam=0;function rs(){L=fit(lc)}rs();window.addEventListener('resize',rs);
 var sweep=0,last=0;
 onVis(lc,function(t){var x=L.x,w=L.w,h=L.h,dt=Math.min((t-last)/1000,.05)||.016;last=t;
  x.clearRect(0,0,w,h);sweep=(sweep+dt*2.2)%(Math.PI*2);cam+=dt*.12;
  var S=Math.min(w,h)*.045,cx=w*.55,cy=h*.45,pitch=.95,cp=Math.cos(pitch),sp=Math.sin(pitch),cc=Math.cos(cam),sc=Math.sin(cam),f=38;
  function P(px,py,pz){var rx=px*cc-py*sc,ry=px*sc+py*cc;var yy=ry*cp-pz*sp,zz=ry*sp+pz*cp;var k=f/(f+yy);return[cx+rx*S*k,cy-zz*S*k*1.0+yy*S*k*.0,k,yy]}
  // range rings
  x.lineWidth=1;for(var r=5;r<=25;r+=5){x.beginPath();for(var q=0;q<=64;q++){var aa=q/64*Math.PI*2,p=P(r*Math.cos(aa),r*Math.sin(aa),0);q?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])}x.strokeStyle='rgba(34,211,238,.10)';x.stroke()}
  // points
  for(var j=0;j<pts.length;j++){var p0=pts[j],age=(sweep-p0.az+Math.PI*2)%(Math.PI*2),fresh=still?.8:Math.max(.18,1-age/4.5),pp=P(p0.x,p0.y,p0.z),sz=Math.max(1,1.8*pp[2]);
   if(p0.k===1)x.fillStyle='rgba(182,242,60,'+fresh+')';else if(p0.k===2){x.fillStyle='rgba(120,160,255,'+fresh*.75+')'}else{var g2=Math.max(0,1-p0.d/40);x.fillStyle='rgba(34,211,238,'+(fresh*(.35+.65*g2))+')'}
   x.fillRect(pp[0],pp[1],sz,sz)}
  // boxes wireframe
  x.strokeStyle='rgba(182,242,60,.55)';boxes.forEach(function(b){var c=[[-1,-1],[1,-1],[1,1],[-1,1]].map(function(s){return[b[0]+s[0]*b[2]/2,b[1]+s[1]*b[3]/2]});[0,b[4]].forEach(function(z){x.beginPath();c.forEach(function(v,i){var p=P(v[0],v[1],z);i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])});x.closePath();x.stroke()});c.forEach(function(v){var p=P(v[0],v[1],0),q=P(v[0],v[1],b[4]);x.beginPath();x.moveTo(p[0],p[1]);x.lineTo(q[0],q[1]);x.stroke()})});
  // sweep beam
  var bp=P(0,0,H),be=P(28*Math.cos(sweep),28*Math.sin(sweep),0),gr=x.createLinearGradient(bp[0],bp[1],be[0],be[1]);gr.addColorStop(0,'rgba(182,242,60,.7)');gr.addColorStop(1,'rgba(182,242,60,0)');x.strokeStyle=gr;x.lineWidth=2;x.beginPath();x.moveTo(bp[0],bp[1]);x.lineTo(be[0],be[1]);x.stroke();
  // ego vehicle
  x.strokeStyle='#22D3EE';x.lineWidth=1.5;x.beginPath();[[2.2,1],[-2.2,1],[-2.2,-1],[2.2,-1]].forEach(function(v,i){var p=P(v[0],v[1],0);i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])});x.closePath();x.stroke();
  x.fillStyle='#B6F23C';x.beginPath();x.arc(bp[0],bp[1],3.5,0,7);x.fill();
  // HUD
  if(w<520)return;x.font='11px "JetBrains Mono",monospace';x.fillStyle='rgba(147,167,181,.9)';var hx=Math.max(16,w*.06),hy=Math.max(80,h*.12);
  ['LIDAR_TOP  '+LAS+'-CH  10 Hz','POINTS     '+pts.length.toLocaleString(),'RANGE      40.0 m','TRACKS     '+boxes.length+' OBJ','SWEEP      '+(sweep*57.3).toFixed(0).padStart(3,'0')+'°'].forEach(function(s,i){x.fillText(s,hx,hy+i*16)});
 });
}

/* ---------- HARDWARE: gears + laser cutter on a blueprint ---------- */
var gc=document.getElementById('shop');
if(gc){
 var G,ink='#123466',red='#C2371F',sparks=[],T0=0;function rs2(){G=fit(gc)}rs2();window.addEventListener('resize',rs2);
 function gear(x,cx,cy,R,n,rot){var tw=Math.PI*2/n,ro=R,ri=R-R*.18;x.beginPath();for(var i=0;i<n;i++){var a=rot+i*tw;[[a,ri],[a+tw*.12,ro],[a+tw*.45,ro],[a+tw*.57,ri]].forEach(function(p,k){var px=cx+Math.cos(p[0])*p[1],py=cy+Math.sin(p[0])*p[1];(i||k)?x.lineTo(px,py):x.moveTo(px,py)})}x.closePath();x.stroke();
  x.beginPath();x.arc(cx,cy,R*.22,0,7);x.stroke();for(var s=0;s<5;s++){var b=rot+s*Math.PI*2/5;x.beginPath();x.arc(cx+Math.cos(b)*R*.5,cy+Math.sin(b)*R*.5,R*.11,0,7);x.stroke()}
  x.save();x.setLineDash([4,4]);x.globalAlpha=.5;x.beginPath();x.arc(cx,cy,R*.91,0,7);x.stroke();x.restore();
  x.beginPath();x.moveTo(cx-R*1.15,cy);x.lineTo(cx+R*1.15,cy);x.moveTo(cx,cy-R*1.15);x.lineTo(cx,cy+R*1.15);x.save();x.setLineDash([10,3,2,3]);x.globalAlpha=.35;x.stroke();x.restore()}
 // laser part path: bracket outline with two holes, sampled
 function partPath(){var p=[],add=function(x,y){p.push([x,y])};
  var W=1,Hh=.62,r=.12;for(var i=0;i<=20;i++)add(-W/2+r+(W-2*r)*i/20,-Hh/2);
  for(i=0;i<=8;i++){var a=-Math.PI/2+i/8*Math.PI/2;add(W/2-r+r*Math.cos(a),-Hh/2+r+r*Math.sin(a))}
  for(i=0;i<=12;i++)add(W/2,-Hh/2+r+(Hh-2*r)*i/12);
  for(i=0;i<=8;i++){a=i/8*Math.PI/2;add(W/2-r+r*Math.cos(a),Hh/2-r+r*Math.sin(a))}
  for(i=0;i<=8;i++)add(W/2-r-(.12)*i/8,Hh/2);
    for(i=0;i<=16;i++){a=i/16*Math.PI;add(.26-.52*i/16, Hh/2-.2*Math.sin(a))}
  for(i=0;i<=8;i++)add(-.26-(W/2-r-.26)*i/8,Hh/2);
  for(i=0;i<=8;i++){a=Math.PI/2+i/8*Math.PI/2;add(-W/2+r+r*Math.cos(a),Hh/2-r+r*Math.sin(a))}
  for(i=0;i<=12;i++)add(-W/2,Hh/2-r-(Hh-2*r)*i/12);
  for(i=0;i<=8;i++){a=Math.PI+i/8*Math.PI/2;add(-W/2+r+r*Math.cos(a),-Hh/2+r+r*Math.sin(a))}
  var holes=[[-.3,-.05],[.3,-.08]].map(function(c){var h=[];for(var k=0;k<=24;k++){var b=k/24*Math.PI*2;h.push([c[0]+.08*Math.cos(b),c[1]+.08*Math.sin(b)])}return h});
  return [holes[0],holes[1],p]}
 var segs=partPath(),flat=[];segs.forEach(function(s,si){s.forEach(function(q,i){flat.push({x:q[0],y:q[1],s:si,first:i===0})})});
 var last2=0;
 onVis(gc,function(t){var x=G.x,w=G.w,h=G.h,dt=Math.min((t-last2)/1000,.05)||.016;last2=t;x.clearRect(0,0,w,h);var m=Math.min(w,h),time=still?0:t/1000;
  x.lineWidth=1.3;x.strokeStyle=ink;
  // gear train (meshed: speed inversely prop. to teeth)
  var narrow=w<520,R1=m*(narrow?.09:.11),R2=R1*.66,R3=R1*.5,g1=narrow?[w*.17,h*.17]:[w*.19,h*.38],ang=time*.5;
  var g2=[g1[0]+(R1+R2)*.93*Math.cos(.5),g1[1]+(R1+R2)*.93*Math.sin(.5)],g3=[g2[0]+(R2+R3)*.93*Math.cos(-.9),g2[1]+(R2+R3)*.93*Math.sin(-.9)];
  gear(x,g1[0],g1[1],R1,24,ang);gear(x,g2[0],g2[1],R2,16,-ang*24/16+Math.PI/16);gear(x,g3[0],g3[1],R3,12,ang*24/12);
  x.fillStyle=red;x.font='10px "IBM Plex Mono",monospace';x.fillText('Z=24',g1[0]-R1*.2,g1[1]+R1*1.35);x.fillText('Z=16',g2[0]+R2*1.1,g2[1]+R2*.2);x.fillText('i = 2.0',g3[0]-R3*.5,g3[1]-R3*1.3);
  // laser bed
  var bw=narrow?w*.48:Math.min(w*.46,m*.75),bh=bw*.62,bx=w-bw-(narrow?16:w*.07),by=narrow?h*.06:h*.25;
  x.save();x.strokeStyle=ink;x.globalAlpha=.6;x.strokeRect(bx,by,bw,bh);x.setLineDash([2,4]);for(var gx=1;gx<8;gx++){x.beginPath();x.moveTo(bx+gx*bw/8,by);x.lineTo(bx+gx*bw/8,by+bh);x.stroke()}x.restore();
  var sc=bw*.7,ox=bx+bw/2,oy=by+bh/2,N=flat.length,cyc=10,prog=still?1:((time%cyc)/cyc)*1.15,upto=Math.min(N-1,Math.floor(prog*N));
  // ghost outline (to cut)
  x.save();x.setLineDash([3,3]);x.globalAlpha=.35;segs.forEach(function(s){x.beginPath();s.forEach(function(q,i){var px=ox+q[0]*sc,py=oy+q[1]*sc;i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke()});x.restore();
  // cut so far
  x.lineWidth=2;x.strokeStyle=ink;x.beginPath();for(var i=0;i<=upto;i++){var q=flat[i],px=ox+q.x*sc,py=oy+q.y*sc;(q.first||i===0)?x.moveTo(px,py):x.lineTo(px,py)}x.stroke();
  var hd=flat[upto],hx=ox+hd.x*sc,hy=oy+hd.y*sc,cutting=prog<1;
  // gantry
  x.lineWidth=1;x.strokeStyle=ink;x.globalAlpha=.8;x.beginPath();x.moveTo(bx-6,hy);x.lineTo(bx+bw+6,hy);x.moveTo(hx,by-6);x.lineTo(hx,by+bh+6);x.stroke();x.globalAlpha=1;
  x.strokeRect(hx-7,hy-7,14,14);
  if(cutting){var gl=x.createRadialGradient(hx,hy,0,hx,hy,16);gl.addColorStop(0,'rgba(255,120,60,.9)');gl.addColorStop(1,'rgba(194,55,31,0)');x.fillStyle=gl;x.beginPath();x.arc(hx,hy,16,0,7);x.fill();
   for(var s2=0;s2<3;s2++)sparks.push({x:hx,y:hy,vx:(Math.random()-.5)*140,vy:(Math.random()-.2)*120,l:1})}
  sparks=sparks.filter(function(p){p.l-=dt*2.2;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=260*dt;if(p.l>0){x.fillStyle='rgba(194,55,31,'+p.l+')';x.fillRect(p.x,p.y,2,2)}return p.l>0});
  // readout
  x.fillStyle=red;x.font='10px "IBM Plex Mono",monospace';x.fillText((cutting?'LASER ON ':'PART DONE')+'  X '+((hd.x+.5)*120).toFixed(1)+'  Y '+((hd.y+.31)*120).toFixed(1)+'  F 1800',bx,by+bh+18);
 });
}
})();
