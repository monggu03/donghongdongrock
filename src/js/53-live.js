/* 실시간 배포 정보 (44장, 배포된 주소에서만)
 *   window.DHDL = build.py가 넣은 {api, commit, revision?, message?}
 *   이 화면을 만든 커밋은 빌드 때 값, 응답 중인 리비전은 실습 백엔드 /api/hello에서 받아 옴
 *   처음 열 때 한 번, 실패하면 두 번 더, 그리고 44장에 들어올 때마다 다시 (40-slides.js)
 *   data-live="키"에 값을 넣고, data-live-show="키"는 값이 오면 보임
 */
(function(D){
  'use strict';
  var LIVE = window.DHDL || {}, ok = false, busy = false;

  function set(key, val){
    D.$$('[data-live="'+key+'"]').forEach(function(e){ e.textContent = val; e.classList.remove('pend'); });
    D.$$('[data-live-show="'+key+'"]').forEach(function(e){ e.classList.remove('nolive'); });
  }
  function load(n){
    if(ok || busy || !(LIVE.api && /^https?:$/.test(location.protocol) && window.fetch)) return;
    busy = true;
    var ctl = window.AbortController ? new AbortController() : null;
    var to = setTimeout(function(){ if(ctl) ctl.abort(); }, 8000);
    function again(){ clearTimeout(to); busy = false; if(n < 2) setTimeout(function(){ load(n + 1); }, 1500); }
    fetch(LIVE.api.replace(/\/$/, '') + '/api/hello', ctl ? {signal: ctl.signal} : {})
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(d){ if(d && d.revision){ clearTimeout(to); busy = false; ok = true; set('message', d.message || ''); set('revision', d.revision); } else again(); })
      .catch(again);
  }
  // 빌드 때 받아 둔 값을 먼저 보이고(발표장 와이파이가 안 될 때 대비), 실시간 값이 오면 덮어씀
  function start(){
    if(LIVE.commit) set('commit', LIVE.commit);
    if(LIVE.revision){ set('message', LIVE.message || ''); set('revision', LIVE.revision); }
    load(0);
  }

  D.live = {load: load, start: start};
})(window.Deck);
