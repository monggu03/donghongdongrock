/* 덱 공통 바탕: 모든 모듈이 쓰는 이름공간 window.Deck
 *
 * 구조 (파일 이름 앞 번호 순서대로 <script>로 들어감, build.py가 한 파일로 묶음)
 *   00-core        이름공간, 환경, DOM 도우미, 이벤트 버스, 장별 동작 등록소
 *   10~11          준비: 코드 카드, 아이콘
 *   20~22          파이프라인 기계: 상태 합치기 → 장면 데이터 → 그리기
 *   30~33          효과: 숫자, 코드 전환, 손그림, 펜
 *   40             장별 동작 (Deck.onSlide로 등록)
 *   50~53          진행: 렌더 순서, 입력, 발표자 창, 실시간 배포 정보
 *   90-boot        시작
 *
 * 렌더 한 번의 순서 (50-navigation.js가 지휘)
 *   emit('beforeRender') → 단계별 보이기·숨기기 → 장별 동작 → emit('render') → 진행 표시 → emit('afterRender')
 *   기능은 서로를 직접 부르지 않고 이 이벤트를 구독함. 새 효과는 파일 하나 추가 + Deck.on(...)으로 끼움.
 */
(function(){
  'use strict';
  var stage = document.getElementById('stage');
  var events = {}, slides = {};

  var Deck = window.Deck = {
    env: {
      static: /[?&]static/.test(location.search),       // 검사용: 움직임 없이 끝 상태만
      presenter: /[?&]presenter/.test(location.search)  // 발표자 창
    },
    stage: stage,
    pages: [].slice.call(stage.querySelectorAll('.page')),

    $$: function(sel, root){ return [].slice.call((root || document).querySelectorAll(sel)); },

    // "1-4,8" → {1:true, 2:true, 3:true, 4:true, 8:true}
    parseList: function(str){
      var out = {};
      (str || '').split(',').forEach(function(part){
        part = part.trim(); if(!part) return;
        var m = part.split('-'), a = +m[0], b = m.length > 1 ? +m[1] : a;
        for(var i = a; i <= b; i++) out[i] = true;
      });
      return out;
    },

    // 이벤트 버스 (관찰자 패턴): 렌더 단계마다 구독한 기능이 등록 순서대로 불림
    on: function(name, fn){ (events[name] = events[name] || []).push(fn); },
    emit: function(name, ctx){ (events[name] || []).forEach(function(fn){ fn(ctx); }); },

    // 장별 동작 등록소 (전략 패턴): 장 id → function(step, page, mode)
    onSlide: function(id, fn){ slides[id] = fn; },
    runSlide: function(ctx){ var fn = slides[ctx.id]; if(fn) fn(ctx.S, ctx.page, ctx.mode); }
  };

  if(Deck.env.static) document.documentElement.classList.add('static');
  Deck.pages.forEach(function(p, i){ if(!p.id) p.id = 'p' + (i + 1); });
})();
