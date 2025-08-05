# JavaScript Utilities Collection

## 📋 개요

UI 및 데이터 처리를 위한 통일된 스타일의 JavaScript 유틸리티 모음입니다. 모든 유틸리티는 IIFE(즉시실행함수) + 객체 리터럴 패턴을 사용하여 일관성을 유지합니다.

## 🎨 **코딩 스타일 특징**

- **IIFE 패턴**: `(function(global) { ... })(this)` 구조 사용
- **객체 리터럴**: ES6 클래스 대신 전통적인 객체 리터럴 방식
- **function 키워드**: 화살표 함수 대신 전통적인 함수 선언
- **jQuery 확장**: `$.http`, `$.payload` 형태로 일관성 있는 접근
- **호환성**: 구형 브라우저에서도 안전하게 동작
- **네임스페이스**: 동일한 글로벌/모듈 등록 방식

## 🔧 유틸리티 목록

### 1. ChatBox Plugin (jQuery Plugin)
채팅박스 기능을 제공하는 jQuery 플러그인

**주요 기능:**
1. **메시지 출력**
   - 요청 메시지 출력
   - 응답 메시지 출력 (그룹화 지원)
   - 에러 메시지 출력
   - 스트리밍 응답 지원

2. **JSON 데이터 처리**
   - JSON 데이터 포맷팅 및 표시
   - 구문 강조 (Syntax Highlighting)
   - 접기/펼치기 기능

3. **캐시 관리 UI**
   - 캐시 상태 표시
   - 시간 정보 표시
   - 단일 라인 UI

4. **자동 스크롤**
   - 새 메시지 시 자동 스크롤
   - 스크롤 위치 제어

**사용법:**
```javascript
$('#chatBox').chatBox({
    height: '450px',
    autoScroll: true
});

// 메시지 추가
$('#chatBox').chatBox('addRequestMessage', messageData);
$('#chatBox').chatBox('addResponseMessage', messageData);
```

---

### 2. Ajax-Util (HttpUtil) - Utility Object
RESTful HTTP 요청을 간편하게 처리하는 유틸리티 객체

**주요 기능:**
1. **RESTful API 지원**
   - GET, POST, PUT, PATCH, DELETE 메서드
   - 표준 HTTP 상태 코드 처리
   - Content-Type 자동 설정

2. **로딩 오버레이**
   - 요청 중 로딩 표시
   - 중복 요청 방지
   - 카운터 기반 관리

3. **에러 처리**
   - 표준화된 에러 응답
   - 네트워크 에러 핸들링
   - 타임아웃 처리

4. **요청/응답 로깅**
   - 개발 모드 디버깅
   - 성능 모니터링

**사용법:**
```javascript
// jQuery 확장으로 사용
$.http.get('/api/data').then(function(response) {
    console.log(response);
});

// 직접 사용
HttpUtil.post('/api/save', { data: 'value' });
```

---

### 3. TabFormSync - Constructor Function
탭 메뉴와 입력 폼 동기화를 관리하는 생성자 함수

**핵심 기능:**
1. **실제 데이터 구조 지원**
   - id, name, description, first_ref_text 필드
   - display ordering (first_ref_text 기준 정렬)
   - 제외 메뉴 필터링

2. **데이터 로드 방식**
   - API 엔드포인트에서 동적 로드
   - 로컬 데이터 직접 사용
   - 기본 데이터 폴백

3. **동적 탭 메뉴 생성**
   - 메뉴 데이터 기반 자동 탭 생성
   - 정렬 및 필터링 적용
   - 탭 활성화/비활성화 상태 관리

4. **동적 입력 폼 생성**
   - 메뉴별 특화된 폼 구성
   - 다양한 입력 요소 (select, textarea, input)
   - 폼 검증 및 이벤트 처리

5. **페이로드 생성**
   - UI 데이터를 구조화된 페이로드로 변환
   - 메뉴 정보 및 타임스탬프 포함
   - PayloadFactory와 연동

**사용법:**
```javascript
// API 기반 사용
var tabFormSync = new TabFormSync({
    apiEndpoint: '/api/menu/list',
    tabContainer: '#tabContainer',
    formContainer: '#formContainer',
    tabChanged: function(data) {
        console.log('탭 변경:', data.menuName);
    }
});

// 로컬 데이터 사용
var tabFormSync = new TabFormSync({
    menuData: localMenuData,
    tabContainer: '#tabContainer',
    formContainer: '#formContainer'
});

// 페이로드 생성
var payload = tabFormSync.generatePayload();
```

