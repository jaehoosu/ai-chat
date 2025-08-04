/**
 * HTTP 유틸리티 with Loading 사용 가이드
 * 간단한 HTTP 메서드와 로딩 화면을 사용한 기존 코드 교체 예제
 */

// ============================================================================
// 버전 정보 확인
// ============================================================================

// 1. 직접 속성 접근 (권장)
console.log('현재 버전:', $.http.version);  // "1.0.0"

// 2. 메서드 호출
console.log('버전:', $.http.getVersion());  // "1.0.0"

// 3. 간단한 호환성 확인
if ($.http.version >= '1.0.0') {
    console.log('✅ 사용 가능한 버전입니다.');
} else {
    console.log('⚠️ 버전 업데이트가 필요합니다.');
}

// ============================================================================
// 로딩 기능 사용법
// ============================================================================

// 1. 기본 로딩 (자동으로 내장 로딩 화면 표시)
async function basicWithLoading() {
    try {
        // 자동으로 로딩 화면이 표시되고 요청 완료 시 숨겨짐
        const result = await $.http.get('/api/data');
        console.log('데이터:', result);
    } catch (error) {
        console.error('오류:', error);
    }
}

// 2. 커스텀 로딩 함수 사용
async function customLoadingExample() {
    const customLoading = function() {
        $('#my-spinner').show();
        console.log('커스텀 로딩 시작');
    };
    
    const customUnloading = function() {
        $('#my-spinner').hide();
        console.log('커스텀 로딩 종료');
    };
    
    try {
        // 커스텀 로딩 함수 사용
        const result = await $.http.post('/api/save', { data: 'test' }, {
            loading: customLoading,
            unloading: customUnloading
        });
        console.log('저장 완료:', result);
    } catch (error) {
        console.error('저장 실패:', error);
    }
}

// 3. 로딩 비활성화
async function noLoadingExample() {
    try {
        // 로딩 화면 표시하지 않음
        const result = await $.http.get('/api/background-task', null, {
            showLoading: false
        });
        console.log('백그라운드 작업 완료:', result);
    } catch (error) {
        console.error('작업 실패:', error);
    }
}

// 4. 기존 loading/unloading 함수와 호환
async function compatibilityExample() {
    try {
        // 기존 JSP에서 사용하던 loading/unloading 함수 활용
        const result = await $.http.post('/api/old-endpoint', { data: 'test' }, {
            loading: window.loading,    // 기존 함수
            unloading: window.unloading // 기존 함수
        });
        console.log('호환성 테스트 완료:', result);
    } catch (error) {
        console.error('호환성 오류:', error);
    }
}

// 5. 예외 상황에서의 로딩 화면 안전 종료
async function exceptionSafetyExample() {
    try {
        // 404 에러, 타임아웃, 네트워크 오류 등 어떤 상황에서도
        // 로딩 화면은 자동으로 종료됩니다
        const result = await $.http.get('/nonexistent-api', null, {
            timeout: 5000  // 5초 타임아웃
        });
        console.log('성공:', result);
    } catch (error) {
        // 에러가 발생해도 로딩 화면은 이미 자동으로 종료됨
        console.error('요청 실패:', error.statusText);
        // unloading() 함수를 별도로 호출할 필요 없음!
    }
}

// 6. 다중 요청에서의 에러 처리
async function multipleRequestsWithErrors() {
    const requests = [
        $.http.get('/api/data1'),      // 성공
        $.http.get('/api/nonexistent'), // 404 에러
        $.http.get('/api/data2')       // 성공
    ];
    
    try {
        // Promise.allSettled를 사용하면 일부 실패해도 전체 결과를 받을 수 있음
        const results = await Promise.allSettled(requests);
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                console.log(`요청 ${index + 1} 성공:`, result.value);
            } else {
                console.error(`요청 ${index + 1} 실패:`, result.reason.statusText);
                // 각각의 로딩 화면은 이미 자동으로 종료됨
            }
        });
    } catch (error) {
        console.error('전체 요청 실패:', error);
    }
}

