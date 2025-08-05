# jQuery Plugins Collection

## 📋 개요

다양한 UI 및 데이터 처리 기능을 제공하는 jQuery 플러그인 모음입니다.

## 🔧 플러그인 목록

### 1. ChatBox Plugin
채팅박스 기능을 제공하는 jQuery 플러그인

**주요 기능:**
- 요청 메시지 출력
- 응답 메시지 출력 (그룹화 지원)
- 에러 메시지 출력
- 스트리밍 응답 지원
- 메시지 초기화
- JSON 데이터 포맷팅 및 표시
- 캐시 관리 UI

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

### 2. HttpUtil Plugin (Ajax-Util)
HTTP 요청을 간편하게 처리하는 유틸리티 플러그인

**주요 기능:**
1. **RESTful API 호출 지원**
   - GET, POST, PUT, PATCH, DELETE 메서드 제공
   - Promise 기반 비동기 처리
   - async/await 및 .then() 체이닝 지원

2. **자동 로딩 화면 관리**
   - 내장 로딩 오버레이 제공
   - 다중 요청 시 로딩 카운터 관리
   - 커스텀 로딩 함수 지원

3. **요청/응답 처리**
   - JSON 자동 직렬화/역직렬화
   - 타임아웃 관리 (기본 30초)
   - 에러 처리 및 상태 관리

4. **설정 및 확장성**
   - 글로벌 기본 설정 제공
   - 요청별 옵션 오버라이드
   - 기존 jQuery.ajax 콜백과 호환

**사용법:**
```javascript
// 기본 GET 요청
$.http.get('/api/users')
    .then(response => console.log(response))
    .catch(error => console.error(error));

// async/await 사용
try {
    const data = await $.http.get('/api/users');
    console.log(data);
} catch (error) {
    console.error(error);
}

// POST 요청 (데이터 포함)
$.http.post('/api/users', {
    name: '홍길동',
    email: 'hong@example.com'
}).then(response => {
    console.log('사용자 생성 완료:', response);
});

// 로딩 화면 비활성화
$.http.get('/api/data', { showLoading: false });

// 커스텀 로딩 함수
$.http.post('/api/save', data, {
    loading: () => $('#mySpinner').show(),
    unloading: () => $('#mySpinner').hide()
});

// 기타 HTTP 메서드
$.http.put('/api/users/1', updateData);
$.http.patch('/api/users/1', partialData);
$.http.delete('/api/users/1');
```

**옵션 설정:**
```javascript
// 기본 요청 옵션
{
    type: 'GET',
    contentType: 'application/json;charset=UTF-8',
    dataType: 'json',
    timeout: 30000,
    showLoading: true
}

// 사용 가능한 추가 옵션
{
    loading: function() { /* 커스텀 로딩 시작 */ },
    unloading: function() { /* 커스텀 로딩 종료 */ },
    beforeSend: function(xhr) { /* 요청 전 처리 */ },
    complete: function(xhr, status) { /* 완료 후 처리 */ }
}
```

---

### 3. TabFormSync v2.0 Plugin
실제 데이터 구조 기반 탭 메뉴와 입력 폼 동기화 플러그인

**실제 데이터 구조:**
```javascript
// 메뉴 데이터 구조
{
    id: "2001",                    // 메뉴 ID
    name: "상품요약",               // 메뉴 이름  
    description: "상품요약정보를 요청합니다.",  // 설명
    first_ref_text: "0"            // 표시 순서 (0부터 순서대로, 음수면 제외)
}
```

**핵심 기능:**
1. **Display Ordering 시스템**
   - `first_ref_text` 값으로 화면 표시 순서 결정
   - 양수(0부터): 순서대로 화면에 표시
   - 음수: 화면에서 제외 (숨김)
   - 자동 정렬 및 필터링

2. **실제 API 연동**
   - RESTful API에서 메뉴 데이터 동적 로드
   - 실제 데이터 구조 기반 처리
   - 폴백 데이터 지원 (API 실패 시)

3. **동적 UI 생성**
   - 실제 메뉴 데이터 기반 탭 메뉴 자동 생성
   - 메뉴별 설명 표시
   - 폼 요소 동적 생성 및 검증

4. **고급 상태 관리**
   - 실시간 상태 모니터링
   - 자동 동기화 기능
   - 이벤트 기반 상호작용
   - 페이로드 생성 및 검증

