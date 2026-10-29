/* 발표자 창 (같은 파일을 ?presenter로 연 두 번째 창): 대본, 다음 장, 타이머
 *   발표 화면 → 발표자 창: 렌더할 때마다 {t:'st', P, S}를 보냄 (afterRender 구독)
 *   발표자 창 → 발표 화면: 누른 키를 {t:'key', k}로 보냄, 열리면 {t:'hello'}
 */
(function(D){
  'use strict';
  var pages = D.pages, pres = null;

  function sendState(){ if(pres && !pres.closed){ try{ var c = D.nav.current(); pres.postMessage({t:'st', P:c.P, S:c.S}, '*'); }catch(e){} } }
  function open(){
    try{ pres = window.open(location.href.split('#')[0].split('?')[0]+'?presenter', 'cicd-presenter', 'width=1180,height=760'); }catch(e){ pres = null; }
    setTimeout(sendState, 600);
  }

  // 발표 화면 쪽: 발표자 창의 키와 인사를 받음
  function listen(){
    window.addEventListener('message', function(e){
      var d = e.data; if(!d) return;
      if(d.t === 'key') D.input.onKey({key:d.k}, true);
      if(d.t === 'hello'){ pres = e.source; sendState(); }
    });
  }

  // 발표자 창 쪽: 대본·다음 장·타이머 화면을 만들고 키를 발표 화면으로 보냄
  function startViewer(){
    var N = pages.length, nsteps = D.nav.nsteps;
    document.body.classList.add('presenter');
    document.getElementById('viewport').style.display = 'none';
    var wrap = document.createElement('div'); wrap.className = 'pv';
    wrap.innerHTML = '<div><h1 id="pvT"></h1><div class="meta" id="pvM"></div><div class="nt" id="pvN"></div></div>'+
      '<div class="side"><div class="clock" id="pvC">00:00</div><div><button type="button" id="pvPrev">이전</button><button type="button" id="pvNext">다음</button><button type="button" id="pvReset">시계 0</button></div>'+
      '<div class="nx">다음 장<b id="pvX"></b></div><div class="keys">→ 스페이스 다음 · ← 이전 · 숫자+Enter 이동 · B 가리기</div></div>';
    document.body.appendChild(wrap);
    var t0 = null;
    setInterval(function(){ if(t0 === null){ document.getElementById('pvC').textContent = '00:00'; return; } var s = Math.floor((Date.now()-t0)/1000); document.getElementById('pvC').textContent = String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); }, 500);
    var show = function(p, s){
      var pg = pages[p], nt = pg.querySelector('.notes');
      document.getElementById('pvT').textContent = (p+1)+'. '+(pg.dataset.title || '');
      document.getElementById('pvM').textContent = '단계 '+s+' / '+nsteps(p)+'   ·   '+(p+1)+' / '+N;
      document.getElementById('pvN').textContent = nt ? nt.textContent : '';
      document.getElementById('pvX').textContent = p < N-1 ? (p+2)+'. '+(pages[p+1].dataset.title || '') : '끝';
    };
    var send = function(k){ if(t0 === null) t0 = Date.now(); try{ window.opener && window.opener.postMessage({t:'key', k:k}, '*'); }catch(e){} };
    window.addEventListener('message', function(e){ var d = e.data; if(d && d.t === 'st') show(d.P, d.S); });
    window.addEventListener('keydown', function(e){ if(['ArrowRight',' ','PageDown','ArrowDown','ArrowLeft','PageUp','ArrowUp','Backspace','Enter','Home','End','b','B','.'].indexOf(e.key) >= 0 || /^[0-9]$/.test(e.key)){ e.preventDefault(); send(e.key); } });
    document.getElementById('pvNext').onclick = function(){ send('ArrowRight'); };
    document.getElementById('pvPrev').onclick = function(){ send('ArrowLeft'); };
    document.getElementById('pvReset').onclick = function(){ t0 = Date.now(); };
    show(0, 0);
    try{ window.opener && window.opener.postMessage({t:'hello'}, '*'); }catch(e){}
  }

  D.presenter = {open: open, listen: listen, startViewer: startViewer};
  D.on('afterRender', sendState);
})(window.Deck);
