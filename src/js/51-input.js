/* 입력: 키보드, 클릭, 화면 위 버튼 (발표 화면에서만 연결, 발표자 창은 52-presenter.js가 키를 전달)
 *   → 스페이스 PageDown 클릭: 다음   ← PageUp Shift+클릭: 이전   숫자+Enter: 그 장으로   Home/End
 *   F 전체 화면   P 발표자 창   D 펜   X 펜 지우기   B . 가리기   H ? 도움말   Esc 닫기
 */
(function(D){
  'use strict';
  var nav = function(){ return D.nav; };
  var jumpBuf = '', jumpEl = document.getElementById('jump'), help = document.getElementById('help'), black = document.getElementById('black');

  function onKey(e, fromPresenter){
    var k = e.key;
    if(k === 'ArrowRight' || k === ' ' || k === 'PageDown' || k === 'ArrowDown'){ e.preventDefault && e.preventDefault(); if(jumpBuf){ jumpBuf = ''; jumpEl.textContent = ''; } nav().next(); }
    else if(k === 'ArrowLeft' || k === 'PageUp' || k === 'ArrowUp' || k === 'Backspace'){ e.preventDefault && e.preventDefault(); nav().prev(); }
    else if(k === 'Home'){ nav().go(0, 0); } else if(k === 'End'){ nav().go(nav().count-1, 0); }
    else if(/^[0-9]$/.test(k)){ jumpBuf += k; jumpEl.textContent = '→ '+jumpBuf; }
    else if(k === 'Enter'){ if(jumpBuf){ nav().go(+jumpBuf-1, 0); jumpBuf = ''; jumpEl.textContent = ''; } else nav().next(); }
    else if(k === 'Escape'){ jumpBuf = ''; jumpEl.textContent = ''; help.classList.add('hid'); if(D.pen.isOn()) D.pen.toggle(false); }
    else if(!fromPresenter && (k === 'd' || k === 'D')){ D.pen.toggle(); }
    else if(k === 'x' || k === 'X'){ D.pen.clear(); }
    else if(!fromPresenter && (k === 'f' || k === 'F')){ var d = document.documentElement; try{ if(document.fullscreenElement) document.exitFullscreen(); else if(d.requestFullscreen) d.requestFullscreen().catch(function(){}); }catch(err){} }
    else if(k === 'b' || k === 'B' || k === '.'){ black.classList.toggle('hid'); }
    else if(k === 'h' || k === 'H' || k === '?'){ help.classList.toggle('hid'); }
    else if(!fromPresenter && (k === 'p' || k === 'P')){ D.presenter.open(); }
  }

  function listen(){
    window.addEventListener('keydown', function(e){ if(e.altKey || e.ctrlKey || e.metaKey) return; onKey(e, false); });
    D.stage.addEventListener('click', function(e){ if(D.pen.isOn() || e.target.closest('.ix')) return; if(e.shiftKey) nav().prev(); else nav().next(); });
    // 25장 승인 버튼: 직접 눌러도 다음 단계로
    document.getElementById('approveBtn').addEventListener('click', function(e){ e.stopPropagation(); var c = nav().current(); if(c.page.id === 'delivery' && c.S === 0) nav().next(); });
    // 39장 도구 탭: 눌러서 바로 그 탭으로
    D.$$('.tab', D.stage).forEach(function(t){ t.addEventListener('click', function(e){ e.stopPropagation(); if(nav().current().page.id === 'tools') nav().setStep(+t.dataset.tab); }); });
  }

  D.input = {onKey: onKey, listen: listen};
})(window.Deck);
