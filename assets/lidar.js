(function(){var c=document.getElementById('lidar');if(!c)return;var x=c.getContext('2d'),w,h,pts=[],a=0,dpr=Math.min(window.devicePixelRatio||1,2);
var still=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function size(){w=c.clientWidth;h=c.clientHeight;c.width=w*dpr;c.height=h*dpr;x.setTransform(dpr,0,0,dpr,0,0);build()}
function build(){pts=[];var cx=w*.72,cy=h*.5,R=Math.max(w,h)*.6;for(var i=0;i<720;i++){var t=i/720*Math.PI*2;var r=R*(.35+.25*Math.abs(Math.sin(t*3))+.12*Math.sin(t*11)+(Math.random()-.5)*.03);pts.push({t:t,x:cx+Math.cos(t)*r,y:cy+Math.sin(t)*r*.6,life:0})}}
function frame(){x.clearRect(0,0,w,h);var cx=w*.72,cy=h*.5;a=(a+0.012)%(Math.PI*2);
for(var i=0;i<pts.length;i++){var p=pts[i],d=(a-p.t+Math.PI*2)%(Math.PI*2);if(d<0.05)p.life=1;else p.life*=0.992;if(still)p.life=.6;if(p.life>.02){x.fillStyle='rgba(34,211,238,'+p.life+')';x.fillRect(p.x,p.y,2,2)}}
if(!still){var g=x.createLinearGradient(cx,cy,cx+Math.cos(a)*w,cy+Math.sin(a)*w*.6);g.addColorStop(0,'rgba(182,242,60,.5)');g.addColorStop(1,'rgba(182,242,60,0)');x.strokeStyle=g;x.lineWidth=1.5;x.beginPath();x.moveTo(cx,cy);x.lineTo(cx+Math.cos(a)*w,cy+Math.sin(a)*w*.6);x.stroke()}
x.fillStyle='#B6F23C';x.fillRect(cx-3,cy-3,6,6);if(!still)requestAnimationFrame(frame)}
window.addEventListener('resize',size);size();frame()})();
