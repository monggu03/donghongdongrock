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
| `deck.src.html` | 발표 원본(46장, 클릭 117번, 장마다 대본). 뒤에 깔린 파이프라인 기계(`#world`)는 장마다 상태만 바뀌고 카메라가 따라감 |
| `world/build.mjs` | 파이프라인 기계 그림을 만드는 스크립트. `world.svg`(그림)와 `world.json`(카메라 영역·글자 위치·카트 경로)을 씀 |
| `world/vendor/anatomy/` | 아이소메트릭 도형 키트 `iso-kit.mjs`, `iso.css` ([anatomy](https://github.com/wheresryan22/anatomy), MIT) |
| `build.py` | 폰트·캡처·배포 정보를 넣어 `out/index.html` 한 파일로 만듦 |
| `check.py` | CI 검사(크롬으로 모든 장·단계 확인, `?static`으로 움직임 없이 끝 상태만) |
| `captures/` | 슬라이드에 넣을 캡처 (이름 규칙은 `captures/README.md`) |
| `fonts/` | Pretendard, JetBrains Mono, Noto Serif CJK(東弘同樂 글자만) · 모두 SIL OFL 1.1 |
| `vercel.json` | Vercel 빌드 설정 |

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

## 발표할 때

| 키 | 동작 |
|---|---|
| → 스페이스 PageDown 클릭 | 다음 |
| ← PageUp Shift+클릭 | 이전 |
| 숫자 + Enter | 그 장으로 |
| F | 전체 화면 |
| P | 발표자 창(대본·다음 장·타이머) |
| B | 화면 가리기 |
| H | 도움말 |

## 출처

- 기계 그림의 도형 키트: [anatomy](https://github.com/wheresryan22/anatomy) by Ryan, MIT License (`world/vendor/anatomy/LICENSE`). 그리는 부분(`iso-kit.mjs`, `iso.css`)만 가져와 썼습니다.
- 폰트: `fonts/` 안 각 라이선스(SIL OFL 1.1)
