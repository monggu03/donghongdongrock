/* 손그림 강조 (Rough Notation, vendor/rough-notation.js — 무대 축소 배율 보정 패치)
 *   요소에 data-rn="circle|underline|strike-through|box|highlight"
 *        data-rn-s="나타날 단계" data-rn-c="색" data-rn-w="굵기" data-rn-p="여백"
 *   요소가 보이는 단계가 되면 그려지고, 뒤로 가거나 장을 떠나면 지워짐
 */
(function(D){
  'use strict';
  var STATIC = D.env.static, RN = window.RoughNotation, all = [];

  D.on('render', function(ctx){
    if(!RN) return;
    var page = ctx.page, mode = ctx.mode;
    if(ctx.changed) all.forEach(function(r){ if(r.page !== page && r.on){ clearTimeout(r.t); r.on = false; r.a.hide(); } });
    D.$$('[data-rn]', page).forEach(function(el){
      var r = el._rn;
      if(!r){
        r = el._rn = {page:page, on:false, a:RN.annotate(el, {type:el.dataset.rn, color:el.dataset.rnC || '#CF222E', strokeWidth:+(el.dataset.rnW || 4),
          padding:+(el.dataset.rnP || 8), iterations:2, animationDuration:650})};
        all.push(r);
      }
      var want = ctx.S >= +(el.dataset.rnS || 0) && !el.closest('.hid');
      if(want && !r.on){
        var anim = !STATIC && (mode === 'step' || mode === 'page');
        r.on = true; r.a.animate = anim; clearTimeout(r.t);
        if(anim) r.t = setTimeout(function(){ if(r.on) r.a.show(); }, mode === 'step' ? 380 : 650); else r.a.show();
      } else if(!want && r.on){ clearTimeout(r.t); r.on = false; r.a.hide(); }
    });
  });
})(window.Deck);
