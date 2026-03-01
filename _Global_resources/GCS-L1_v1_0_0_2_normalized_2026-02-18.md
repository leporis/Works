# 범용코딩표준 (General Coding Standard, GCS-L1)

**Claude가 코드를 작성·리뷰할 때 따르는 범용 표준**

**문서 버전: v1.0.0.2**

> **계층**: Level 1 (범용) → Level 2 (시뮬레이터 공통) → Level 3 (도메인 특화)
>
> **적용**: 모든 프로그래밍 언어 및 프로젝트 (JavaScript/TypeScript, Python, HTML/CSS 중심)
>
> **하위 문서**: 시뮬레이터코딩표준 (L2)

---

## 🎯 Claude의 역할별 작업 흐름

### 📝 코드 작성 시 (Code Generation)

```
1. 요구사항 분석
   └─> 프로젝트 컨텍스트 파악
   └─> 기존 코드 패턴 확인
   └─> 필요한 라이브러리/프레임워크 식별

2. 설계 결정
   └─> 함수/모듈 분리 계획
   └─> 네이밍 전략 수립
   └─> 에러 처리 전략 수립

3. 코드 작성
   └─> 핵심 원칙 적용
   └─> 명명 규칙 준수
   └─> 주석 추가 (Why 중심)

4. 자가 검증
   └─> 체크리스트 확인
   └─> 코드 예제 검토
   └─> 개선 여지 제안
```

### 🔍 코드 리뷰 시 (Code Review)

```
1. 1차 스캔 (구조적 문제)
   └─> 명명 규칙 위반
   └─> 중복 코드
   └─> 과도한 복잡도

2. 2차 분석 (품질 문제)
   └─> 에러 처리 누락
   └─> 성능 병목
   └─> 보안 취약점

3. 피드백 작성
   └─> 🔴 Critical (즉시 수정 필요)
   └─> 🟡 Important (권장)
   └─> 🟢 Nice-to-have (선택)

4. 개선 제안
   └─> Before/After 코드 예시
   └─> 이유 설명
   └─> 참고 자료 링크
```

---

## 📐 핵심 원칙 (Universal Principles)

### 원칙 1: 명확성 > 간결성 (Clarity over Brevity)

코드는 짧은 것보다 **이해하기 쉬운 것**이 우선입니다.

```javascript
// ❌ 간결하지만 불명확
const d = x.map(v => v * 2).filter(v => v > 10);

// ✅ 명확하고 이해하기 쉬움
const doubledValues = inputValues.map(value => value * 2);
const validValues = doubledValues.filter(value => value > 10);

// 또는 체이닝이 명확하다면
const validValues = inputValues
    .map(value => value * 2)
    .filter(value => value > 10);
```

**Claude의 행동**:
- ✅ 변수명을 풀어서 작성
- ✅ 중간 단계를 명시
- ❌ 과도한 one-liner 지양

---

### 원칙 2: 설정 중심 설계 (Configuration-Driven)

매직 넘버와 하드코딩된 값을 상수로 추출합니다.

> **CONFIG / UI_TEXT 분리 원칙**: 숫자·색상·타이밍은 `CONFIG`, 화면 표시 문자열은 `UI_TEXT`로 반드시 분리

```python
# ❌ 매직 넘버
def resize_image(img):
    return img.resize((800, 600))
    
def calculate_price(base):
    return base * 1.15  # 15%가 무엇?

# ✅ 설정으로 추출
# config.py
IMAGE_WIDTH = 800
IMAGE_HEIGHT = 600
TAX_RATE = 0.15

# main.py
def resize_image(img):
    return img.resize((IMAGE_WIDTH, IMAGE_HEIGHT))
    
def calculate_price(base):
    return base * (1 + TAX_RATE)
```

