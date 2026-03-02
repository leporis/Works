---
name: edu-simulator-project
description: >
  청주교대 교육용 시뮬레이터 프로젝트의 문서·코드·강의자료 작성을 위한 통합 지침.
  시뮬레이터 개발, 강의자료 제작, 문서 작성/수정, 이미지 제작, 코드 리뷰 등
  모든 작업에 적용한다. 사용자가 코드, 문서, 강의자료, 시뮬레이터, 이미지,
  SVG, LaTeX, Beamer, 퀵가이드, 사용설명서, 이론해설서, 활용가이드,
  리팩토링, 코드 리뷰, 세션 인계 등을 언급하면 이 skill을 참조하라.
---

# 교육용 시뮬레이터 프로젝트 통합 지침

이 문서는 프로젝트의 14개 지침 문서에서 추출한 **핵심 규칙과 작업별 참조 경로**를 정리한 것이다.
상세 절차는 각 원본 지침을 프로젝트 지식에서 검색하여 참조한다.

---

## 1. 절대 원칙 (모든 작업에 항상 적용)

### 1.1 품질 원칙

| # | 원칙 |
|:-:|------|
| 1 | **무의식적 반응 금지** — 모든 산출물을 처음부터 끝까지 검토 |
| 2 | **교차검증** — 수정할 부분이 없을 때까지 묻지 말고 수정 |
| 3 | **영향 분석** — 수정이 다른 곳에 미치는 영향 확인 |
| 4 | **반복 검토** — 1회로 끝내지 않기 |
| 5 | **수정 지시 엄수** — 지시받은 것만 정확히 수정, 다른 요소 건드리지 않기 |

### 1.1.1 문서 수정 후 의무 교차 검증 절차

**표준화 관련 문서(VMP·DMPP·DAP·CDMP·GCS-L1·SCS-L2·MLSCS-L3·IOTSCS-L3·ECSCS-L3·SKILL.md·문서정합성점검체계)를 수정할 때마다 아래 스크립트를 실행하여 수정 사항이 0건이 될 때까지 반복한다.**

검증 항목:

| 항목 | 기준 | 자동 수정 |
|------|------|:--------:|
| A. 참고자료 표 버전 | 각 문서 표지에서 자동 읽은 마스터 버전 | ✅ |
| B. 표지 버전 = 이력 마지막 행 | 완전 일치 | ❌ (수동 패치) |
| C. SKILL.md §6 체계 맵 버전 | 마스터 버전 | ✅ |