// ============================================================================
// 타임아웃 설정 가이드
// ============================================================================

// 7. 기본 타임아웃 (30초)을 설정한 이유
/*
💡 왜 30초(30,000ms)를 기본값으로 설정했나요?

1. 사용자 경험 측면:
   - 30초는 사용자가 기다릴 수 있는 적절한 시간
   - 너무 짧으면: 정상적인 요청도 실패할 수 있음
   - 너무 길면: 사용자가 답답해하고 페이지를 벗어남

2. 기술적 측면:
   - 일반적인 API 응답 시간: 1-10초
   - 네트워크 지연 시간 고려: 5-10초
   - 여유분 포함: 총 30초

3. 브라우저 기본값과의 차이:
   - Chrome/Edge: 약 5분 (너무 김)
   - Firefox: 약 90초 (적당하지만 여전히 김)
   - Safari: 약 60초
   - 우리의 30초: 더 나은 사용자 경험 제공

4. 업계 표준:
   - 검색/조회: 10-15초
   - 일반 API: 15-30초 ✅ (우리 기본값)
   - 파일 업로드: 60-300초
   - 보고서 생성: 120-300초
*/

// 8. 타임아웃이 없을 경우의 문제점
/*
⚠️ timeout: 0 또는 timeout 미설정 시 발생하는 문제들:

1. 무한 대기 상황:
   - 서버가 응답하지 않으면 영원히 기다림
   - 네트워크 연결이 끊어져도 계속 대기
   - 브라우저 기본 타임아웃에만 의존 (일관성 없음)

2. 리소스 문제:
   - 메모리 누수: AJAX 요청 객체가 GC되지 않음
   - 네트워크 소켓 점유: 연결 한도 도달 가능
   - 로딩 화면 고착: 영원히 표시됨

3. 사용자 경험 악화:
   - 앱이 멈춘 것처럼 보임
   - 사용자가 브라우저를 강제 종료
   - 신뢰성 저하

예시:
async function badExample() {
    // 🚫 나쁜 예: 타임아웃 없음
    const result = await $.http.get('/api/slow-endpoint', null, {
        timeout: 0  // 위험!
    });
}
*/

// 9. 용도별 타임아웃 설정 예제
async function timeoutExamples() {
    // 빠른 검색 (10초)
    const searchResults = await $.http.get('/api/search', { q: 'keyword' }, {
        timeout: 10000
    });
    
    // 일반 데이터 조회 (30초 - 기본값)
    const userData = await $.http.get('/api/users/123');
    // timeout: 30000이 자동으로 적용됨
    
    // 파일 업로드 (2분)
    const uploadResult = await $.http.post('/api/upload', formData, {
        timeout: 120000,
        contentType: false,
        processData: false
    });
    
    // 보고서 생성 (5분)
    const report = await $.http.post('/api/reports/generate', params, {
        timeout: 300000
    });
    
    // 실시간 알림 체크 (5초 - 자주 호출되므로 짧게)
    const notifications = await $.http.get('/api/notifications', null, {
        timeout: 5000
    });
}

// 10. 타임아웃 에러 처리와 재시도 로직
async function robustApiCall(url, data, maxRetries = 3) {
    let attempt = 0;
    
    while (attempt < maxRetries) {
        try {
            const result = await $.http.post(url, data, {
                timeout: 30000
            });
            return result;
            
        } catch (error) {
            attempt++;
            
            if (error.statusText === 'timeout') {
                console.log(`타임아웃 발생 (${attempt}/${maxRetries})`);
                
                if (attempt < maxRetries) {
                    // 재시도 전 잠시 대기 (백오프)
                    await new Promise(resolve => 
                        setTimeout(resolve, 1000 * attempt)
                    );
                    continue;
                } else {
                    throw new Error('최대 재시도 횟수 초과: 서버 응답 시간 초과');
                }
            } else {
                // 타임아웃이 아닌 다른 오류는 즉시 throw
                throw error;
            }
        }
    }
}