**Claude가 제안할 패턴**:
```javascript
// JavaScript - 숫자/색상/크기는 CONFIG
const CONFIG = {
    API_TIMEOUT: 5000,
    MAX_RETRIES: 3,
    PAGE_SIZE: 20
};

// JavaScript - 화면 표시 문자열은 UI_TEXT로 분리 (CONFIG와 혼용 금지)
const UI_TEXT = {
    // 상태 라벨
    STATUS_GOOD:  '✅ 정상',
    STATUS_ERROR: '❌ 오류',

    // 버튼 텍스트 (BTN_*) — 정적 초기값 + 동적 상태 변경용 모두 포함
    BTN_SUBMIT:      '제출',
    BTN_CLASSIFYING: '⏳ 분류 중...',   // 실행 중 비활성화 상태
    BTN_GENERATE:    '✨ 데이터 생성',

    // 에러 메시지
    ERROR_NO_DATA: '데이터를 먼저 입력해주세요.',

    // 슬라이더/선택지 레이블 배열
    LABELS: ['항목 1', '항목 2', '항목 3'],
};

// ✅ 동적 버튼 텍스트 변경 패턴
btn.textContent = UI_TEXT.BTN_CLASSIFYING;
btn.disabled = true;
// ... 작업 완료 후
btn.textContent = UI_TEXT.BTN_SUBMIT;
btn.disabled = false;
```

> **규칙**: `CONFIG`는 숫자·색상·크기·타이밍 상수만. 문자열은 반드시 `UI_TEXT`에.  
> **BTN_* 패턴**: 버튼 텍스트도 UI_TEXT에 포함. 실행 중/완료 두 상태를 별도 키로 관리.

```python
# Python
from dataclasses import dataclass

@dataclass(frozen=True)
class Config:
    API_TIMEOUT: int = 5000
    MAX_RETRIES: int = 3
    PAGE_SIZE: int = 20
```

---

### 원칙 3: 단일 책임 원칙 (Single Responsibility)

각 함수/클래스는 **하나의 명확한 책임**만 가집니다.

```javascript
// ❌ 여러 책임을 가진 함수
function processUserData(user) {
    // 1. 데이터 검증
    if (!user.email || !user.name) return null;
    
    // 2. 데이터 변환
    const normalized = {
        email: user.email.toLowerCase(),
        name: user.name.trim()
    };
    
    // 3. 데이터베이스 저장
    database.save(normalized);
    
    // 4. 이메일 발송
    sendWelcomeEmail(normalized.email);
    
    // 5. 로깅
    console.log('User processed:', normalized);
    
    return normalized;
}

// ✅ 책임을 분리
function validateUser(user) {
    if (!user.email || !user.name) {
        throw new Error('Invalid user data');
    }
}

function normalizeUser(user) {
    return {
        email: user.email.toLowerCase(),
        name: user.name.trim()
    };
}

function processUserData(user) {
    validateUser(user);
    const normalized = normalizeUser(user);
    
    saveUser(normalized);
    sendWelcomeEmail(normalized.email);
    logUserCreation(normalized);
    
    return normalized;
}
```

**함수 길이 가이드**:
- **이상적**: 10-20줄
- **허용**: 50줄 이하 (일반 로직)
- **예외 허용**: drawXxx(), initXxx() 등 시각화/초기화 함수는 80줄까지 허용
- **리팩터링 필요**: 일반 함수 50줄 초과, 시각화 함수 80줄 초과
- **기준 우선순위**: 줄 수보다 "한 가지 일만 하는가"가 더 중요

---

### 원칙 4: 조기 리턴 (Early Return)

중첩을 줄이고 가독성을 높입니다.

```python
# ❌ 깊은 중첩
def process_order(order):
    if order is not None:
        if order.is_valid():
            if order.has_stock():
                if order.user.has_credit():
                    # 실제 처리 로직
                    return process_payment(order)
                else:
                    return "No credit"
            else:
                return "Out of stock"
        else:
            return "Invalid order"
    else:
        return "Order is None"

# ✅ 조기 리턴
def process_order(order):
    if order is None:
        return "Order is None"
    
    if not order.is_valid():
        return "Invalid order"
    
    if not order.has_stock():
        return "Out of stock"
    
    if not order.user.has_credit():
        return "No credit"
    
    # 정상 로직은 들여쓰기 없이
    return process_payment(order)
```

---

### 원칙 5: 에러 처리 명시적 작성

에러는 숨기지 말고 명확하게 처리합니다.

```javascript
// ❌ 에러 무시
async function fetchData(url) {
    try {
        const response = await fetch(url);
        return response.json();
    } catch (e) {
        return null;  // 에러 정보 손실
    }
}

// ✅ 명시적 에러 처리
async function fetchData(url) {
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch data:', { url, error: error.message });
        throw error;  // 상위로 전파
    }
}

// 사용처에서 처리
try {
    const data = await fetchData(apiUrl);
    processData(data);
} catch (error) {
    showErrorToUser('데이터를 불러올 수 없습니다.');
}
```