```python
#!/usr/bin/env python3
"""
cross_validate.py
표준화 문서 수정 후 교차 검증 스크립트.
수정 사항이 0건이 될 때까지 자동 반복.
실행: python3 cross_validate.py  (문서 디렉터리에서)
"""
import re, os

# ── 문서 코드 → 한국어 키워드 매핑 ───────────────────────────────────────
CODE_KW = {
    "VMP":       "버전관리지침",
    "DMPP":      "문서관리지침",
    "DAP":       "문서작성지침서",
    "CDMP":      "코딩관리지침",
    "GCS-L1":    "범용코딩표준",
    "SCS-L2":    "시뮬레이터코딩표준",   # IoT·ML·초등교과 제외
    "MLSCS-L3":  "ML시뮬레이터코딩표준",
    "IOTSCS-L3": "IoT시뮬레이터코딩표준",
    "ECSCS-L3":  "초등교과시뮬레이터코딩표준",
}

# ── 파일명 → 코드 매핑 (표지 버전 읽기용) ───────────────────────────────
# 파일명 매칭 — 긴 키워드 우선 (ML·IoT·초등교과가 SCS-L2에 먹히지 않도록)
FILE_CODE_ORDERED = [
    ("ML시뮬레이터코딩표준",        "MLSCS-L3"),
    ("IoT시뮬레이터코딩표준",       "IOTSCS-L3"),
    ("초등교과시뮬레이터코딩표준",   "ECSCS-L3"),
    ("시뮬레이터코딩표준",          "SCS-L2"),
    ("범용코딩표준",               "GCS-L1"),
    ("코딩관리지침",               "CDMP"),
    ("문서작성지침서",              "DAP"),
    ("문서관리지침",               "DMPP"),
    ("버전관리지침",               "VMP"),
]

def is_match(code, kw, line):
    """SCS-L2 오탐지 방지: 상위 키워드가 하위 문서 행에 매칭되는 것 차단"""
    if code == "SCS-L2":
        return (kw in line and "IoT시뮬레이터" not in line
                and "ML시뮬레이터" not in line
                and "초등교과시뮬레이터" not in line)
    return kw in line

def extract_ref(text):
    """참고자료 섹션 행만 추출"""
    lines, in_ref, result = text.splitlines(), False, []
    for line in lines:
        if re.match(r'^## 참고자료', line):    in_ref = True
        elif re.match(r'^## ', line) and in_ref: break
        if in_ref and line.startswith('|'):      result.append(line)
    return result

def fix_ref(fname, code, old_ver, new_ver):
    """참고자료 섹션의 버전만 교체 (이력 표 보호)"""
    kw = CODE_KW[code]
    lines, in_ref = open(fname, encoding='utf-8').read().splitlines(), False
    out = []
    for line in lines:
        if re.match(r'^## 참고자료', line):    in_ref = True
        elif re.match(r'^## ', line) and in_ref: in_ref = False
        if in_ref and line.startswith('|') and kw in line and old_ver in line:
            line = line.replace(old_ver, new_ver)
        out.append(line)
    open(fname, 'w', encoding='utf-8').write('\n'.join(out))

def read_master():
    """각 문서 표지에서 현재 버전을 읽어 마스터 버전표 생성 (긴 키워드 우선 매칭)"""
    master = {}
    for fname in os.listdir('.'):
        if not fname.endswith('.md'): continue
        text = open(fname, encoding='utf-8').read()
        m = re.search(r'^\*\*문서 버전: (v[\d.]+)\*\*', text, re.MULTILINE)
        if not m: continue
        ver = m.group(1)
        for kw, code in FILE_CODE_ORDERED:
            if kw in fname:
                master[code] = ver
                break
    return master

def run():
    master = read_master()
    print("마스터 버전표:", master)
    round_n = 0
    while True:
        round_n += 1
        ref_errors, hist_errors = [], []
        for fname in sorted(os.listdir('.')):
            if not fname.endswith('.md'): continue
            text = open(fname, encoding='utf-8').read()
            # 검증 A: 참고자료 표
            for code, kw in CODE_KW.items():
                if code not in master: continue
                for line in extract_ref(text):
                    if not is_match(code, kw, line): continue
                    found = re.findall(r'v\d+\.\d+\.\d+\.\d+', line)
                    if not found: continue
                    if found[0] != master[code]:
                        ref_errors.append((fname, code, master[code], found[0]))
            # 검증 B: 표지 vs 이력 마지막
            cm = re.search(r'^\*\*문서 버전: (v[\d.]+)\*\*', text, re.MULTILINE)
            if not cm: continue
            hist = re.findall(r'^\| (v\d+\.\d+\.\d+\.\d+) \|', text, re.MULTILINE)
            if hist and cm.group(1) != hist[-1]:
                hist_errors.append((fname, cm.group(1), hist[-1]))
        total = len(ref_errors) + len(hist_errors)
        print(f"\nRound {round_n}: A={len(ref_errors)}건, B={len(hist_errors)}건")
        if total == 0:
            print("✅ 수정 사항 없음 — 완전 정합"); break
        for fname, code, exp, act in ref_errors:
            fix_ref(fname, code, act, exp)
            print(f"  [A] {fname}: {code} {act}→{exp}")
        for fname, cover, hist in hist_errors:
            print(f"  [B] 수동 확인 필요: {fname} 표지={cover} 이력={hist}")

if __name__ == '__main__':
    run()
```

### 1.2 버전·파일명

- 버전: **vX.Y.Z.W** (메이저.마이너.리비전.패치)
- 파일명: `주요내용(약어)_v버전번호_수정사항키워드_날짜.확장자`
  - 버전번호는 점(.)으로 구분: `v1.0.0.0`, `v1.3.0.1`
  - ⚠️ OS 호환성 문제 발생 시 언더스코어 허용: `v1_0_0_0`
  - 문서 **표지·푸터에 영문명과 약어 병기** 필수: `문서관리지침 (DMPP)`