// 11. 상황별 타임아웃 처리 전략
class ApiService {
    constructor() {
        this.defaultTimeout = 30000;  // 30초
    }
    
    // 검색 - 빠른 응답 필요
    async search(query) {
        try {
            return await $.http.get('/api/search', { q: query }, {
                timeout: 10000  // 10초
            });
        } catch (error) {
            if (error.statusText === 'timeout') {
                throw new Error('검색 시간이 초과되었습니다. 검색어를 확인해주세요.');
            }
            throw error;
        }
    }
    
    // 결제 - 중요하므로 여유 있게
    async payment(paymentData) {
        try {
            return await $.http.post('/api/payment', paymentData, {
                timeout: 60000  // 60초
            });
        } catch (error) {
            if (error.statusText === 'timeout') {
                throw new Error('결제 처리 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.');
            }
            throw error;
        }
    }
    
    // 일반 데이터 - 기본 타임아웃 사용
    async getData(id) {
        return await $.http.get(`/api/data/${id}`);
        // 기본 30초 타임아웃 자동 적용
    }
}

// ============================================================================
// 기존 코드 -> HTTP 유틸리티로 변경
// ============================================================================

/* 
 * 기존: sednAjaxRequest(url, apiRequest, successCallback)
 * 신규: $.http.post() 또는 $.http.request()
 */

// 기존 코드
function sednAjaxRequest(url, apiRequest, successCallback) {
    $.ajax({
        type: 'POST',
        url: url,
        contentType: 'application/json;charset=UTF-8',
        dataType: 'json',
        data: apiRequest,
        success: successCallback,
        error: function (xhr) {
            addErrorMessageToChatBox("Error: " + xhr.statusText);
            unloading();
        },
        beforeSend: loading,
        complete: unloading
    });
}

// HTTP 유틸리티 사용 (Promise/then 방식)
function sendAjaxRequest_v2(url, apiRequest, successCallback) {
    const data = typeof apiRequest === 'string' ? JSON.parse(apiRequest) : apiRequest;
    
    $.http.post(url, data, {
        beforeSend: loading,
        complete: unloading
    })
    .then(successCallback)
    .catch(function(xhr) {
        addErrorMessageToChatBox("Error: " + xhr.statusText);
        unloading();
    });
}

// HTTP 유틸리티 사용 (async/await 방식)
async function sendAjaxRequest_v3(url, apiRequest, successCallback) {
    const data = typeof apiRequest === 'string' ? JSON.parse(apiRequest) : apiRequest;
    
    try {
        if (typeof loading === 'function') loading();
        const response = await $.http.post(url, data);
        successCallback(response);
    } catch (error) {
        addErrorMessageToChatBox("Error: " + error.statusText);
    } finally {
        if (typeof unloading === 'function') unloading();
    }
}

/* 
 * 기존: send_message_rest()
 * 신규: HTTP 유틸리티 버전
 */

// 기존 코드
function send_message_rest() {
    const chatInput = $('#chatInput').val().trim();
    const payload = generate_payload();
    const apiRequest = JSON.stringify(payload);
    const input = getRequestMessageTitle(chatInput) || payload.query.note + '[' + payload.common.iid + ']';
    prepareMessage(input);
    sednAjaxRequest('/wi/ai/askByRest', apiRequest, handleRestApiMessage);
    $('#chatInput').val('');
}

// HTTP 유틸리티 버전 (Promise/then)
function send_message_rest_v2() {
    const chatInput = $('#chatInput').val().trim();
    const payload = generate_payload();
    const input = getRequestMessageTitle(chatInput) || payload.query.note + '[' + payload.common.iid + ']';
    
    prepareMessage(input);
    
    $.http.post('/wi/ai/askByRest', payload)
        .then(handleRestApiMessage)
        .catch(function(xhr) {
            addErrorMessageToChatBox("전송 실패: " + xhr.statusText);
        })
        .finally(function() {
            $('#chatInput').val('');
        });
}

