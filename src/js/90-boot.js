/* 시작: 발표자 창이면 그 화면만, 아니면 입력·실시간 정보를 연결하고 주소의 #p장-단계로 바로 감 */
(function(D){
  'use strict';
  if(D.env.presenter){ D.presenter.startViewer(); return; }
  D.presenter.listen();
  D.input.listen();
  D.live.start();
  var m = location.hash.match(/^#p(\d+)(?:-(\d+))?$/);
  D.nav.fit();
  if(m) D.nav.go(+m[1]-1, +(m[2]||0)); else D.nav.render('jump');
})(window.Deck);