---

### 4. PayloadFactory - Utility Object
UI 데이터를 서버 통신용 메시지로 변환하는 팩토리 유틸리티

**핵심 기능:**
1. **메시지 변환**
   - TabFormSync UI 페이로드 → 서버 메시지 포맷
   - 메뉴별 특화된 body 구조 생성
   - 공통 헤더 및 옵션 설정

2. **메뉴별 특화 처리**
   - 상품요약 (2001): 상품 선택 기반 필터
   - 상품비교 (2002): 소스/타겟 상품 비교
   - 상품상세 (2004): 자유 질문 형태
   - T카드요약 (2006): 카드 코드 기반 필터

3. **메시지 검증**
   - 필수 필드 검증
   - 구조 유효성 검사
   - 경고 및 에러 분류

4. **디버깅 지원**
   - 메시지 구조 시각화
   - 크기 및 성능 정보
   - 검증 결과 표시

5. **유틸리티 메서드**
   - 메시지 복사/병합
   - 빠른 메시지 생성
   - 설정 관리

**사용법:**
```javascript
// jQuery 확장으로 사용
var serverMessage = $.payload.createServerMessage(uiPayload, options);

// 직접 사용
var serverMessage = PayloadFactory.createServerMessage(uiPayload, {
    userId: 'testuser',
    bodyType: 'chat'
});

// 검증
var validation = PayloadFactory.validateMessage(serverMessage);

// 디버깅
PayloadFactory.debugMessage(serverMessage);
```

### 4. PayloadFactory
페이로드 생성 및 관리를 위한 팩토리 클래스

**주요 기능:**
- 폼 데이터를 API 페이로드로 변환
- 페이로드 검증
- 다양한 포맷 지원 (JSON, FormData, URL-encoded)
- 커스텀 변환 규칙 적용

**사용법:**
```javascript
const payload = PayloadFactory.create('json', formData, {
    validation: true,
    transform: customTransformRules
});
```

---

### 5. MessageFactory
메시지 생성 및 포맷팅을 위한 팩토리 클래스

**주요 기능:**
- 다양한 메시지 타입 생성
- 메시지 템플릿 관리
- 국제화(i18n) 지원
- 동적 파라미터 바인딩

**사용법:**
```javascript
const message = MessageFactory.create('success', {
    template: 'DATA_SAVED',
    params: { count: 5 }
});
```

## 📁 파일 구조

```
jquery-plugins/
├── chatbox/
│   ├── jquery.chatbox.js
│   └── chatbox.css
├── httputil/
│   └── jquery.httputil.js
├── tabformsync/
│   ├── TabFormSync.js
│   └── MessageSender.js
├── factories/
│   ├── PayloadFactory.js
│   └── MessageFactory.js
└── README.md
```

## 🚀 설치 및 사용

### 의존성
- jQuery 3.6.0 이상

### 기본 설정
```html
<!-- jQuery -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<!-- 플러그인 로드 -->
<script src="path/to/jquery.chatbox.js"></script>
<script src="path/to/jquery.httputil.js"></script>
<script src="path/to/TabFormSync.js"></script>
<script src="path/to/PayloadFactory.js"></script>
<script src="path/to/MessageFactory.js"></script>

<!-- CSS (필요한 경우) -->
<link rel="stylesheet" href="path/to/chatbox.css">
```

## 📚 상세 문서

각 플러그인의 상세한 사용법과 옵션은 개별 문서를 참조하세요:

- [ChatBox Plugin 가이드](./chatbox/README.md)
- [HttpUtil Plugin 가이드](./httputil/README.md)
- [TabFormSync Plugin 가이드](./tabformsync/README.md)
- [PayloadFactory 가이드](./factories/PayloadFactory.md)
- [MessageFactory 가이드](./factories/MessageFactory.md)

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이센스

이 프로젝트는 MIT 라이센스로 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 🏷️ 버전 정보

- **v1.0.0** - 초기 릴리스
  - ChatBox Plugin
  - HttpUtil Plugin
  - TabFormSync Plugin
  - PayloadFactory
  - MessageFactory

## 📞 지원

문제가 발생하거나 질문이 있으시면 [Issues](https://github.com/jaehoosu/ai-chat/issues)에 등록해주세요.