- 모든 문서 끝에 **참고자료 표 + 생성/수정 이력 표** 필수
- 저자명: **Changmo Yang & Claude AI**

### 1.3 프로그램 생성/수정 시

- 프로그램·퀵가이드·개발참고문서(개발일지) **동시 생성/수정, 버전 일치 필수**
- 산출물 구성:
  ```
  [프로젝트명]_시뮬레이터_v버전.html
  [프로젝트명]_개발일지_v버전.md
  [프로젝트명]_퀵가이드_v버전.md
  ```

### 1.4 문서 작성 절대 금지 (🔴 Top 5)

| # | 금지 사항 |
|:-:|----------|
| 1 | XeLaTeX 사용 금지 → **LuaLaTeX만** 사용 (컬러 이모지 렌더링) |
| 2 | MD 없이 최종 형식(LaTeX/Beamer) 바로 작성 금지 |
| 3 | 기존 TEX 파일 직접 편집 금지 → **MD에서 재생성** |
| 4 | 쪽수 채우기용 부가 정보·간격 조작 금지 |
| 5 | 강의계획서(CK) 범위 밖 연습문제 출제 금지 |

### 1.5 기술 규칙

- SVG→PDF 변환: font-family를 `'Noto Sans CJK KR'`로 교체 후 **rsvg-convert** 사용 (cairosvg 대신). 변환 후 첫 페이지 렌더링 검증 필수
- LaTeX: 목차 제목·표 번호·그림 번호를 **한글로 표기** (목차/표/그림)
- 컬러 이모지: LuaLaTeX + `emoji` 패키지 + `\setemojifont{Noto Color Emoji}`
- TikZ 직접 생성은 **최후 수단** — SVG 우선

---

## 2. 작업별 참조 가이드 (트리거 → 문서 매핑)

아래 표를 보고, 사용자 요청에 맞는 지침 문서를 프로젝트 지식에서 검색하여 절차를 따른다.

### 2.1 코드 작성·개발

| 트리거 | 참조 문서 (검색 키워드) | 핵심 절차 |
|--------|----------------------|----------|
| 시뮬레이터 **신규** 개발 | `범용코딩표준` (L1) → `시뮬레이터코딩표준` (L2) → 도메인별 L3 | L1→L2→L3 순서로 계층 참조 |
| **ML** 시뮬레이터 | `ML시뮬레이터코딩표준` (L3-ML) | 데이터셋 객체 표준, 확장 필드 |
| **IoT** 시뮬레이터 | `IoT시뮬레이터코딩표준` (L3-IoT) | 센서 데이터 구조, micro:bit 연동 |
| **초등교과** 시뮬레이터 | `초등교과시뮬레이터코딩표준` (L3) | 교과 연계, 난이도 조절 |
| 기존 코드 **리팩토링** | `코딩관리지침` Part 1 (§2~12) | 9가지 범용 패턴, 최소 변경·하위 호환 |
| 코드 **개선** (교육 기능) | `코딩관리지침` Part 2 (§13) | 이해·체험·확인 3요소 |
| 코드 **리뷰** | `문서관리지침` Part 3 (§9~14) | 7단계 리뷰 프로세스 |

**코딩 표준 계층 구조:**
```
L1: 범용코딩표준 ─── 모든 프로젝트 공통 (네이밍, 구조, 품질)
 └─ L2: 시뮬레이터코딩표준 ─── 시뮬레이터 공통 (레이아웃, 모드, CONFIG)
     ├─ L3-ML: ML시뮬레이터코딩표준
     ├─ L3-IoT: IoT시뮬레이터코딩표준
     └─ L3-초등교과: 초등교과시뮬레이터코딩표준
```

### 2.2 문서 작성

