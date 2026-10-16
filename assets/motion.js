(function(){
var still=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('js');
// reveal on scroll
document.querySelectorAll('.sec-h,.timeline li,.stack-row,.process li,.mini-grid li,.p-sec,.metrics.big').forEach(function(e){e.classList.add('rv')});
var rv=document.querySelectorAll('.rv');
if(still||!('IntersectionObserver' in window)){rv.forEach(function(e){e.classList.add('in')})}
else{var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){var e=en.target,sib=e.parentElement?[].indexOf.call(e.parentElement.children,e):0;e.style.transitionDelay=Math.min(sib,6)*70+'ms';e.classList.add('in');io.unobserve(e);count(e)}})},{threshold:.12});rv.forEach(function(e){io.observe(e)})}
// count up numbers like 140, 0.033 px, 172, 20+
function count(root){if(still)return;root.querySelectorAll('.num').forEach(function(b){if(b.dataset.done)return;b.dataset.done=1;var t=b.textContent,m=t.match(/^(\d[\d,]*\.?\d*)(.*)$/);if(!m)return;var n=parseFloat(m[1].replace(/,/g,'')),dec=(m[1].split('.')[1]||'').length,suf=m[2],t0=null;
function f(ts){if(!t0)t0=ts;var k=Math.min((ts-t0)/1100,1),e=1-Math.pow(1-k,3);b.textContent=(n*e).toFixed(dec)+suf;if(k<1)requestAnimationFrame(f);else b.textContent=t}requestAnimationFrame(f)})}
document.querySelectorAll('.metrics').forEach(function(m){if(!m.closest('.rv'))count(m)});
// looping clips: load and play only while visible
var vids=document.querySelectorAll('video.loop');
function load(v){if(!v.src&&v.dataset.src){v.src=v.dataset.src}}
if(still){vids.forEach(function(v){load(v);v.controls=true})}
else if('IntersectionObserver' in window){var vo=new IntersectionObserver(function(es){es.forEach(function(en){var v=en.target;if(en.isIntersecting){load(v);var p=v.play();if(p&&p.catch)p.catch(function(){})}else{v.pause()}})},{rootMargin:'200px'});vids.forEach(function(v){vo.observe(v)})}
else vids.forEach(function(v){load(v);v.autoplay=true});
// click-to-play YouTube
document.querySelectorAll('.lyt').forEach(function(b){b.addEventListener('click',function(){var f=document.createElement('iframe');f.src='https://www.youtube-nocookie.com/embed/'+b.dataset.yt+'?autoplay=1&rel=0';f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';f.allowFullscreen=true;f.title=b.getAttribute('aria-label');f.className='lyt-frame';b.replaceWith(f)})});
// typed eyebrow
var ty=document.querySelector('.eyebrow.type');if(ty&&!still){var full=ty.textContent;ty.textContent='';ty.classList.add('typing');var i=0;(function step(){ty.textContent=full.slice(0,++i);if(i<full.length)setTimeout(step,22);else ty.classList.remove('typing')})()}
})();
(function(){var b=document.getElementById('bot');if(!b)return;var t=b.querySelector('.bot-t'),full=t.dataset.text,still=window.matchMedia('(prefers-reduced-motion: reduce)').matches,typed=false;
function seen(v){try{if(v===undefined)return sessionStorage.getItem('botSeen');sessionStorage.setItem('botSeen','1')}catch(e){}}
function open(){b.classList.add('open');if(typed)return;typed=true;if(still){t.textContent=full;return}t.classList.add('typing');var i=0;(function s(){t.textContent=full.slice(0,++i);if(i<full.length)setTimeout(s,24);else t.classList.remove('typing')})()}
function close(){b.classList.remove('open');seen(1)}
b.querySelector('.bot-x').addEventListener('click',close);
b.querySelector('.bot-fig').addEventListener('click',function(){b.classList.contains('open')?close():open()});
if(!seen()){setTimeout(open,1800);setTimeout(function(){if(b.classList.contains('open'))close()},14000)}})();
(function(){
// card spotlight follows cursor
document.querySelectorAll('.card').forEach(function(c){c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')})});
// hardware cards: show a drawing-style dimension on hover
document.querySelectorAll('.t-h .card').forEach(function(c,i){c.dataset.dim='DWG-'+String(i+1).padStart(3,'0')+' · REV A'});
// timelines draw in
if('IntersectionObserver' in window){var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');o.unobserve(e.target)}})},{threshold:.15});document.querySelectorAll('.timeline').forEach(function(t){o.observe(t)})}else document.querySelectorAll('.timeline').forEach(function(t){t.classList.add('in')});
// reading progress on project pages
var rb=document.querySelector('.readbar');if(rb){var f=function(){var h=document.documentElement,max=h.scrollHeight-h.clientHeight;rb.style.transform='scaleX('+(max>0?h.scrollTop/max:0)+')'};addEventListener('scroll',f,{passive:true});f()}
})();
