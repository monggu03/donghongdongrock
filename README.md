# 동홍동락 in HIU · CI/CD, 어떻게 하는 걸까

2026.11.02 동홍동락 in HIU(동국대·홍익대 GDGoC 연합 세미나) 20분 발표 페이지입니다.
CI/CD를 처음 듣는 사람이 20분 안에 전체 그림을 잡도록, 아이소메트릭으로 그린 파이프라인 기계 한 대 위에서 커밋 하나가 검사대를 지나 운영까지 가는 모습을 애니메이션으로 보여 주는 강의형 발표입니다.
발표 내용 그대로, 이 페이지도 **PR → 검사 → 머지 → 배포 → 롤백** 다섯 칸으로 배포합니다.

| 칸 | 이 레포에서 |
|---|---|
| PR | 대본·문구·캡처를 바꿀 때도 브랜치 → PR |
| 검사 | GitHub Actions `deck-check`: 빌드 후 모든 장을 크롬으로 넘기며 넘침·작은 글자·물음표·스크립트 오류 검사 |
| 머지 | 브랜치 보호: `deck-check`가 빨간 X면 머지 잠김 |
| 배포 | Vercel이 main을 운영에, PR을 미리보기 주소로 배포 |
| 롤백 | Revert PR, 급하면 Vercel Instant Rollback |

백엔드 자리는 실습 레포 `cicd-backend`(GitHub Actions → Cloud Run, WIF)가 맡습니다.
배포된 페이지는 그 서버의 `/api/hello`를 불러 **지금 응답 중인 리비전**을 슬라이드에 띄웁니다.
인터넷이 없거나 파일로 열면 고정 문구로 바뀌니 현장에서도 깨지지 않습니다.

## 파일