---

## 📝 명명 규칙 (Naming Conventions)

### 언어별 컨벤션

#### JavaScript/TypeScript

```javascript
// 변수: camelCase
const userName = 'Alice';
const itemCount = 42;

// 상수: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';

// 함수: camelCase (동사로 시작)
function calculateTotal(items) { }
function fetchUserData(userId) { }

// 클래스: PascalCase
class UserRepository { }
class DataProcessor { }

// 불린: is/has/should/can 접두사
const isActive = true;
const hasPermission = false;
const shouldUpdate = true;
const canEdit = false;

// Private: _ 접두사 (컨벤션)
class Example {
    _privateMethod() { }
    publicMethod() { }
}
```

#### Python

```python
# 변수/함수: snake_case
user_name = 'Alice'
item_count = 42

def calculate_total(items):
    pass

def fetch_user_data(user_id):
    pass

# 상수: UPPER_SNAKE_CASE
MAX_RETRY_COUNT = 3
API_BASE_URL = 'https://api.example.com'

# 클래스: PascalCase
class UserRepository:
    pass

class DataProcessor:
    pass

# Private: _ 접두사
class Example:
    def _private_method(self):
        pass
    
    def public_method(self):
        pass

# 불린: is/has/should/can 접두사
is_active = True
has_permission = False
should_update = True
can_edit = False
```

#### CSS

```css
/* 클래스: kebab-case (BEM 권장) */
.user-card { }
.user-card__title { }
.user-card__title--highlighted { }

/* ID: camelCase */
#mainContent { }
#userProfile { }

/* CSS 변수: kebab-case */
:root {
    --primary-color: #3498db;
    --spacing-large: 24px;
}
```

### 범용 네이밍 원칙

1. **의미 있는 이름**
   ```javascript
   // ❌
   const d = new Date();
   const arr = getData();
   
   // ✅
   const currentDate = new Date();
   const userList = getData();
   ```

2. **축약어 지양**
   ```javascript
   // ❌
   const usrCnt = getUserCount();
   const btnClk = () => {};
   
   // ✅
   const userCount = getUserCount();
   const handleButtonClick = () => {};
   
   // 예외: 일반적으로 알려진 약어는 허용
   const apiUrl = '...';  // API
   const htmlContent = '...';  // HTML
   const maxValue = 100;  // max
   ```

3. **동사 + 명사 패턴 (함수)**
   ```javascript
   // ✅ 좋은 함수명
   function getUserById(id) { }
   function calculateTotalPrice(items) { }
   function validateEmail(email) { }
   
   // 불린 반환 함수
   function isValidEmail(email) { }
   function hasPermission(user) { }
   function canEditPost(user, post) { }
   ```

---

## 🏗️ 코드 구조 (Code Organization)

### 파일/모듈 구성 원칙

```
프로젝트/
├── src/
│   ├── config/          # 설정 파일
│   │   ├── constants.js
│   │   └── env.js
│   ├── utils/           # 유틸리티 함수
│   │   ├── validation.js
│   │   └── formatting.js
│   ├── services/        # 비즈니스 로직
│   │   ├── userService.js
│   │   └── apiService.js
│   ├── components/      # UI 컴포넌트
│   └── index.js
└── tests/
```

### 파일 내부 구성 순서

```javascript
// 1. Imports
import React from 'react';
import { useState, useEffect } from 'react';
import { apiService } from './services/apiService';

// 2. Constants (파일 레벨)
const DEFAULT_PAGE_SIZE = 20;
const CACHE_DURATION = 5 * 60 * 1000; // 5분

// 3. Types/Interfaces (TypeScript)
interface User {
    id: string;
    name: string;
}

// 4. Main Component/Class/Functions
function UserList() {
    // 4a. State/Hooks
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // 4b. Effects
    useEffect(() => {
        fetchUsers();
    }, []);
    
    // 4c. Helper Functions
    const fetchUsers = async () => {
        // ...
    };
    
    // 4d. Render/Return
    return (
        // JSX
    );
}

// 5. Helper Functions (파일 레벨)
function formatUserName(user) {
    return `${user.firstName} ${user.lastName}`;
}

// 6. Export
export default UserList;
```

---

## ✅ 코드 작성 체크리스트

### Claude가 코드 작성 후 자가 검증할 항목

