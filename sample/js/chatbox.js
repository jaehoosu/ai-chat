/**
 * ChatBox jQuery Plugin
 * 채팅박스 기능을 제공하는 jQuery 플러그인
 * 
 * 주요 기능:
 * - 요청 메시지 출력
 * - 응답 메시지 출력 (그룹화 지원)
 * - 에러 메시지 출력
 * - 스트리밍 응답 지원
 * - 메시지 초기화
 * 
 * 사용법:
 * $('#chatBox').chatBox({
 *     height: '450px',
 *     autoScroll: true
 * });
 * 
 * 메서드 호출:
 * $('#chatBox').chatBox('addRequestMessage', messageData);
 * $('#chatBox').chatBox('addResponseMessage', messageData);
 * $('#chatBox').chatBox('clear');
 */

(function($) {
    'use strict';
    
    // jQuery가 로드되었는지 확인
    if (typeof $ === 'undefined') {
        throw new Error('ChatBox plugin requires jQuery');
    }

    // 기본 옵션
    const defaults = {
        height: '450px',
        autoScroll: true,
        enableTimestamp: true,
        maxMessages: 100,
        scrollAnimationDuration: 300,
        welcomeMessage: '채팅을 시작합니다.',
        showWelcome: true
    };

    // ChatBox 클래스
    class ChatBox {
        constructor($element, options) {
            this.$element = $element;
            this.options = $.extend({}, defaults, options);
            this.messageCount = 0;
            this.groups = new Map(); // 응답 그룹 관리
            
            this.init();
        }

        /**
         * 초기화
         */
        init() {
            this.$element.addClass('chat-box');
            
            if (this.options.height) {
                this.$element.css('height', this.options.height);
            }
            
            // 초기 메시지 표시 (옵션에 따라)
            if (this.options.showWelcome) {
                this.showWelcomeMessage(this.options.welcomeMessage);
            }
        }

        /**
         * 환영 메시지 표시
         * @param {string} message - 환영 메시지 (선택)
         */
        showWelcomeMessage(message) {
            const welcomeText = message || this.options.welcomeMessage || '채팅을 시작합니다.';
            const welcomeHtml = `
                <div class="message-group system">
                    <div class="message-system">${this.escapeHtml(welcomeText)}</div>
                </div>
            `;
            this.$element.append(welcomeHtml);
        }

        /**
         * 요청 메시지 추가
         * @param {Object} messageData - 메시지 데이터
         * @param {string} messageData.content - 메시지 내용
         * @param {string} messageData.id - 메시지 ID (선택)
         * @param {Date} messageData.timestamp - 타임스탬프 (선택)
         */
        addRequestMessage(messageData) {
            const id = messageData.id || this.generateId('req');
            const timestamp = messageData.timestamp || new Date();
            const content = this.escapeHtml(messageData.content);
            
            const messageHtml = `
                <div class="message-group request" data-message-id="${id}">
                    <div class="message-request">
                        ${content}
                        ${this.options.enableTimestamp ? `<div class="message-timestamp">${this.formatTime(timestamp)}</div>` : ''}
                    </div>
                </div>
            `;
            
            this.$element.append(messageHtml);
            this.messageCount++;
            this.checkMaxMessages(); // 최대 메시지 수 확인
            this.scrollToBottom();
            
            return id;
        }

        /**
         * 응답 메시지 추가 (그룹화 지원)
         * @param {Object} messageData - 메시지 데이터
         * @param {string} messageData.groupId - 그룹 ID
         * @param {string} messageData.content - 메시지 내용
         * @param {Object} messageData.metadata - 메타데이터 (선택)
         * @param {boolean} messageData.isComplete - 완료 여부 (선택)
         */
        addResponseMessage(messageData) {
            const groupId = messageData.groupId;
            const content = messageData.content;
            const metadata = messageData.metadata || {};
            const isComplete = messageData.isComplete !== false;
            
            let $group = this.findOrCreateGroup(groupId);
            
            // 응답 내용 추가
            if (content) {
                const $contentLine = $('<div>').addClass('response-line');
                
                // JSON 데이터인지 확인하고 포맷팅 (한 번만 파싱)
                const parseResult = this.parseJsonString(content);
                if (parseResult.isJson) {
                    this.addFormattedJsonContent($contentLine, content);
                } else {
                    // 일반 텍스트는 HTML로 처리 (기존 방식)
                    $contentLine.html(content);
                }
                
                $group.append($contentLine);
            }
            
            // 메타데이터 처리
            if (metadata.cacheYn !== undefined) {
                const cacheText = metadata.cacheYn ? "캐시에서 조회된 결과입니다." : "실시간 AI 조회 결과입니다.";
                const $cacheLine = $('<div>').addClass('response-line cache-info').html(cacheText);
                $group.append($cacheLine);
            }
            
            // 완료 시 응답 시간 및 기타 정보 추가
            if (isComplete && metadata.responseTime) {
                this.addResponseFooter($group, metadata);
            }
            
            this.checkMaxMessages(); // 최대 메시지 수 확인
            this.scrollToBottom();
            return groupId;
        }

        /**
         * 에러 메시지 추가
         * @param {Object} messageData - 메시지 데이터
         * @param {string} messageData.content - 에러 메시지 내용
         */
        addErrorMessage(messageData) {
            const id = messageData.id || this.generateId('err');
            const content = this.escapeHtml(messageData.content);
            const timestamp = messageData.timestamp || new Date();
            
            const messageHtml = `
                <div class="message-group error" data-message-id="${id}">
                    <div class="message-error">
                        ${content}
                        ${this.options.enableTimestamp ? `<div class="message-timestamp">${this.formatTime(timestamp)}</div>` : ''}
                    </div>
                </div>
            `;
            
            this.$element.append(messageHtml);
            this.messageCount++;
            this.checkMaxMessages(); // 최대 메시지 수 확인
            this.scrollToBottom();
            
            return id;
        }

        /**
         * 그룹 찾기 또는 생성
         * @param {string} groupId - 그룹 ID
         * @returns {jQuery} 그룹 요소
         */
        findOrCreateGroup(groupId) {
            let $group = this.groups.get(groupId);
            
            if (!$group || $group.length === 0) {
                const groupHtml = `
                    <div class="response-group" id="${groupId}">
                        <div class="response-header">응답</div>
                    </div>
                `;
                this.$element.append(groupHtml);
                $group = this.$element.find(`#${groupId}`);
                this.groups.set(groupId, $group);
                this.messageCount++;
            }
            
            return $group;
        }

        /**
         * 응답 그룹에 푸터 정보 추가
         * @param {jQuery} $group - 그룹 요소
         * @param {Object} metadata - 메타데이터
         */
        addResponseFooter($group, metadata) {
            const responseTime = metadata.responseTime || 0;
            const cacheKey = metadata.cacheKey;
            
            const $footer = $('<div>').addClass('response-footer');
            
            // 소요시간과 캐시관리를 한 줄에 배치 (Flexbox 사용)
            const $timeAndCacheRow = $('<div>')
                .addClass('time-cache-row')
                .css({
                    'display': 'flex',
                    'justify-content': 'space-between',
                    'align-items': 'center',
                    'gap': '10px'
                });
            
            // 응답 시간 정보 (왼쪽)
            const $responseTime = $('<div>')
                .addClass('response-time')
                .html(`소요시간: ${responseTime}초`);
            
            $timeAndCacheRow.append($responseTime);
            
            // 캐시 관리 UI (오른쪽)
            if (cacheKey) {
                const $cacheManagement = this.createCacheManagementUI(cacheKey, metadata);
                $timeAndCacheRow.append($cacheManagement);
            }
            
            $footer.append($timeAndCacheRow);
            $group.append($footer);
        }

        /**
         * 캐시 관리 UI 생성
         * @param {string} cacheKey - 캐시 키
         * @param {Object} metadata - 메타데이터
         * @returns {jQuery} 캐시 관리 UI 요소
         */
        createCacheManagementUI(cacheKey, metadata) {
            const $cacheInfo = $('<div>')
                .addClass('cache-management')
                .css({
                    'display': 'flex',
                    'align-items': 'center',
                    'gap': '8px',
                    'flex-shrink': '0'  // 축소되지 않도록 설정
                });
            
            // 캐시 키 표시 (짧게 표시)
            const shortCacheKey = cacheKey.length > 15 ? cacheKey.substring(0, 15) + '...' : cacheKey;
            const $cacheKeySpan = $('<span>')
                .addClass('cache-key')
                .text(shortCacheKey)
                .attr('title', `전체 캐시 키: ${cacheKey}\n클릭하여 복사`)
                .css({
                    'font-size': '11px',
                    'padding': '2px 6px',
                    'background-color': '#e3f2fd',
                    'border': '1px solid #90caf9',
                    'border-radius': '3px',
                    'cursor': 'pointer',
                    'color': '#0d47a1',
                    'font-family': 'monospace'
                })
                .on('click', () => {
                    this.copyToClipboard(cacheKey);
                });
            
            // 캐시 관리 버튼
            const $cacheManageBtn = $('<button>')
                .addClass('cache-manage-btn')
                .text('캐시관리')
                .attr('title', '캐시 관리')
                .css({
                    'background-color': '#ff9800',
                    'color': 'white',
                    'border': 'none',
                    'border-radius': '3px',
                    'padding': '4px 8px',
                    'font-size': '11px',
                    'cursor': 'pointer',
                    'white-space': 'nowrap'
                })
                .on('click', () => {
                    this.handleCacheAction('manage', cacheKey, metadata);
                });
            
            $cacheInfo.append($cacheKeySpan, $cacheManageBtn);
            
            return $cacheInfo;
        }

        /**
         * 캐시 액션 처리
         * @param {string} action - 액션 타입 ('manage', 'delete', 'refresh')
         * @param {string} cacheKey - 캐시 키
         * @param {Object} metadata - 메타데이터
         */
        handleCacheAction(action, cacheKey, metadata) {
            // 콜백이 정의되어 있으면 호출
            if (this.options.onCacheAction) {
                this.options.onCacheAction(action, cacheKey, metadata);
            } else {
                // 기본 동작: 콘솔 로그 및 알림
                console.log(`Cache ${action} requested for key: ${cacheKey}`, metadata);
                
                if (action === 'manage') {
                    alert(`캐시 관리 팝업을 열겠습니다.\n캐시 키: ${cacheKey}\n\n실제 구현에서는 여기에 REST API 호출과 팝업 창이 표시됩니다.`);
                } else {
                    const actionText = action === 'delete' ? '삭제' : '새로고침';
                    alert(`캐시 ${actionText} 요청이 처리되었습니다.\n캐시 키: ${cacheKey}`);
                }
            }
        }

        /**
         * 클립보드에 복사
         * @param {string} text - 복사할 텍스트
         */
        copyToClipboard(text) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    // 작은 토스트 메시지 표시
                    this.showToast(`복사됨: ${text}`);
                }).catch(err => {
                    console.error('클립보드 복사 실패:', err);
                    this.fallbackCopyToClipboard(text);
                });
            } else {
                this.fallbackCopyToClipboard(text);
            }
        }

        /**
         * 폴백 클립보드 복사 (구형 브라우저용)
         * @param {string} text - 복사할 텍스트
         */
        fallbackCopyToClipboard(text) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                this.showToast(`복사됨: ${text}`);
            } catch (err) {
                console.error('클립보드 복사 실패:', err);
                alert('클립보드 복사에 실패했습니다.');
            }
            document.body.removeChild(textArea);
        }

        /**
         * 토스트 메시지 표시
         * @param {string} message - 표시할 메시지
         */
        showToast(message) {
            const $toast = $('<div>')
                .addClass('toast-message')
                .text(message)
                .css({
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    backgroundColor: '#333',
                    color: 'white',
                    padding: '10px 15px',
                    borderRadius: '5px',
                    zIndex: 9999,
                    fontSize: '14px'
                });
            
            $('body').append($toast);
            
            // 2초 후 자동 삭제
            setTimeout(() => {
                $toast.fadeOut(300, function() {
                    $(this).remove();
                });
            }, 2000);
        }

        /**
         * 스트리밍 응답 업데이트
         * @param {string} groupId - 그룹 ID
         * @param {string} content - 추가할 내용
         */
        updateStreamingResponse(groupId, content) {
            const $group = this.groups.get(groupId);
            if ($group) {
                const $contentLine = $('<div>').addClass('response-line').html(content);
                $group.append($contentLine);
                this.scrollToBottom();
            }
        }

        /**
         * 메시지 삭제
         * @param {string} messageId - 메시지 ID
         */
        removeMessage(messageId) {
            this.$element.find(`[data-message-id="${messageId}"]`).remove();
            this.messageCount--;
        }

        /**
         * 그룹 삭제
         * @param {string} groupId - 그룹 ID
         */
        removeGroup(groupId) {
            const $group = this.groups.get(groupId);
            if ($group) {
                $group.remove();
                this.groups.delete(groupId);
                this.messageCount--;
            }
        }

        /**
         * 채팅박스 초기화
         */
        clear() {
            this.$element.empty();
            this.groups.clear();
            this.messageCount = 0;
            if (this.options.showWelcome) {
                this.showWelcomeMessage();
            }
        }

        /**
         * 최대 메시지 수 확인 및 오래된 메시지 제거
         */
        checkMaxMessages() {
            if (this.options.maxMessages <= 0) return; // 제한 없음
            
            const $messages = this.$element.find('.message-group, .response-group');
            const currentCount = $messages.length;
            
            if (currentCount > this.options.maxMessages) {
                const removeCount = currentCount - this.options.maxMessages;
                
                // 오래된 메시지부터 제거
                $messages.slice(0, removeCount).each((index, element) => {
                    const $element = $(element);
                    const messageId = $element.data('message-id');
                    const groupId = $element.attr('id');
                    
                    // 그룹인 경우 그룹 맵에서도 제거
                    if (groupId && this.groups.has(groupId)) {
                        this.groups.delete(groupId);
                    }
                    
                    $element.remove();
                    this.messageCount--;
                });
                
                console.log(`최대 메시지 수(${this.options.maxMessages})를 초과하여 ${removeCount}개 메시지를 제거했습니다.`);
            }
        }

        /**
         * 맨 아래로 스크롤
         */
        scrollToBottom() {
            if (this.options.autoScroll) {
                const scrollHeight = this.$element[0].scrollHeight;
                this.$element.animate({
                    scrollTop: scrollHeight
                }, this.options.scrollAnimationDuration);
            }
        }

        /**
         * 메시지 개수 반환
         * @returns {number} 메시지 개수
         */
        getMessageCount() {
            return this.messageCount;
        }

        /**
         * 버전 정보 반환
         * @returns {string} 버전 문자열
         */
        getVersion() {
            return $.fn.chatBox.version;
        }

        /**
         * ID 생성
         * @param {string} prefix - 접두사
         * @returns {string} 생성된 ID
         */
        generateId(prefix) {
            return $.fn.chatBox.utils.generateId(prefix);
        }

        /**
         * JSON 문자열인지 확인하고 파싱된 객체 반환
         * @param {string} str - 확인할 문자열
         * @returns {Object|null} { isJson: boolean, jsonObj: Object|null }
         */
        parseJsonString(str) {
            if (typeof str !== 'string') {
                return { isJson: false, jsonObj: null };
            }
            
            const trimmed = str.trim();
            if (!(trimmed.startsWith('{') && trimmed.endsWith('}')) && 
                !(trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                return { isJson: false, jsonObj: null };
            }
            
            try {
                const jsonObj = JSON.parse(trimmed);
                return { isJson: true, jsonObj: jsonObj };
            } catch (e) {
                return { isJson: false, jsonObj: null };
            }
        }

        /**
         * JSON 문자열인지 확인 (기존 호환성 유지)
         * @param {string} str - 확인할 문자열
         * @returns {boolean} JSON 문자열 여부
         */
        isJsonString(str) {
            return this.parseJsonString(str).isJson;
        }

        /**
         * 포맷된 JSON 내용 추가
         * @param {jQuery} $container - 컨테이너 요소
         * @param {string} jsonString - JSON 문자열
         */
        addFormattedJsonContent($container, jsonString) {
            // JSON 파싱을 한 번만 수행
            const parseResult = this.parseJsonString(jsonString);
            
            if (!parseResult.isJson) {
                // JSON이 아닌 경우 일반 텍스트로 처리
                console.warn('JSON 파싱 실패 또는 JSON 형식이 아님');
                $container.html(this.escapeHtml(jsonString));
                return;
            }
            
            try {
                const jsonObj = parseResult.jsonObj;
                const formattedJson = JSON.stringify(jsonObj, null, 2);
                
                // JSON 표시 방식 선택 UI 추가
                const $toggleContainer = $('<div>').addClass('json-toggle-container');
                
                const $toggleBtn = $('<button>')
                    .addClass('json-toggle-btn')
                    .text('[JSON] 보기')
                    .attr('title', '원본 JSON 보기/숨기기');
                
                const $copyBtn = $('<button>')
                    .addClass('json-copy-btn')
                    .text('[복사]')
                    .attr('title', 'JSON 복사');
                
                $toggleContainer.append($toggleBtn, $copyBtn);
                
                // 포맷된 JSON 표시 영역
                const $jsonDisplay = $('<pre>')
                    .addClass('json-display')
                    .text(formattedJson)
                    .css({
                        'background': '#f8f9fa',
                        'border': '1px solid #e9ecef',
                        'border-radius': '4px',
                        'padding': '12px',
                        'margin': '8px 0',
                        'font-family': 'Consolas, Monaco, "Courier New", monospace',
                        'font-size': '12px',
                        'line-height': '1.4',
                        'overflow-x': 'auto',
                        'white-space': 'pre-wrap',
                        'word-wrap': 'break-word',
                        'max-height': '300px',
                        'display': 'none'  // 초기에는 숨김
                    });
                
                // 요약 정보 표시
                const $summary = $('<div>')
                    .addClass('json-summary')
                    .html(this.createJsonSummary(jsonObj));
                
                // 이벤트 핸들러
                let isJsonVisible = false;
                $toggleBtn.on('click', () => {
                    isJsonVisible = !isJsonVisible;
                    if (isJsonVisible) {
                        $jsonDisplay.slideDown(200);
                        $toggleBtn.text('[JSON] 숨기기');
                    } else {
                        $jsonDisplay.slideUp(200);
                        $toggleBtn.text('[JSON] 보기');
                    }
                });
                
                $copyBtn.on('click', () => {
                    this.copyToClipboard(formattedJson);
                });
                
                // 요소들을 컨테이너에 추가
                $container.append($summary, $toggleContainer, $jsonDisplay);
                
            } catch (error) {
                // 예상치 못한 오류 발생 시 (JSON 파싱은 이미 검증됨)
                console.error('JSON 컨텐츠 생성 중 오류:', error);
                $container.html(this.escapeHtml(jsonString));
            }
        }

        /**
         * JSON 요약 정보 생성
         * @param {Object|Array} jsonObj - JSON 객체
         * @returns {string} 요약 정보 HTML
         */
        createJsonSummary(jsonObj) {
            if (Array.isArray(jsonObj)) {
                return `<strong>[배열] 데이터</strong> (${jsonObj.length}개 항목)`;
            } else if (typeof jsonObj === 'object' && jsonObj !== null) {
                const keys = Object.keys(jsonObj);
                const keysSample = keys.slice(0, 3).join(', ') + (keys.length > 3 ? '...' : '');
                return `<strong>[객체] 데이터</strong> (${keys.length}개 속성: ${keysSample})`;
            } else {
                return `<strong>[JSON] 데이터</strong>`;
            }
        }

        /**
         * HTML 이스케이프
         * @param {string} str - 이스케이프할 문자열
         * @returns {string} 이스케이프된 문자열
         */
        escapeHtml(str) {
            if (typeof str !== 'string') return str;
            return str.replace(/[&<>"']/g, function(match) {
                const escapeMap = {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#x27;'
                };
                return escapeMap[match];
            });
        }

        /**
         * 시간 포맷팅
         * @param {Date} date - 날짜 객체
         * @returns {string} 포맷된 시간
         */
        formatTime(date) {
            return date.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }

    // jQuery 플러그인 등록
    $.fn.chatBox = function(method) {
        // 메서드 호출인 경우
        if (typeof method === 'string') {
            const instance = this.data('chatBox');
            
            // version은 특별 처리 (정적 속성 반환)
            if (method === 'version') {
                return $.fn.chatBox.version;
            }
            
            if (instance && typeof instance[method] === 'function') {
                return instance[method].apply(instance, Array.prototype.slice.call(arguments, 1));
            } else {
                throw new Error('Method ' + method + ' does not exist on jQuery.chatBox');
            }
        }
        
        // 초기화인 경우
        const options = method || {};
        return this.each(function() {
            const $this = $(this);
            let instance = $this.data('chatBox');
            
            if (!instance) {
                instance = new ChatBox($this, options);
                $this.data('chatBox', instance);
            }
        });
    };

    // 정적 메서드로 버전 정보 제공
    $.fn.chatBox.version = '1.0.0';
    
    // 기본 설정 노출
    $.fn.chatBox.defaults = defaults;

    // 유틸리티 메소드들
    $.fn.chatBox.utils = {
        /**
         * ID 생성 유틸리티
         * @param {string} prefix - 접두사 (기본값: 'id')
         * @returns {string} 생성된 ID
         */
        generateId: function(prefix = 'id') {
            const timestamp = Date.now();
            const random = Math.random().toString(36).substr(2, 9);
            return `${prefix}_${timestamp}_${random}`;
        },

        /**
         * HTML 이스케이프 유틸리티
         * @param {string} str - 이스케이프할 문자열
         * @returns {string} 이스케이프된 문자열
         */
        escapeHtml: function(str) {
            if (typeof str !== 'string') return str;
            return str.replace(/[&<>"']/g, function(match) {
                const escapeMap = {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#x27;'
                };
                return escapeMap[match];
            });
        },

        /**
         * 시간 포맷팅 유틸리티
         * @param {Date} date - 날짜 객체 (기본값: 현재 시간)
         * @returns {string} 포맷된 시간
         */
        formatTime: function(date = new Date()) {
            return date.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    };

})(jQuery);