| 트리거 | 참조 문서 | 핵심 절차 |
|--------|----------|----------|
| **강의자료** 작성 | `문서작성지침서` §2.5.4 | 8단계: 계획서확인→개요→노트→교재초안→그림제작→교재완성→LaTeX→슬라이드 |
| **강의교재** (LaTeX) | `문서작성지침서` §3 | LuaLaTeX, 28~32쪽, 순수 수업 내용만 |
| **강의슬라이드** (Beamer) | `문서작성지침서` §4 | 밝은톤, 그림 중심, 텍스트 간결 |
| **Pandoc PDF** (부속 문서) | `문서작성지침서` §5 | XeLaTeX 엔진, 이모지→유니코드 매핑 |
| 문서 **검토** 요청 | `문서작성지침서` §2.5.3 | 7개 항목 (지침준수·정확성·일관성·그림·배치·색상·이모지) |
| **이미지/그림** 제작 | `문서관리지침` §3 | 8단계 이미지 프로세스 |
| **SVG** 제작 | `코딩관리지침` §14~15 | SVG 기술 가이드, 레이아웃 규칙 |

### 2.3 시뮬레이터 부속 문서

| 트리거 | 참조 문서 | 핵심 |
|--------|----------|------|
| **퀵가이드** | `코딩관리지침` §17 | 4대 원칙 (Action/Success/Observe/Escape), 필수 7섹션 |
| **사용설명서** | `코딩관리지침` §20 | 전체 기능 레퍼런스, 필수 7섹션 |
| **이론해설서** | `코딩관리지침` §21 | 개념·원리 교육적 설명, "왜?"에 답하는 문서 |
| **활용가이드** | `코딩관리지침` §22 | 수업 시나리오 5단계, 활동지, 평가 체크리스트 |
| **개발일지** | `코딩관리지침` §16 | 기술 문서 (상세) |
| **수업 활용 자료** | `코딩관리지침` §18 | 시나리오·질문설계·활동지·어조변환 |

### 2.4 관리 작업

| 트리거 | 참조 문서 | 핵심 |
|--------|----------|------|
| **세션 인계** | `버전관리지침(VMP)` §8 | 7섹션 인계 문서 구조 |
| **버전 판단** 애매 | `버전관리지침(VMP)` §5~6 | Claude가 판단 후 안내, 또는 먼저 확인 |
| **문서 간 정합성** | `문서정합성점검체계` + `코딩관리지침(CDMP)` §19 | 마스터 버전표 → 참고자료 표 → SKILL.md 순서로 점검 |
| **배포 전 점검** | `코딩관리지침(CDMP)` 부록 A | 6종 체크리스트 (개발·교육·시각화·문서화·품질·배포) |
| **복잡한 프로젝트** 작업 시작 전 | `워크플로우(WF)` | Research→Plan→Draft→작업 4단계, 단계별 사용자 승인 필수 |

---

## 3. 강의자료 특칙

### 3.1 문서 작성 흐름

```
MD 작성 (내용 확정) → LaTeX/Beamer 변환 (형식 적용)
```

- 강의교재: LaTeX article, **28~32쪽**, 그림 풍부
- 강의노트: Markdown, **13~17쪽**, 순수 수업 내용만
- 강의슬라이드: Beamer, 밝은톤, 텍스트박스 선두께 0.5pt, 그림 중심

### 3.2 그림 처리

- **우선순위**: ①이전 강의교재 그림 → ②프로젝트 기존 그림 → ③시뮬레이터 코드 활용 → ④새로 생성
- **절차**: 그림 먼저 보여주고 확인 후 문서 작성
- **이미지 8단계**: 정합성검토 → 재사용검토 → 코드생성 → 웹검색 → 유니코드다이어그램/프롬프트 → SVG제작 → 한글확인 → 수정vs새로만들기

### 3.3 용어

| 용어 | 의미 |
|------|------|
| 발표자료 | Beamer 형식 슬라이드 |
| 강의노트 | 교재형식 (article), Beamer 아님 |

### 3.4 발표자료 스타일

- 표 첫행: 가운데 정렬 + 옅은 배경색
- 표 첫열 글자색: 다른 열과 통일
- 표지 제목: 배경과 보색 + 진하게
- 텍스트박스 제목: 배경보다 어두운 색

---