```markdown
### 📝 명명 (Naming)
- [ ] 변수명이 역할을 명확히 설명하는가?
- [ ] 함수명이 동사로 시작하는가?
- [ ] 불린 변수에 is/has/can 접두사가 있는가?
- [ ] 약어를 과도하게 사용하지 않았는가?

### 🏗️ 구조 (Structure)
- [ ] 함수가 50줄 이하인가?
- [ ] 각 함수가 단일 책임만 가지는가?
- [ ] 중복 코드가 3회 이상 반복되지 않는가?
- [ ] 중첩이 3단계를 초과하지 않는가?

### 🔧 로직 (Logic)
- [ ] 매직 넘버를 상수로 추출했는가?
- [ ] 조기 리턴을 사용하여 중첩을 줄였는가?
- [ ] 모든 에러 케이스를 처리했는가?
- [ ] 입력 검증을 수행하는가?

### 📚 문서화 (Documentation)
- [ ] 복잡한 로직에 Why 주석을 추가했는가?
- [ ] Public API에 JSDoc/docstring을 작성했는가?
- [ ] TODO/FIXME 태그를 적절히 사용했는가?

### ⚡ 성능 (Performance)
- [ ] 불필요한 반복/계산을 피했는가?
- [ ] 비동기 작업을 적절히 처리했는가?
- [ ] 리소스 정리 코드가 있는가? (타이머, 리스너 등)

### 🔒 보안 (Security)
- [ ] 사용자 입력을 검증하는가?
- [ ] SQL Injection/XSS 방어가 되어 있는가?
- [ ] 민감한 정보가 로그에 남지 않는가?
```

---

## 🔍 코드 리뷰 체크리스트

### Claude가 코드 리뷰 시 확인할 항목

#### 🔴 Critical (즉시 수정 필요)

```markdown
- [ ] **보안 취약점**: SQL Injection, XSS, 인증/인가 누락
- [ ] **메모리 누수**: 이벤트 리스너 미정리, 타이머 미정리
- [ ] **데이터 손실 가능성**: 에러 처리 누락, 트랜잭션 미사용
- [ ] **무한 루프**: 종료 조건 없음, 재귀 깊이 제한 없음
- [ ] **타입 오류**: null/undefined 체크 누락, 타입 불일치
```

**리뷰 예시**:
```markdown
🔴 **Critical**: 메모리 누수 위험

**문제**:
```javascript
useEffect(() => {
    const interval = setInterval(fetchData, 1000);
}, []);
```

**이유**: interval이 정리되지 않아 컴포넌트 unmount 후에도 계속 실행됩니다.

**수정안**:
```javascript
useEffect(() => {
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);  // 정리 함수 추가
}, []);
```
```

#### 🟡 Important (강력 권장)

```markdown
- [ ] **명명 규칙 위반**: 일관성 없는 네이밍
- [ ] **중복 코드**: DRY 원칙 위반 (3회 이상 반복)
- [ ] **과도한 복잡도**: 함수 50줄 초과, 중첩 3단계 초과
- [ ] **에러 처리 부족**: try-catch 없음, 에러 무시
- [ ] **성능 이슈**: O(n²) 이상, 불필요한 렌더링
```

#### 🟢 Nice-to-have (선택 사항)

```markdown
- [ ] **주석 추가**: 복잡한 로직 설명
- [ ] **테스트 코드**: 단위 테스트 추가
- [ ] **타입 안정성**: TypeScript 타입 추가
- [ ] **접근성**: ARIA 속성 추가
- [ ] **문서화**: README, API 문서 개선
```

---

## 💡 언어별 특화 가이드

### JavaScript/TypeScript

```javascript
// ✅ 모던 JavaScript 패턴

// 1. const/let 사용 (var 금지)
const userData = { name: 'Alice' };
let count = 0;

// 2. 화살표 함수 (적절히 사용)
const double = (x) => x * 2;
const users = data.map(item => ({
    id: item.id,
    name: item.name
}));

// 3. 구조 분해
const { name, age } = user;
const [first, ...rest] = array;

// 4. 스프레드 연산자
const newUser = { ...user, age: 25 };
const newArray = [...oldArray, newItem];

// 5. 옵셔널 체이닝
const userName = user?.profile?.name ?? 'Unknown';

// 6. async/await (Promise 체이닝보다 선호)
async function fetchUserData(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Fetch failed:', error);
        throw error;
    }
}

// 7. 템플릿 리터럴
const message = `Hello, ${user.name}! You have ${count} messages.`;
```

