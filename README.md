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

### 2. HttpUtil Plugin
HTTP 요청을 간편하게 처리하는 유틸리티 플러그인

**주요 기능:**
- RESTful API 호출 지원
- 요청/응답 로깅
- 에러 처리
- 인터셉터 지원
- 요청 타임아웃 관리

**사용법:**
```javascript
$.httpUtil.get('/api/data')
    .then(response => console.log(response))
    .catch(error => console.error(error));
```

---

### 3. TabFormSync Plugin
탭 메뉴와 입력 폼 동기화 플러그인

**핵심 기능:**
1. **API 기반 메뉴 데이터 로드**
   - RESTful API에서 메뉴 구조 동적 로드
   - 다양한 API 응답 형태 지원 (통합/분리/임베디드/단일배열)
   - 로컬 데이터 지원 (API 대체)

2. **동적 탭 메뉴 생성**
   - 메뉴 데이터 기반 자동 탭 생성
   - 탭 활성화/비활성화 상태 관리
   - 커스텀 탭 스타일링 지원

3. **동적 입력 폼 생성**
   - 메뉴별 폼 구성 자동 생성
   - 다양한 입력 요소 지원 (select, textarea, input)
   - 폼 검증 및 기본값 설정

4. **탭↔폼 실시간 동기화**
   - 탭 변경 시 자동 폼 전환
   - 폼 데이터 상태 동기화
   - 이벤트 기반 상호작용

**사용법:**
```javascript
// API 기반 사용
const tabFormSync = new TabFormSync({
    apiUrl: '/api/menu/list',
    tabContainer: '#tabContainer',
    formContainer: '#formContainer'
});

// 로컬 데이터 사용
const tabFormSync = new TabFormSync({
    useLocalData: true,
    localMenuData: menuData,
    localMenuConfigs: menuConfigs,
    tabContainer: '#tabContainer',
    formContainer: '#formContainer'
});

tabFormSync.init();
```

---

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