**사용법:**
```javascript
// 기본 사용
const tabFormSync = new TabFormSync({
    tabContainer: '#dynamicTabMenu',
    formContainer: '#dynamicFormContainer', 
    currentMenuIdField: '#currentMenuIdField',
    apiEndpoint: '/api/menu/list',
    showLoading: true,
    
    // 이벤트 콜백
    tabChanged: function(data) {
        console.log('탭 변경:', data.menuName);
    },
    elementChanged: function(data) {
        console.log('요소 변경:', data.elementId);
    },
    autoSync: function(payload) {
        console.log('자동 동기화:', payload);
    }
});

// 상태 확인
const status = tabFormSync.getStatus();
console.log('현재 상태:', status);

// 페이로드 생성
const payload = tabFormSync.generatePayload();
console.log('페이로드:', payload);

// 자동 동기화 토글
const autoSyncEnabled = tabFormSync.toggleAutoSync();
```

**실제 데이터 예시:**
```javascript
// API 응답 데이터
[
    { id: "2001", name: "상품요약", description: "상품요약정보를 요청합니다.", first_ref_text: "0" },   // 1번째 표시
    { id: "2002", name: "상품비교", description: "상품비교정보를 요청합니다.", first_ref_text: "2" },   // 3번째 표시  
    { id: "2003", name: "상품태그", description: "상품태그정보를 요청합니다.", first_ref_text: "-3" }, // 제외됨
    { id: "2004", name: "상품상세", description: "상품상세정보를 요청합니다.", first_ref_text: "1" },   // 2번째 표시
    { id: "2006", name: "T카드요약", description: "T카드요약정보를 요청합니다.", first_ref_text: "3" } // 4번째 표시
]

// 결과: 2001 → 2004 → 2002 → 2006 순서로 표시, 2003은 제외
```

---

### 4. PayloadFactory
UI 데이터를 서버 통신용 메시지로 변환하는 팩토리 클래스

**핵심 기능:**
1. **UI → 서버 메시지 변환**
   - TabFormSync의 UI 페이로드를 서버 API 스펙에 맞게 변환
   - 메뉴별 특화된 메시지 body 생성
   - 표준 메시지 구조 (common, option, query) 지원

2. **서버 통신 표준 포맷**
   ```javascript
   // 생성되는 서버 메시지 구조
   {
       common: {
           iid: body_type,      // 메시지 타입
           user: user_id,       // 사용자 ID
           req: request_id,     // 요청 ID
           type: api_type       // API 타입
       },
       option: {
           cache: boolean,      // 캐시 사용 여부
           stream: boolean,     // 스트리밍 여부
           tags: array          // 태그 목록
       },
       query: {                // 실제 요청 내용
           action: string,
           message: string,
           filters: object
       }
   }
   ```

3. **메뉴별 메시지 변환**
   - 상품요약: 선택된 상품 정보를 서버 쿼리로 변환
   - 상품비교: 비교 대상 상품들을 서버 필터로 변환
   - 상품상세: 사용자 질문을 서버 메시지로 변환
   - T카드요약: 카드 정보를 서버 필터로 변환

4. **검증 및 디버깅**
   - 메시지 유효성 검증
   - 디버깅 정보 제공
   - 메시지 병합 및 복사 기능

**사용법:**
```javascript
// 기본 사용 (TabFormSync와 연동)
const uiPayload = tabFormSync.generatePayload();
const serverMessage = PayloadFactory.createServerMessage(uiPayload, {
    userId: 'user123',
    bodyType: 'chat',
    apiType: 'query',
    cache: true,
    stream: false,
    tags: ['urgent', 'product']
});

// 빠른 메시지 생성
const quickMessage = PayloadFactory.quickMessage('2001', formData, {
    userId: 'user123'
});

// 메시지 검증
const validation = PayloadFactory.validateMessage(serverMessage);
if (validation.isValid) {
    // HttpUtil로 서버 전송
    $.http.post('/api/chat', serverMessage)
        .then(response => console.log('성공:', response))
        .catch(error => console.error('실패:', error));
}

// 디버깅
PayloadFactory.debugMessage(serverMessage);
```

**TabFormSync와 통합 사용:**
```javascript
// 1. UI에서 데이터 수집
const uiPayload = tabFormSync.generatePayload();

// 2. 서버 메시지로 변환
const serverMessage = PayloadFactory.createServerMessage(uiPayload, {
    userId: getCurrentUserId(),
    cache: false,
    stream: true
});

// 3. 검증 후 서버 전송
const validation = PayloadFactory.validateMessage(serverMessage);
if (validation.isValid) {
    await $.http.post('/api/query', serverMessage);
}
```

**설정 관리:**
```javascript
// 전역 설정 업데이트
PayloadFactory.updateConfig({
    defaultUserId: 'production_user',
    defaultBodyType: 'chat',
    generateRequestId: () => 'custom_' + Date.now()
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