## 4. 이미지 수정 원칙

- 지시받은 것만 수정, 새로 그리거나 다른 요소 건드리지 않기
- 이미지 복원 요청 시 기존 이미지 사용
- 새로 그리라는 지시 없으면 원본에서 문제 부분만 수정
- 재사용 후보 2개 이상이면 사용자에게 제시 후 결정
- 새로 생성 시 **구성 계획(프롬프트)을 먼저 제시** → 확인 후 생성

---

## 5. 사물인터넷과빅데이터 강좌 정보

### 5.1 1주차 자료 구분

- **강의자료**: LED이름표시시뮬레이터
- **참고자료**: 센서시뮬레이터v9, 검색도구, 데이터로거, I2C다이어그램, 집중도시뮬레이터

### 5.2 바이브코딩 강좌 평가

- 주간과제 65% (주당 5% × 13주)
- 피어평가 5% (15주차)
- 최종프로젝트 30% (시뮬레이터 15% + 지도안 15%)
- 제출물: HTML, 개발일지PDF, 대화목록PDF
- 매주 일요일 자정까지 LMS 제출

---

## 6. 문서 체계 맵

```
교육용 시뮬레이터 프로젝트 문서 체계
│
├── [Policy] — 전체 강제, 운영 원칙
│   ├── VMP  버전관리지침(VMP)       v1.3.1.0 ─ 버전 체계, 파일명, 세션 인계
│   └── DMPP 문서관리지침(DMPP)      v2.3.0.1 ─ 협업 원칙, 이미지 8단계, 코드 리뷰 7단계
│
├── [Procedure] — 해당 작업 시 강제, 수행 절차
│   ├── DAP  문서작성지침서(DAP)      v1.14.0.2 ─ LaTeX/Beamer/Pandoc 기술 규칙, 강의자료 절차
│   ├── CDMP 코딩관리지침(CDMP)      v4.0.0.2 ─ 리팩토링 9패턴, SVG, 문서화 6종 템플릿, 체크리스트
│   └── WF   워크플로우(WF)          v1.0.0.0 ─ 복잡한 프로젝트 4단계 절차 (Research→Plan→Draft→작업)
│
└── [Standard] — 코드 품질 기준선, L1→L2→L3 계층 상속
    ├── GCS-L1  범용코딩표준(GCS-L1)              v1.0.0.2 ─ 모든 프로젝트 공통
    └── SCS-L2  시뮬레이터코딩표준(SCS-L2)        v1.0.0.2 ─ 시뮬레이터 공통
        ├── MLSCS-L3  ML시뮬레이터코딩표준        v1.0.0.2
        ├── IOTSCS-L3 IoT시뮬레이터코딩표준       v0.2.0.1
        └── ECSCS-L3  초등교과시뮬레이터코딩표준  v1.0.0.2
```

> **Standard vs Procedure 역할 구분**
> - Standard(GCS·SCS·L3): 신규 작성 시 "목표 상태(What)" 정의
> - CDMP(코딩관리지침): 기존 코드 변경·확장 시 "수행 절차(How)" 정의

---

## 7. 작업 시작 체크리스트

모든 작업을 시작하기 전에 확인:

0. **복잡한 프로젝트인가?** → 복잡성 판단 기준(WF §적용기준) 2개 이상 해당 시 `워크플로우(WF)` 4단계 절차 먼저 수행
1. **어떤 유형의 작업인가?** → §2 트리거 맵에서 참조 문서 확인
2. **해당 지침 문서를 프로젝트 지식에서 검색했는가?**
3. **버전 체계를 적용했는가?** (vX.Y.Z.W, 파일명 형식)
4. **산출물에 참고자료 + 생성/수정 이력이 포함되었는가?**
5. **최종 검토를 수행했는가?** (무의식적 반응 금지)

### 7.1 표준화 문서 수정 후 추가 체크

표준화 관련 문서를 수정한 경우:

6. **§1.1.1 교차 검증을 수정 사항 0건까지 반복 실행했는가?**
7. **SKILL.md §6 체계 맵 버전을 동기화했는가?**
8. **문서정합성점검체계 §2 마스터 버전표를 갱신했는가?**