| 경로 | 내용 |
|---|---|
| `src/` | 발표 원본. 46장, 클릭 72번, 장마다 대본이 있음. 짜임은 아래 "원본 구조" 참고 |
| `world/build.mjs` | 파이프라인 기계 그림을 만드는 스크립트. `world.svg`(그림)와 `world.json`(카메라 영역·글자 위치·카트 경로)을 씀 |
| `world/vendor/anatomy/` | 아이소메트릭 도형 키트 `iso-kit.mjs`, `iso.css` ([anatomy](https://github.com/wheresryan22/anatomy), MIT) |
| `build.py` | 폰트·캡처·배포 정보를 넣어 `out/index.html` 한 파일로 만듦 |
| `check.py` | CI 검사(크롬으로 모든 장·단계 확인, `?static`으로 움직임 없이 끝 상태만) |
| `tools/build-assets.mjs` | 오픈소스 조각을 미리 만들어 `vendor/`, `assets/`에 씀 (아래 출처의 라이브러리들) |
| `vendor/` | 묶어 둔 라이브러리: 손그림 강조, 굴러가는 숫자, 펜, 코드 전환 애니메이션, 라이선스 고지(`LICENSES.txt`) |
| `assets/` | 아이콘(Octicons·Tabler), 얼굴(Notionists), Shiki로 미리 칠한 코드, 39장 코드 전환 데이터 |
| `captures/` | 슬라이드에 넣을 캡처 (이름 규칙은 `captures/README.md`) |
| `fonts/` | Pretendard, JetBrains Mono, Noto Serif CJK(東弘同樂 글자만) · 모두 SIL OFL 1.1 |
| `vercel.json` | Vercel 빌드 설정 |

## 원본 구조 (`src/`)

`build.py`가 `src/index.html` 틀에 아래 파일들을 **파일 이름 순서대로** 끼워 한 파일로 만듭니다(앞 번호 = 순서). 결과는 지금처럼 인터넷 없이 열리는 `out/index.html` 하나입니다.

| 경로 | 내용 | 고칠 때 |
|---|---|---|
| `src/index.html` | 틀: 무대, 기계 그림 자리, 쪽 번호·도움말·펜 | 거의 안 고침 |
| `src/slides/NN-id.html` | **장 하나 = 파일 하나** (`<section>` 화면 + `<aside class="notes">` 대본) | 문구·대본·클릭 단계(`data-steps`, `data-s`, `data-u`) |
| `src/styles/01~10-*.css` | 바탕 → 글자 → 코드 카드 → 공통 부품 → 장 부품 → GitHub 모양·아이콘 → 차트·목록 → 겹침 화면 → 기계 → 정적·발표자 모드 | 생김새 |
| `src/js/00-core.js` | 이름공간 `window.Deck`, 이벤트 버스, 장별 동작 등록소 | 거의 안 고침 |
| `src/js/10~11` | 준비: 코드 카드 색칠, 상태 아이콘 | |
| `src/js/20-world-state.js` | 기계 상태의 모양과 합치는 규칙 (순수 데이터) | |
| `src/js/21-scenes.js` | **장별 기계 장면** (어느 장에서 카트가 어디로 가고 무엇이 켜지는지) | 기계 연출 |
| `src/js/22-world.js` | 상태를 그림에 입히고 프레임을 재생 | |
| `src/js/30~33` | 효과: 굴러가는 숫자, 39장 코드 전환, 손그림 강조, 펜 | |
| `src/js/40-slides.js` | **장별 동작** (`Deck.onSlide('canary', …)`) | 장 하나의 특별한 움직임 |
| `src/js/50-navigation.js` | 렌더 순서 지휘: 장·단계 상태, 다음·이전 | 거의 안 고침 |
| `src/js/51~53` | 입력(키·클릭), 발표자 창, 실시간 배포 정보 | |
| `src/js/90-boot.js` | 시작 | |

설계에서 지킨 것

- **내용과 동작 분리**: 장 파일에는 화면과 대본만 있고, 움직임은 `data-*` 속성으로 선언합니다. 장을 고칠 때 스크립트를 열 필요가 없습니다.
- **장면은 데이터**: 기계 연출은 `21-scenes.js`의 객체로만 정합니다. 그리는 코드(`22-world.js`)는 어떤 장인지 모릅니다.
- **관찰자(이벤트 버스)**: 렌더 한 번은 `beforeRender → 단계 보이기·숨기기 → 장별 동작 → render → 진행 표시 → afterRender` 순서이고, 효과 모듈은 `Deck.on('render', …)`으로 끼어듭니다. 효과 하나를 빼거나 더할 때 다른 파일을 건드리지 않습니다.
- **전략(장별 동작 등록소)**: 장마다 다른 동작은 `Deck.onSlide(id, fn)`으로 등록합니다. 진행 코드에 장 이름이 들어가지 않습니다.
- **빌드 도구 없이**: 모듈은 `window.Deck`에 매달리는 즉시 실행 함수라서 번들러가 필요 없고, Vercel과 CI는 지금처럼 Python만 씁니다.

자주 하는 일

- 대본·문구 고치기: `src/slides/`에서 그 장 파일만 엽니다.
- 장 추가: 번호를 맞춰 `src/slides/`에 파일을 넣고, 기계 장면이 필요하면 `21-scenes.js`에 같은 id로, 특별한 움직임은 `40-slides.js`에 `Deck.onSlide`로 넣습니다.
- 조립된 원본을 한 파일로 보고 싶으면 `python build.py --src` → `out/deck.src.html`.

## 처음 한 번 설정

1. **Vercel**: Add New → Project → 이 레포 Import → 그대로 Deploy (설정은 `vercel.json`이 함)
2. **Vercel 환경 변수**: `DHDL_API_URL` = 실습 백엔드 Cloud Run 주소 → Redeploy
3. **브랜치 보호**: Settings → Branches → `main` 규칙 → Require status checks: `deck-check`, Do not allow bypassing
4. 백엔드 CORS: 기본값이 `https://*.vercel.app` 허용이라 보통 그대로 됨. Cloud Run에 `CORS_ALLOWED_ORIGINS`를 바꿔 뒀다면 이 페이지 주소 추가

## 로컬에서

```bash
pip install -r requirements.txt
python -m playwright install chromium
python build.py      # out/index.html
python check.py      # CI와 같은 검사
```

`out/index.html`을 크롬으로 열면 됩니다(인터넷 없이도 동작). 주소 끝에 `?static`을 붙이면 애니메이션 없이 각 단계의 끝 화면만 보여 줍니다.

기계 그림을 고쳤을 때만 Node로 다시 그립니다. 결과물(`world.svg`, `world.json`)을 커밋해 두므로 Vercel과 CI에는 Node가 필요 없습니다.

```bash
node world/build.mjs   # world/world.svg, world/world.json
python build.py
```

코드 카드 내용, 아이콘 목록, 라이브러리 버전을 바꿨을 때도 Node로 다시 만듭니다. 결과물(`vendor/`, `assets/`)은 커밋합니다.
코드를 바꾸고 다시 만들지 않으면 그 카드만 예전 간이 색칠로 보이고 깨지지는 않습니다.

```bash
cd tools && npm ci && cd ..   # 처음 한 번 (버전은 tools/package-lock.json에 고정)
node tools/build-assets.mjs   # src/slides/를 읽어 assets/code.json 등을 다시 씀
python build.py
```

## 발표할 때

| 키 | 동작 |
|---|---|
| → 스페이스 PageDown 클릭 | 다음 |
| ← PageUp Shift+클릭 | 이전 |
| 숫자 + Enter | 그 장으로 |
| F | 전체 화면 |
| P | 발표자 창(대본·다음 장·타이머) |
| D | 펜 켜고 끄기 (켜져 있는 동안 클릭은 그리기, 장을 넘기면 지워짐) |
| X | 펜 자국 지우기 |
| B | 화면 가리기 |
| H | 도움말 |

## 출처

- 기계 그림의 도형 키트: [anatomy](https://github.com/wheresryan22/anatomy) by Ryan, MIT License (`world/vendor/anatomy/LICENSE`). 그리는 부분(`iso-kit.mjs`, `iso.css`)만 가져와 썼습니다.
- 폰트: `fonts/` 안 각 라이선스(SIL OFL 1.1)
- 발표 화면에 들어간 오픈소스 (전문은 `vendor/LICENSES.txt`, 빌드한 `out/index.html` 안에도 주석으로 들어감)
  - 통과·실패·머지 아이콘: [Primer Octicons](https://github.com/primer/octicons), MIT, GitHub Inc.
  - 검사대·체크리스트 아이콘: [Tabler Icons](https://github.com/tabler/tabler-icons), MIT
  - 코드 색칠: [Shiki](https://github.com/shikijs/shiki) `github-light` 테마, MIT
  - 39장 코드 전환: [Shiki Magic Move](https://github.com/shikijs/shiki-magic-move), MIT
  - 손그림 동그라미·취소선: [Rough Notation](https://github.com/rough-stuff/rough-notation), MIT (무대 축소 배율 보정 패치)
  - 카나리 비율 숫자: [NumberFlow](https://github.com/barvian/number-flow), MIT
  - 발표 중 펜: [drauu](https://github.com/antfu/drauu), MIT (perfect-freehand 포함, MIT)
  - 다섯 사람 얼굴: [DiceBear](https://github.com/dicebear/dicebear) Notionists, 그림 CC0 1.0 (Zoish), 코드 MIT
