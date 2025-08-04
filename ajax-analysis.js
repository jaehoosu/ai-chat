/**
 * HTTP Utility의 request() 함수 실행 과정 상세 분석
 */

// 예제: $.http.post('/api/users', { name: 'John', age: 30 }, { timeout: 5000 })

console.log('=== HTTP Utility 실행 과정 분석 ===');

// 1. post() 메서드 호출
function post(url, data, options) {
    console.log('1. post() 메서드 호출');
    console.log('   url:', url);                    // '/api/users'
    console.log('   data:', data);                  // { name: 'John', age: 30 }
    console.log('   options:', options);            // { timeout: 5000 }
    
    // $.extend(options, { type: 'POST', data: data }) 실행
    const postOptions = $.extend(options, { type: 'POST', data: data });
    console.log('   postOptions:', postOptions);    // { timeout: 5000, type: 'POST', data: { name: 'John', age: 30 } }
    
    return this.request(url, postOptions);
}

// 2. request() 메서드 호출
function request(url, options) {
    console.log('2. request() 메서드 호출');
    console.log('   url:', url);                    // '/api/users'
    console.log('   options:', options);            // { timeout: 5000, type: 'POST', data: { name: 'John', age: 30 } }
    
    // defaults 설정
    const defaults = {
        type: 'GET',
        contentType: 'application/json;charset=UTF-8',
        dataType: 'json',
        timeout: 30000
    };
    console.log('   defaults:', defaults);
    
    // $.extend({}, defaults, options) 실행
    const settings = $.extend({}, defaults, options);
    console.log('   settings (after extend):', settings);
    // 결과: {
    //     type: 'POST',                           // options에서 덮어씀
    //     contentType: 'application/json;charset=UTF-8',  // defaults
    //     dataType: 'json',                       // defaults
    //     timeout: 5000,                          // options에서 덮어씀
    //     data: { name: 'John', age: 30 }         // options
    // }
    
    // 데이터 JSON 변환 (POST이므로 변환됨)
    if (settings.data && typeof settings.data === 'object' && settings.type !== 'GET') {
        settings.data = JSON.stringify(settings.data);
        console.log('   settings.data (after JSON.stringify):', settings.data);
        // 결과: '{"name":"John","age":30}'
    }
    
    // 최종 AJAX 설정 생성
    const finalConfig = $.extend(settings, { url: url });
    console.log('   finalConfig:', finalConfig);
    // 결과: {
    //     type: 'POST',
    //     contentType: 'application/json;charset=UTF-8',
    //     dataType: 'json',
    //     timeout: 5000,
    //     data: '{"name":"John","age":30}',
    //     url: '/api/users'
    // }
    
    return $.ajax(finalConfig);
}

// 3. jQuery AJAX 내부 처리 (의사코드)
function jQueryAjaxInternals(config) {
    console.log('3. jQuery AJAX 내부 처리');
    
    // XMLHttpRequest 객체 생성
    const xhr = new XMLHttpRequest();
    
    // HTTP 메서드와 URL 설정
    xhr.open(config.type, config.url, true);
    console.log('   xhr.open:', config.type, config.url);
    
    // 헤더 설정
    if (config.contentType) {
        xhr.setRequestHeader('Content-Type', config.contentType);
        console.log('   Content-Type 헤더 설정:', config.contentType);
    }
    
    // 타임아웃 설정
    if (config.timeout) {
        xhr.timeout = config.timeout;
        console.log('   타임아웃 설정:', config.timeout + 'ms');
    }
    
    // 응답 처리
    xhr.onload = function() {
        console.log('   응답 수신:', this.status, this.statusText);
        
        if (this.status >= 200 && this.status < 300) {
            let response = this.responseText;
            
            // dataType에 따른 응답 변환
            if (config.dataType === 'json') {
                try {
                    response = JSON.parse(response);
                    console.log('   JSON 파싱 완료:', response);
                } catch (e) {
                    console.error('   JSON 파싱 오류:', e);
                }
            }
            
            // 성공 콜백 호출
            if (config.success) {
                config.success(response);
            }
        } else {
            // 에러 콜백 호출
            if (config.error) {
                config.error(this, this.statusText, 'HTTP Error');
            }
        }
    };
    
    // 에러 처리
    xhr.onerror = function() {
        console.log('   네트워크 오류 발생');
        if (config.error) {
            config.error(this, 'error', 'Network Error');
        }
    };
    
    // 타임아웃 처리
    xhr.ontimeout = function() {
        console.log('   타임아웃 발생');
        if (config.error) {
            config.error(this, 'timeout', 'Timeout Error');
        }
    };
    
    // 요청 전송
    const dataToSend = config.data || null;
    xhr.send(dataToSend);
    console.log('   데이터 전송:', dataToSend);
}

// ============================================================================
// 실제 사용 시뮬레이션
// ============================================================================

console.log('\n=== 실제 사용 예제 ===');

// 사용자 코드
$.http.post('/api/users', { name: 'John', age: 30 }, {
    timeout: 5000,
    success: function(response) {
        console.log('사용자 생성 성공:', response);
    },
    error: function(xhr, status, error) {
        console.error('사용자 생성 실패:', status, error);
    }
});

// 위 코드가 실행되면서 내부적으로 다음과 같이 처리됨:
/*
1. post() 호출
   - options = { timeout: 5000, type: 'POST', data: { name: 'John', age: 30 } }

2. request() 호출  
   - settings = {
       type: 'POST',
       contentType: 'application/json;charset=UTF-8', 
       dataType: 'json',
       timeout: 5000,
       data: '{"name":"John","age":30}',
       success: function...,
       error: function...
     }

3. $.ajax() 호출
   - finalConfig = settings + { url: '/api/users' }

4. XMLHttpRequest 실행
   - POST /api/users
   - Content-Type: application/json;charset=UTF-8
   - Body: {"name":"John","age":30}
   - Timeout: 5000ms
*/