### Python

```python
# ✅ Pythonic 패턴

# 1. List comprehension
squares = [x**2 for x in range(10)]
even_squares = [x**2 for x in range(10) if x % 2 == 0]

# 2. Context managers
with open('file.txt', 'r') as f:
    content = f.read()

# 3. Enumerate
for index, item in enumerate(items):
    print(f"{index}: {item}")

# 4. f-strings (Python 3.6+)
message = f"Hello, {user.name}! You have {count} messages."

# 5. Type hints
def calculate_total(items: list[dict]) -> float:
    return sum(item['price'] for item in items)

# 6. Dataclasses (Python 3.7+)
from dataclasses import dataclass

@dataclass
class User:
    id: int
    name: str
    email: str

# 7. 예외 처리
try:
    result = risky_operation()
except SpecificError as e:
    logger.error(f"Operation failed: {e}")
    raise
finally:
    cleanup()
```

### CSS

```css
/* ✅ 모던 CSS 패턴 */

/* 1. CSS Variables — 2단계 계층 구조 (필수) */
:root {
    /* ===== 1단계: 기본 팔레트 (수정 금지, 값만 정의) ===== */
    --color-blue-500: #2196F3;
    --color-green-500: #43A047;
    --color-red-500: #E53935;

    /* ===== 2단계: 의미적 별칭 (여기서만 수정하여 테마 변경) ===== */
    --primary: var(--color-blue-500);
    --success: var(--color-green-500);
    --danger:  var(--color-red-500);

    /* ===== 간격 시스템 ===== */
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;

    /* ===== 폰트 크기 ===== */
    --font-sm: 0.8rem;
    --font-md: 1rem;
    --font-lg: 1.2rem;
}

/* 규칙: 코드에서는 반드시 2단계 별칭(--primary)을 사용. 1단계 팔레트(--color-blue-500) 직접 사용 금지 */
.button {
    background: var(--primary);       /* ✅ 의미적 별칭 사용 */
    /* background: var(--color-blue-500); ❌ 팔레트 직접 사용 금지 */
}

/* 2. 숨김 클래스 — 두 종류 구분 (필수) */
.hidden           { display: none !important; }  /* JS로 동적 토글: classList.toggle('hidden') */
.initially-hidden { display: none; }             /* 초기 렌더링 숨김: JS에서 style.display로 해제 */

/* 사용 패턴:
   - .hidden: JS에서 반복적으로 보이기/숨기기
   - .initially-hidden: 처음엔 숨겨두었다가 조건 충족 시 한 번만 보이기
     element.classList.remove('initially-hidden'); element.style.display = 'block'; */

/* 3. Flexbox/Grid */
.container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-md);
}

/* 4. 미디어 쿼리 */
@media (max-width: 768px) {
    .container {
        grid-template-columns: 1fr;
    }
}

/* 5. CSS 애니메이션 */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.element {
    animation: fadeIn 0.3s ease-in;
}
```

---

## 🎨 주석 작성 가이드

### 좋은 주석 vs 나쁜 주석

```javascript
// ❌ 나쁜 주석: What을 설명 (코드가 이미 설명함)
// i를 1씩 증가시킨다
i++;

// 사용자 이름을 가져온다
const name = user.getName();

// ✅ 좋은 주석: Why를 설명
// 유클리드 거리가 아닌 맨해튼 거리를 사용하는 이유:
// 고차원 데이터에서 차원의 저주를 완화하고 계산 비용 절감
const distance = calculateManhattanDistance(p1, p2);

// TODO: Redis 캐시 추가 (현재는 메모리 캐시만 사용)
const cachedData = memoryCache.get(key);

// HACK: IE11 버그 우회 - Array.from 대신 스프레드 사용
const array = [...nodeList];

// FIXME: race condition 가능성 - 트랜잭션으로 변경 필요
await updateUserCount();
await updateTotalCount();
```

### JSDoc/Docstring 작성

```javascript
/**
 * 사용자 ID로 사용자 정보를 조회합니다.
 * 
 * @param {string} userId - 조회할 사용자의 ID
 * @param {Object} options - 조회 옵션
 * @param {boolean} options.includeDeleted - 삭제된 사용자 포함 여부
 * @returns {Promise<User|null>} 사용자 객체 또는 null (없을 경우)
 * @throws {ValidationError} userId가 유효하지 않을 경우
 * @throws {NetworkError} API 호출 실패 시
 * 
 * @example
 * const user = await getUserById('user123', { includeDeleted: false });
 */
async function getUserById(userId, options = {}) {
    // ...
}
```

