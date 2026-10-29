/* 굴러가는 숫자 (NumberFlow, vendor/number-flow.js의 <number-flow>)
 *   Deck.numbers.seq(id, 끝값, [[ms, 값], ...])  정해진 시각마다 값을 바꿈 (8장 6건, 10장 30)
 *   Deck.numbers.pct(id, 값, mode)               카나리 비율 (32·33장)
 *   Deck.numbers.monitor()                       35장 요청량·응답 시간이 조금씩 출렁임
 *   장을 넘기거나 다시 그리면(beforeRender) 남은 예약은 모두 취소
 *   NumberFlow가 없으면 글자만 바꿈
 */
(function(D){
  'use strict';
  var STATIC = D.env.static;
  var timers = [], monT = null;

  function stop(){ timers.forEach(clearTimeout); timers = []; if(monT){ clearInterval(monT); monT = null; } }
  function set(nf, v, anim){ nf.respectMotionPreference = false; nf.animated = !!anim && !STATIC; nf.update(v); }

  function seq(id, final, steps){
    var nf = document.getElementById(id); if(!nf || typeof nf.update !== 'function') return;
    if(!steps || STATIC){ set(nf, final, false); return; }
    set(nf, 0, false);
    steps.forEach(function(p){ timers.push(setTimeout(function(){ set(nf, p[1], true); }, p[0])); });
  }

  function pct(id, n, mode){
    var host = document.getElementById(id), nf = host.querySelector('number-flow');
    if(!nf || typeof nf.update !== 'function'){ host.textContent = n+'%'; return; }
    nf.numberSuffix = '%'; nf.respectMotionPreference = false;
    nf.animated = !STATIC && (mode === 'step' || mode === 'back');
    nf.update(n);
  }

  function monitor(){
    var a = document.getElementById('nfReq'), b = document.getElementById('nfRt');
    if(!a || !b || typeof a.update !== 'function') return;
    a.numberSuffix = 'k/s'; a.format = {minimumFractionDigits: 1, maximumFractionDigits: 1}; b.numberSuffix = 'ms';
    var RQ = [1.2, 1.3, 1.2, 1.1, 1.3], RT = [184, 179, 191, 182, 177], i = 0;  // 예시 값
    set(a, RQ[0], false); set(b, RT[0], false);
    if(STATIC) return;
    monT = setInterval(function(){ i = (i + 1) % RQ.length; set(a, RQ[i], true); set(b, RT[i], true); }, 1700);
  }

  D.numbers = {seq: seq, pct: pct, monitor: monitor, stop: stop};
  D.on('beforeRender', stop);
})(window.Deck);