// HTTP 유틸리티 버전 (async/await)
async function send_message_rest_v3() {
    const chatInput = $('#chatInput').val().trim();
    const payload = generate_payload();
    const input = getRequestMessageTitle(chatInput) || payload.query.note + '[' + payload.common.iid + ']';
    
    prepareMessage(input);
    
    try {
        const response = await $.http.post('/wi/ai/askByRest', payload);
        handleRestApiMessage(response);
    } catch (error) {
        addErrorMessageToChatBox("전송 실패: " + error.statusText);
    } finally {
        $('#chatInput').val('');
    }
}

/* 
 * 기존: send_cache_rest(commandId)
 * 신규: HTTP 유틸리티 버전
 */

// 기존 코드 (복잡한 로직)
function send_cache_rest(commandId) {
    // ... 복잡한 분기 처리 ...
    sendAjaxRequest('/api/' + task + '/' + action.toLowerCase(), apiRequest, handle);
}

// HTTP 유틸리티 버전 (간단!)
async function send_cache_rest_v2(commandId) {
    if (!commandId) {
        console.error('commandId가 없습니다.');
        return;
    }

    const commands = commandId.split('.');
    if (commands.length < 4) {
        console.error('잘못된 commandId 형식');
        return;
    }

    const task = commands[1];        // cache 또는 prompt
    const action = commands[2];      // get, upd, del
    const url = `/api/${task}/${action}`;
    const payload = (task === 'cache') ? 
        generate_cache_payload(commandId) : 
        generate_prompt_payload(commandId);

    try {
        const response = await $.http.post(url, payload);
        
        if (action === 'get') {
            handleRestApiCache(response, task);
        } else {
            const actionName = (action === 'upd') ? '갱신' : '삭제';
            if (response?.result?.success) {
                alert(`캐시 ${actionName} 성공!`);
                if (typeof closeCacheEditor === 'function') closeCacheEditor();
            } else {
                alert(`캐시 ${actionName} 실패: ` + (response.result?.message || '알 수 없는 오류'));
            }
        }
    } catch (error) {
        alert(`캐시 작업 오류: ${error.statusText}`);
    }
}

// ============================================================================
// 사용 예제
// ============================================================================

// 1. 기본 GET 요청
$.http.get('/api/users')
    .then(response => console.log(response));

// 2. POST 요청
$.http.post('/api/users', { name: 'John', age: 30 })
    .then(response => console.log('생성됨:', response));

// 3. PUT 요청
$.http.put('/api/users/1', { name: 'Jane', age: 25 })
    .then(response => console.log('업데이트됨:', response));

// 4. DELETE 요청
$.http.delete('/api/users/1')
    .then(() => console.log('삭제됨'));

// 5. async/await 사용
async function getUserData(id) {
    try {
        const user = await $.http.get(`/api/users/${id}`);
        console.log('사용자 정보:', user);
        return user;
    } catch (error) {
        console.error('사용자 조회 실패:', error);
        throw error;
    }
}

// 6. 커스텀 옵션 사용
$.http.post('/api/upload', formData, {
    contentType: false,
    processData: false,
    timeout: 60000
})
.then(response => console.log('업로드 완료:', response));

// 7. 기존 함수들 점진적 교체
function send_message() {
    const functionName = window.FUNCTION_NAME || 'send_message_rest_v3';
    
    if (typeof window[functionName] === 'function') {
        window[functionName]();
    } else {
        // 기본값으로 HTTP 유틸리티 버전 사용
        send_message_rest_v3();
    }
}

// ============================================================================
// 장점
// ============================================================================

/*
1. 매우 간단함 - 표준 HTTP 메서드만 제공
2. Promise/async-await 지원 - 현대적인 비동기 처리
3. 종속성 없음 - jQuery만 필요
4. 일관된 인터페이스 - 모든 메서드가 동일한 방식으로 동작
5. 확장성 - 필요시 쉽게 메서드 추가 가능

사용법:
<script src="js/ajax-util.js"></script>
<script>
// Promise/then 방식
$.http.post('/api/data', payload).then(callback);

// async/await 방식
const response = await $.http.get('/api/data');
</script>
*/