```python
def calculate_distance(point1: tuple, point2: tuple, method: str = 'euclidean') -> float:
    """
    두 점 사이의 거리를 계산합니다.
    
    Args:
        point1: 첫 번째 점의 좌표 (x, y)
        point2: 두 번째 점의 좌표 (x, y)
        method: 거리 계산 방법 ('euclidean' 또는 'manhattan')
    
    Returns:
        계산된 거리 값
    
    Raises:
        ValueError: method가 지원되지 않는 값일 경우
        
    Example:
        >>> calculate_distance((0, 0), (3, 4), 'euclidean')
        5.0
    """
    # ...
```

---

## 🚨 자주 발생하는 안티패턴

### 1. 신뢰할 수 없는 입력 처리

```javascript
// ❌ 검증 없이 사용
function updateUser(userId, data) {
    database.update(userId, data);  // SQL Injection 위험
}

// ✅ 입력 검증
function updateUser(userId, data) {
    if (!isValidUUID(userId)) {
        throw new ValidationError('Invalid user ID');
    }
    
    const sanitized = sanitizeUserData(data);
    database.update(userId, sanitized);
}
```

### 2. 동기/비동기 혼용

```javascript
// ❌ 비동기를 동기처럼 사용
function getData() {
    let result;
    fetch('/api/data').then(data => {
        result = data;
    });
    return result;  // undefined 반환
}

// ✅ 명시적 비동기 처리
async function getData() {
    const response = await fetch('/api/data');
    return await response.json();
}
```

### 3. 에러 삼키기

```javascript
// ❌ 에러 무시
try {
    processData();
} catch (e) {
    // 아무것도 안 함
}

// ✅ 적절한 에러 처리
try {
    processData();
} catch (error) {
    logger.error('Data processing failed:', error);
    notifyAdmin(error);
    throw new ProcessingError('Failed to process data', { cause: error });
}
```

### 4. 전역 상태 남용

```javascript
// ❌ 전역 변수 과다 사용
let currentUser;
let isLoggedIn;
let userData;

function login(user) {
    currentUser = user;
    isLoggedIn = true;
    userData = fetchUserData(user.id);
}

// ✅ 상태 캡슐화
class AuthState {
    #currentUser = null;
    
    login(user) {
        this.#currentUser = user;
        this.#notifyListeners();
    }
    
    get isLoggedIn() {
        return this.#currentUser !== null;
    }
}

const auth = new AuthState();
```

### 5. 여러 진입점의 중복 후처리 (finishXxx 패턴 활용)

```javascript
// ❌ 각 로드 경로마다 후처리 중복
function loadFromDataset() {
    data = generateData();
    updateLegend(); drawChart(); resetState(); // 중복
}
function loadFromCSV() {
    data = parseCSV(file);
    updateLegend(); drawChart(); resetState(); // 중복
}

// ✅ 공통 후처리를 finishXxx()로 집중
function loadFromDataset() { data = generateData(); finishDataLoad(); }
function loadFromCSV()     { data = parseCSV(file);  finishDataLoad(); }

function finishDataLoad() {  // 공통 종착점
    resetState();
    updateLegend();
    drawChart();
    document.getElementById('resultPanel').style.display = 'none';
}
```

---

## 📊 복잡도 관리

### Cyclomatic Complexity 기준

```
1-5:   단순 (Simple)          ✅ 이상적
6-10:  보통 (Moderate)         ✅ 허용
11-20: 복잡 (Complex)          🟡 리팩터링 고려
21+:   매우 복잡 (Very Complex) 🔴 즉시 리팩터링
```

```javascript
// ❌ 높은 복잡도 (CC = 15)
function processOrder(order) {
    if (order.type === 'online') {
        if (order.payment === 'card') {
            if (order.amount > 1000) {
                if (order.user.isPremium) {
                    // ...
                } else {
                    // ...
                }
            } else {
                // ...
            }
        } else if (order.payment === 'paypal') {
            // ...
        }
    } else if (order.type === 'offline') {
        // ...
    }
}

// ✅ 낮은 복잡도 (CC = 3)
function processOrder(order) {
    const processor = getOrderProcessor(order);
    return processor.process(order);
}

function getOrderProcessor(order) {
    if (order.type === 'online') {
        return new OnlineOrderProcessor();
    }
    return new OfflineOrderProcessor();
}
```