---

## 참고자료

| # | 자료명 (약어) | 버전 | 유형 | 역할 |
|:-:|--------------|------|:----:|------|
| 1 | 버전관리지침 (VMP) | v1.3.1.0 | Policy | 버전 체계, 파일명, 세션 인계 |
| 2 | 문서관리지침 (DMPP) | v2.3.0.1 | Policy & Procedure | 협업 원칙, 이미지 관리, 코드 리뷰 |
| 3 | 코딩관리지침 (CDMP) | v4.0.0.2 | Procedure | 리팩토링, SVG, 문서화, 품질 점검 |
| 4 | 문서작성지침서 (DAP) | v1.14.0.2 | Procedure | LaTeX/Beamer/Pandoc 기술 지침 |
| 5 | 워크플로우 (WF) | v1.0.0.0 | Procedure | 복잡한 프로젝트 4단계 작업 절차 |
| 6 | 범용코딩표준 (GCS-L1) | v1.0.0.2 | Standard L1 | 모든 프로젝트 공통 |
| 7 | 시뮬레이터코딩표준 (SCS-L2) | v1.0.0.2 | Standard L2 | 시뮬레이터 공통 |
| 8 | ML시뮬레이터코딩표준 (MLSCS-L3) | v1.0.0.2 | Standard L3 | ML 특화 |
| 9 | IoT시뮬레이터코딩표준 (IOTSCS-L3) | v0.2.0.1 | Standard L3 | IoT 특화 |
| 10 | 초등교과시뮬레이터코딩표준 (ECSCS-L3) | v1.0.0.2 | Standard L3 | 초등교과 특화 |

## 생성/수정 이력

| 버전 | 날짜 | 시간 | 변경 수준 | 변경 내용 | 작성자 |
|------|------|------|-----------|-----------|--------|
| v1.0.0.0 | 2026-02-20 | — | 최초 | 14개 지침 문서에서 핵심 규칙·트리거 맵 추출하여 SKILL.md 초안 작성 | Claude |
| v1.1.0.0 | 2026-02-21 | — | 마이너 | §6 문서 체계 맵 전면 개편: Policy·Procedure·Standard 3계층 분류 체계 반영, 영문명·약어(VMP/DMPP/DAP/CDMP/GCS-L1/SCS-L2/MLSCS-L3/IOTSCS-L3/ECSCS-L3) 병기, 실제 버전 동기화. 참고자료 표 유형 열 추가. Standard vs Procedure 역할 구분 설명 추가 | Changmo Yang & Claude AI |
| v1.1.1.0 | 2026-02-21 | — | 리비전 | IOTSCS-L3 버전 v0.1.0.1→v0.2.0.0 동기화, ⚠️Draft 표기 해제 (§7 유형별 가이드 완성으로 정식 Standard 승격) | Changmo Yang & Claude AI |
| v1.2.0.0 | 2026-02-22 | — | 마이너 | 2차 정합성 검증 반영: 참고자료 버전 전면 동기화(CDMP v4.0.0.2, DAP v1.14.0.2, GCS-L1 v1.0.0.2, SCS-L2 v1.0.0.2, MLSCS-L3 v1.0.0.2, IOTSCS-L3 v0.2.0.1, ECSCS-L3 v1.0.0.2). §6 문서 체계 맵 버전 동기화 | Changmo Yang & Claude AI |
| v1.3.0.0 | 2026-02-22 | — | 마이너 | §1.1.1 교차 검증 절차를 실제 동작하는 완전한 Python 스크립트로 교체. FILE_CODE 매핑, SCS-L2 오탐지 방지, 참고자료 자동 수정 로직 포함. §7.1 체크리스트 추가 | Changmo Yang & Claude AI |
| v1.3.1.0 | 2026-03-02 | — | 리비전 | WF(워크플로우) 신규 등록: §2.4 트리거 맵 행 추가, §6 문서 체계 맵 Procedure 섹션 등록(v1.0.0.0), §7 체크리스트 0번 항목 추가(복잡성 판단), 참고자료 표 #5 WF 추가 | Changmo Yang & Claude AI |
