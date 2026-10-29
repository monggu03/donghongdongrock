/* 발표 중 펜 (drauu, vendor/drauu.js): D 켜고 끄기, X 지우기, 장을 넘기면 지워짐
 *   켜져 있는 동안은 클릭이 장 넘김이 아니라 그리기 (51-input.js가 Deck.pen.isOn()을 봄)
 */
(function(D){
  'use strict';
  var ink = null, on = false;

  function toggle(force){
    if(!window.Drauu) return;
    if(!ink) ink = window.Drauu.createDrauu({el:'#ink', brush:{mode:'stylus', color:'#FF6309', size:8}});
    on = force === undefined ? !on : force;
    document.documentElement.classList.toggle('inking', on);
  }
  function clear(){ if(ink) ink.clear(); }

  D.pen = {toggle: toggle, clear: clear, isOn: function(){ return on; }};
  D.on('beforeRender', function(ctx){ if(ctx.changed) clear(); });
})(window.Deck);