---

## 🎯 Claude의 최종 출력 형식

### 코드 작성 시

```markdown
[생성된 코드]

---

### ✅ 자가 검증 체크리스트
- [x] 명명 규칙 준수
- [x] 함수 50줄 이하
- [x] 에러 처리 포함
- [ ] 테스트 코드 (사용자 요청 시)

### 💡 설계 결정 사항
- 상수 추출: MAX_RETRY_COUNT, API_TIMEOUT
- 함수 분리: validateInput(), processData(), formatOutput()
- 에러 처리: try-catch + 조기 리턴

### 🔄 개선 가능 부분
- 추후 Redis 캐시 추가 고려
- 테스트 커버리지 확보 필요
```

### 코드 리뷰 시

```markdown
## 코드 리뷰 결과

### 🔴 Critical (즉시 수정 필요)
1. **메모리 누수 위험** (Line 45)
   - 문제: 이벤트 리스너 미정리
   - 수정: cleanup 함수 추가
   ```javascript
   // Before
   element.addEventListener('click', handler);
   
   // After
   element.addEventListener('click', handler);
   return () => element.removeEventListener('click', handler);
   ```

### 🟡 Important (강력 권장)
2. **중복 코드** (Line 12, 34, 67)
   - 문제: 동일한 검증 로직 3회 반복
   - 수정: validateUser() 함수로 추출

### 🟢 Nice-to-have
3. **타입 안정성** 
   - TypeScript 인터페이스 추가 고려

---

### 📊 종합 평가
- 전체 품질: ⭐⭐⭐⭐☆ (4/5)
- Critical 이슈: 1개
- Important 이슈: 3개
```

---

## 참고자료

| # | 자료명 | 유형 | 비고 |
|:-:|--------|------|------|
| 1 | 버전관리지침(VMP)_v1.3.1.0 | 프로젝트 문서 | 버전 체계, 파일명, 세션 인계, 필수 구성요소 |
| 2 | 문서관리지침(DMPP)_v2.3.0.1 | 프로젝트 문서 | 협업 원칙, 이미지 관리, 코드 리뷰 프로세스 |
| 3 | 시뮬레이터코딩표준(SCS-L2)_v1.0.0.2 | 프로젝트 문서 | 시뮬레이터 특화 코딩 표준 (하위 문서) |
| 4 | Airbnb JavaScript Style Guide | 외부 자료 | https://github.com/airbnb/javascript |
| 5 | Google Python Style Guide | 외부 자료 | https://google.github.io/styleguide/pyguide.html |
| 6 | Clean Code (Robert C. Martin) | 서적 | 클린 코드 원칙 |

---

## 생성/수정 이력

| 버전 | 날짜 | 시간 | 변경 수준 | 변경 내용 | 작성자 |
|------|------|------|-----------|-----------|--------|
| v1.0.0.0 | 2026-02-18 | — | 최초 | 기존 coding-standards-for-claude.md를 프로젝트 형식으로 정규화. 안티패턴 6~7(raw 배열 저장, Canvas ctx.save/restore)을 L2로 이동 | Claude |
| v1.0.0.1 | 2026-02-22 | — | 패치 | 정합성 점검: 참고자료 버전 동기화 — VMP v1.3.0→v1.3.1.0, DMPP v2.1.x→v2.3.0.1, IOTSCS-L3 버전 수정. 영문명 약어 병기 | Changmo Yang & Claude AI |
| v1.0.0.1 | 2026-02-21 | — | 패치 | 영문명 병기 (General Coding Standard, GCS-L1) | Changmo Yang & Claude AI |
| v1.0.0.2 | 2026-02-22 | — | 패치 | 2차 정합성 검증: 참고자료 버전 전면 동기화 — VMP v1.3.1.0, DMPP v2.3.0.1, CDMP v4.0.0.1, GCS-L1 v1.0.0.1, SCS-L2 v1.0.0.1, MLSCS-L3 v1.0.0.1, ECSCS-L3 v1.0.0.1. 영문명 약어 전면 병기 | Changmo Yang & Claude AI |

---

*범용코딩표준 (General Coding Standard, GCS-L1) — 모든 프로그래밍 언어에 적용하는 코드 작성·리뷰 표준*