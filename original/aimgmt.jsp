<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page trimDirectiveWhitespaces="true" %>
<%@ include file="../common/include/taglib.jsp" %>
<style>
    /* 채팅영역 */
    .chat-box {
        width: 100%;
        height: 450px;
        margin: 0 auto;
        border: 1px solid #ccc;
        overflow-y: auto;
        padding: 10px;
        background-color: #f9f9f9;
    }

    .chat-box a {
        display: inline-block;
        background-color: #b43e73;
        color: white;
        text-decoration: none;
        padding: 5px 5px;
        border-radius: 3px;
        margin-right: 5px;
    }

    .response-group {
        border: 2px solid #87ceeb;
        background-color: #F0F8FF;
        border-radius: 8px;
        margin: 10px 0;
        box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
    }

    .response-header {
        display: flex;
        justify-content: space-betwen;
        align-items: center;
        font-weight: bold;
        color: #0077aa;
        margin-bottom: 6px;
    }

    .response-line {
        padding: 2px 0;
    }

    .response-time {
        display: flex;
        justiFy-content: space-between;
        align-items: center;
        margin-top: 10px;
        padding: 2px 0;
    }

    .response-group ul {
        list-style-type: disc !important;
        list-style-position: outside;
        margin: O.5em 0 0.5em 2em;
        padding: 0;
    }

    .response-group ul li {
        list-style-type: disc !important;
    }

    .response-group ol {
        list-style-type: decimal !important;
        list-style-position: outside;
        margin: 0.5en O OSen 2en;
        padding: 0;
    }

    .response-group ol li {
        list-style-type: decimal !important;
    }

    .response-group li {
        display: list-item !important;
        line-height: 1.8em;
    }

    .product-tag {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 10px;
        margin-right: 5px;
        background-color: #e0e0e0;
    }

    .product-tag .remoue {
        margin-left: 5px;
        cursor: pointer;
    }

    .option-bar {
        display: Flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        padding: 5px 0;
        border-bottom: 1px solid #ddd;
    }

    .option-left label {
        margin-right: 12px;
        display: inline-flex;
        align-items: center;
        gap: 12px;
    }

    .option-right button {
        margin-left: 8px;
        padding: 6px 10px;
        border-radius: 4px;
        cursor: pointer;
    }

    /* 프롬프트 */
    .input-area {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        margin-bottom: 10px;
    }

    .input-form {
        flex: 1;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 10px;
    }

    .input-area textarea {
        width: 98%;
        height: 50px;
        padding: 10px;
        font-size: 16px;
        border: 1px solid #e9e9e9;
        border-radius: 5px;
        resize: vertical;
        background-color: #f9f9f9;
    }

    .input-area textarea::placeholder {
        opacity: 1;
        color: #555;
    }

    .send-area {
        display: flex;
        justify-content: center;
        min-width: 80px;
    }

    .btn-send {
        width: 100%;
        height: 80px;
        font-size: 16px;
        cursor: pointer;
    }

    .btn-send:before {
        content: "\1F4E4";
        margin-right: 6px;
    }

    .btn-search:before {
        content: "\1F50d";
        margin-right: 6px;
    }

    .btn-clearchat:before {
        content: "\1f9fd";
        margin-right: 6px;
    }

    .btn-settings:before {
        content: "\2699";
        margin-right: 6px;
    }

    select {
        background-color: #f9f9f9
    }

    /* 메뉴 영역 */
    .menu-input {
        display: none;
    }

    .icon-button {
        margin-left: 5px;
        display: inline-block;
    }

    .icon-button:before {
        font-size: 16px;
    }

    .icon-button.edit:before {
        content: "\270E";
    }

    .icon-button.delete:before {
        content: "\1F5D1";
    }

    .icon-button.info:before {
        content: "\2139";
    }

    .icon-button:hover:after {
        content: attr(data-tooltip);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background-color: #333;
        color: #fff;
        padding: 5px;
        border-radius: 3px;
        white-space: nowrap;
        font-size: 12px;
        z-index: 1;
    }

    .popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: none;
        z-index: 999;
    }

    .popup-editor {
        position: fixed;
        width: 1000px;
        height: 600[x];
        min-height: 300px;
        min-width: 300px;
        background: #fff;
        border: 2px solid #0077aa;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        display: none;
        flex-direction: column;
        resize: both;
        overflow: hidden;
    }

    .popup-header {
        padding: 10px 20px;
        font-size: 18px;
        font-weight: bold;
        background-color: #e6f4ff;
        border-bottom: 1px solid #ccc;
        cursor: move;
        user-select: none;
    }

    .popup-body {
        flex: 1 1 auto;
        min-height: 0;
        padding: 10px 10px;
    }

    .popup-body textarea {
        flex: 1 1 auto;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 10px;
        resize: none;
        overflow: auto;
        box-sizing: border-box;
    }

    .popup-footer {
        padding: 10px 20px;
        text-align: right;
        border-top: 1px solid #ccc;
    }

    .popup-footer button {
        margin-left: 10px 20px;
        padding: 6px 12px;
    }

    .popup-promt-editor {
        position: fixed;
        width: 600px;
        background: #fff;
        border: 2px solid #0077aa;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        display: none;
        flex-direction: column;
        resize: both;
        overflow: hidden;
        min-height: 300px;
        min-width: 300px;
    }
</style>

<!-- 모듈 스크립트 로드 -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script type="text/javascript">
    // JSP 변수를 JavaScript 전역변수로 설정
    window.USER_ID = '${user_id}';
    window.API_TYPE = '${api_type}';
    window.FUNCTION_NAME = '${functionName}';
</script>
<script src="rest-api.js"></script>
<script src="payload-factory.js"></script>
<script src="chat-ui.js"></script>
<script src="menu-manager-dynamic.js"></script>

<script type="text/javascript">
    let selectedProducts = [];
    let isDragging = false;
    let _offset = { x: 0, y: 0 };

    $(document).ready(function () {
        // MenuManager 초기화는 JSP 데이터가 준비된 후에 실행
        const initializeMenuManager = function() {
            const firstMenuId = $('#choose_menu').val().trim();
            if (firstMenuId) {
                // 기본 메뉴 설정으로 초기화 (서버 데이터 없이도 동작)
                MenuManager.setCurrentMenu(firstMenuId);
            }
        };
        
        initializeMenuManager();
        
        const body_type = $('#choose_menu').val().trim();
        prompt_change(body_type);
        setObjectDataAttr('prompt-id', body_type + '.prompt.get');

        init_select_events();
        init_chatinput_events();
        init_common_event();
        init_cache_editor_events();
    });

    /*
     * document event handlers
    */
    function init_common_event() {
        $(document).on('click', '#cache-edit-button', function () {
            const commandId = $(this).data('command');
            if (commandId) {
                openCacheEditor(commandId, 'CACHE');
            } else {
                alert('편집할 캐시 키를 선택해주세요.');
            }
        });
    }

    /* html select tag object event handler - MenuManager 연동 */
    function init_select_events() {
        $('[id$="Select"]').on('change', function () {
            const id = this.id;
            const value = $(this).val();
            const text = $(this).find('option:selected').text();
            const currentMenuId = MenuManager.getCurrentMenu();
            
            // 선택 항목 생성
            const createItem = (value, text, type = 'P') => ({
                id: value,
                name: text,
                srvtp: type,
                __index: 0,
                __original_index: 0
            });
            
            if (id === 'productSelect') {
                if (value !== '00') {
                    const product = createItem(value, text);
                    MenuManager.setProducts(currentMenuId, [product]);
                } else {
                    MenuManager.setProducts(currentMenuId, []);
                }
            } else if (id === 'cardSelect') {
                if (value !== '00') {
                    MenuManager.setCard(currentMenuId, { code: value, name: text });
                } else {
                    MenuManager.clearMenu(currentMenuId);
                }
            } else if (id === 'welfareSelect') {
                if (value !== '00') {
                    MenuManager.setWelfare(currentMenuId, { code: value, name: text });
                } else {
                    MenuManager.clearMenu(currentMenuId);
                }
            } else if (id === 'bundleSelect') {
                if (value !== '00') {
                    MenuManager.setBundle(currentMenuId, { code: value, name: text });
                } else {
                    MenuManager.clearMenu(currentMenuId);
                }
            } else if (id === 'sourceProductSelect') {
                if (value !== '00') {
                    const product = createItem(value, text);
                    product.__index = 0;
                    MenuManager.setProducts(currentMenuId, [product]);
                    $('#targetProductSelect').val('').prop('disabled', false);
                } else {
                    MenuManager.setProducts(currentMenuId, []);
                    $('#targetProductSelect').val('').prop('disabled', true);
                }
            } else if (id === 'targetProductSelect') {
                const currentProducts = MenuManager.getSelections(currentMenuId).products;
                if (currentProducts.length > 0 && value !== '00') {
                    const targetProduct = createItem(value, text);
                    targetProduct.__index = 1;
                    targetProduct.__original_index = 1;
                    MenuManager.setProducts(currentMenuId, [currentProducts[0], targetProduct]);
                }
            }
            
            // 하위 호환성을 위해 selectedProducts도 업데이트
            selectedProducts = MenuManager.getSelections(currentMenuId).products;
        });
    }

    /*
    *  chat input events
    */
    function init_chatinput_events() {
        $('#chat-input').on('keydown', function (event) {
            if (event.key === 'Enter' && event.shiftKey) {
                return;
            }else {
                event.preventDefault();
                sendChatMessage();
            }
        });
    }

    /*
     * 캐시 편집기 팝업 창 이벤트 핸들러
     */
    function init_cache_editor_events() {
        const $editor = $('.popup-editor');
        const $header = $editor.find('.popup-header');
        $header.on('mousedown', function (e) {
            isDragging = true;
            _offset.x = e.clientX - $editor.offset().left;
            _offset.y = e.clientY - $editor.offset().top;
            $editor.css('transform', '');
            e.preventDefault();
        });

        $(document).on('mousemove', function (e) {
            if (isDragging) {
                const winW = $(window).width();
                const winH = $(window).height();
                const popupW = $editor.outerWidth();
                const popupH = $editor.outerHeight();
                let left = e.clientX - _offset.x;
                let top = e.clientY - _offset.y;
                
                // 경계 체크
                left = Math.max(0, Math.min(left, winW - popupW));
                top = Math.max(0, Math.min(top, winH - popupH));

                $editor.css({
                    left: left + 'px',
                    top: top + 'px'
                });
            }
        });

        $(document).on('mouseup', function () {
            isDragging = false;
        });
    }

    /* 요청 메시지 메뉴 찾기 - MenuManager 사용 */
    function menuMap(menu) {
        return MenuManager.getMenuName(menu);
    }

    /* 요청 메시지 제목 - MenuManager 사용 */
    function getRequestMessageTitle(chatInput) {
        return MenuManager.getRequestTitle(chatInput ? chatInput.val() : null);
    }

    /* 응답메시지 처리 중 발생된 오류 표시 */
    function addErrorMessageToChatBox(errorMessage) {
        const user_id = '${user_id}';  // jsp 변수 view에서 매핑.
        const chatBox = $('#chatBox');
        const req_key = requestRandomKey();
        const groupId = 'group-' + encodeURIComponent(user_id+'_'+req_key).replaceAll('%', '');
        let $group = $('#' + groupId);
        if ($group.length === 0) {
            $group = $('<div>')
                .attr('id', groupId)
                .addClass('response-group')
                .append('<div class="response-header">' + errorMessage + '</div>');
            chatBox.append($group);
        }
    }

    /* 채팅 메시지 전송 */
    function sednAjaxRequest(url, apiRequest, successCallback) {
        if (!url || !apiRequest || !successCallback) {
            console.error('필수 파라미터가 누락되었습니다:', { url, apiRequest, successCallback });
            return;
        }

        $.ajax({
            type: 'POST',
            url: url,
            contentType: 'application/json;chatset=UTF-8',
            dataType: 'json',
            async: true,
            data: apiRequest, // json object
            success: successCallback,
            error: function (xhr) {
                addErrorMessageToChatBox("Error: " + xhr.statusText + '' + xhr.responseText);
                unloading();
            },
            beforeSend: loading,
            complete: unloading
        });
    }

    /* 메시지 화면 출력 */
    function prepareMessage(input) {
        const chatBox = $('#chatBox');
        const group_id = 'group-' + '\${user_id}' + '_' + requestRandomKey();
        const $group = $('<div>').attr('id', group_id).addClass('response-group');
        $group.append('<div class="response-header">요청: ' + input + '</div>');
        chatBox.append($group);
        chatBox.scrollTop(chatBox[0].scrollHeight);
    }

    /* server sent event message sender 
     * deprecated
     */
    function send_message_sse() {
        const chatInput = $('#chatInput').val().trim();
        const apiRequest = JSON.stringify(generate_payload());
        const input = getRequestMessageTitle(input);
        const title = payload.query.note + '[' + payload.common.iid + ']';
        prepareMessage(title);
        sendAjaxRequest('/wi/ai/query', apiRequest, function(resp){
            setTimeout(() => {
                let user = "";
                let req = "";
                if (typeof resp === 'object') {
                    user = resp.user_id || '';
                    req = resp.req_id || '';
                } else {
                    console.log('응답이 객체가 아닙니다:', resp);
                }
                const sse = new EventSource('/wi/ai/stream/' + user + '/' + req);
                sse.onmessage = handleSSEMessage;
                sse.onerror = handleSseError;
            }, 500);
        });
        $('#chatInput').val('');
    }

    /* rest api message sender */
    function send_message_rest() {
        const chatInput = $('#chatInput').val().trim();
        const payload = generate_payload();
        const apiRequest = JSON.stringify(payload);
        const input = getRequestMessageTitle(chatInput) || payload.query.note + '[' + payload.common.iid + ']';
        prepareMessage(input);
        sednAjaxRequest('/wi/ai/askByRest', apiRequest, handleRestApiMessage);
        $('#chatInput').val('');
    }

    /* 서버 설정에 따라 메시지 전송 호출 */
    function send_message() {
        const functionName = '${functionName}';
        if (typeof window[functionName] === 'function') {
            window[functionName]();
        } else {
            console.error('Function not found:', functionName);
        }
    }

    /* 요청 결과 꺼내기 */
    function getContent(result) {
        const content = result.summaryContent
                        || result.prodCompare
                        || result.prodDetailSummary
                        || result.prodDetailTitle
                        || result.TCardSummary
                        || result.welfareSummary
                        || result.answer
                        || result.combSummary
                        || '내용없음';
        return content;
    }
    
    /* rest 방식 응답 결과 출력 */
    function handleRestApiMessage(response) {
        try {
            const data = kzone.util.isObject(response) ? response : JSON.parse(response);
            console.log('Response:', data);
    
            const result = data.result;
            if (!result) {
                addErrorMessageToChatBox("응답 결과가 없습니다.");
                return;
            }
    
            // 사용자 id와 요청키를 사용하여 그룹id생성.
            const userId = data.user_id;
            const reqKey = data.req_id;
            const groupId = 'group-' + encodeURIComponent(userId + '_' + reqKey).replaceAll('%', '');
    
            let $group = $('#' + groupId);
            if ($group.length === 0) {
                $group = $('<div>').attr('id', groupId).addClass('response-group');
                    $group.append('<div class="response-header">사용자 : ' + user_id + ', 요청id:' + reqKey +'</div>');
                    $group.append('<div class="response-line">요청 ID: ' + reqKey + '</div>');
                $('#chatBox').append($group);
            }
    
            // cache
            const cache_is = result.cacheYn ? "캐시에서 조회 결과입니다." : "실시간 AI 조회 결과입니다.";
            const $cache_ticker = $('<div>').addClass('response-line').html(cache_is);
            $group.append($cache_ticker);
    
            // 응답 내용 확인
            const content = getContent(result);
            const $summary = $('<div>').addClass('response-line').html(content);
            $group.append($summary);
    
            // 소요시간
            const cache_iid = result.infId + '.cache.get' + result.prodId;
            const response_time = diff_datetime(response.rqtDt, response.rspnDt);
    
            // 캐시 관리
            const cacheKey = retrieveCacheKeyInResponse(result);
            const $span  = $('<span>').addClass('cache-key').text(cacheKey || '없음');
            $span.data('command', data.result.infId + '.cache.get.' + cacheKey);
            $span.data('tooltip', '캐시 관리(편집/저장/삭제)를 합니다.');
            const $respone_time = $('<div>').addClass('response-time').html('소요시간:' + response_time + '초')
                                            .append($('<div>').addClass('icon-buttons').append($span));
            $group.append($respone_time);
    
            $('#chatBox').scrollTop($('#chatBox')[0].scrollHeight);

        } catch (e) {
            console.error('응답 처리 중 오류 발생:', e);
            addErrorMessageToChatBox("응답 처리 중 오류가 발생했습니다.");
        }
    }

    /* 응답 데이터에서 해시키 확인 및 추출 */
    function retrieveCacheKeyInResponse(res) {
         const handlers = {
            '2001': (res) => {return res.cacheKey;},
            '2002': (res) => {return res.tgtProdId + '_' + res.comprProdId;},
            '2003': (res) => {return res.tagId;},
            '2004': (res) => {return null;},
            '2005': (res) => {return null;},
            '2006': (res) => {return res.cardCd;},
            '2007': (res) => {return res.welfareCd;},
            '2008': (res) => {return res.combCd || res.cacheKey;}
        };
        if (handlers[response.code]) {
            return handler[res.infId]?.(res);
        }
    }

    /* 캐시 요청 후 응답 핸들러 */
    function handleRestApiCache(response, task) {
        const temp_doc = {
            infId:'',
            cacheKey: '',
            updateId:'',
            cacheMsg:'',
            knwlgIds:[]
        };
        try {
            const $editor = $('.popup-editor');
            const command_id = $('.icon-button.edit').data('command');
            if (command_id?.includes('get')) {
                console.log('캐시 편집기 열기:', command_id);
            }

            if (response.statusCode === 200) {
                if (task === 'cache') {
                    const data = isObject(response) ? response : JSON.parse(response);
                    const result = data.result;
                    const isValid = result && result.success === true && typeof result.document === 'object' && Object.keys(result.document).length > 0;
                    if (isValid) {
                        const replace_cache_data = kzone.util.decodeHtmlEntity(result.document.cacheMsg || '');
                        $('#editBox').val(replace_cache_data);
        
                        $editor.data('cache', result.document);
                        $editor.data('cache_source', resplace_cache_data);
                    } else {
                        const pretty_json = JSON.stringify(temp_doc, null, 2);
                        $('#editBox').val(pretty_json);
                    }
                } else if (task === 'prompt') {
                    const pretty_json = JSON.stringify(data.result, null, 2);
                    $('#editorBox').val(pretty_json);   // 화면 표시
                    $editor.data('cache', data.result); // data-* 속성으로 저장
                    $editor.data('cache_source', pretty_json); // data-* 속성으로 변환된 원본 저장
                } else {
                    $('#editorBox').val('');   // clear
                    $editor.data('cache', ''); // clear
                    $editor.data('cache_source', ''); // clear
                }
            } else {
                addErrorMessageToChatBox('데이터 수신 실패!');
            }
            
        } catch (e) {
            console.error('응답 파싱 오류:', e);
            addErrorMessageToChatBox("응답 파싱 오류: " + e.message);
        }
      
    }

    /* 소요시간 계산 */
    function diff_datetime(req, res) {
        const reqTime = new Date(req);
        const resTime = new Date(res);
        const diff = resTime - reqTime;
        return diff / 1000;
    }

    /* 
     * sse 방식 응답메시지 출력 
     * deprecated
     */
    function handleSSEMessage(e) {
    }

    /* sse 에러 핸들러 */
    function handleSseError(e) {
        const $chatBox = $('#chatBox');
        switch(e.target.readyState) {
            case EventSource.CONNECTING:
                $chatBox.append('<div class="chat-message error">연결 중...</div>');
                break;
            case EventSource.CLOSED:
                $chatBox.append('<div class="chat-message error">연결이 종료되었습니다.</div>');
                break;
            default:
                $chatBox.append('<div class="chat-message error">오류 발생: ' + e.message + '</div>');
        }
        $chatBox.scrollTop($chatBox[0].scrollHeight);
        e.target.close();
    }

    /* 요청 메시지 본문 생성 - MenuManager 사용 */
    function create_body(body_type) {
        if (!body_type) return null;
        
        // 사용자 입력이 있는 경우 MenuManager에 설정
        const chatInput = $('#chatInput').val().trim();
        if (chatInput) {
            MenuManager.setUserInput(body_type, chatInput);
        }
        
        return MenuManager.createQueryByMenu(body_type);
    }

    /* 요청 메시지 생성 */
    function generate_payload() {
        const body_type = $('#choose_menu').val().trim();  // 선택한 메뉴 아이디
        const body = create_body(body_type);  // 지식, 캐시, 프롬프트 메시지 본문 생성.
        const request_id = requestRandomKey();  // 요청 ㅁ시지 키 생성.
        if (body) {
            const streaming = $('#opt-stream').is(':checked');
            const quick = $('#opt-quick').is(':checked');
            const tag = $('#opt-tag').is(':checked');
            const payload = {
                common: {
                    iid: body_type,
                    user: '${user_id}',
                    req: request_id,
                    type: '${api_type}'
                },
                option: {
                    cache: quick,
                    stream: streaming,
                    tags: tag
                },
                query: body
            };
            return payload;
        } else {
            throw new Error("요청 메시지 본문 생성 실패");
        }
    }

    /* 요청 메시지 키 생성 */
    function requestRandomKey() {
        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        const randomHashKey = btoa(String.fromCharCode.apply(null, array));
        const safeKey = randomHashKey.replace(/\//g, '_')
                                     .replace(/\+/g, '_')
                                     .replace(/=+$/, '');
        return safeKey;
    }


    /* 
     * TODO: 상품 찾기 팝업 호출 
     */
    function search_products() {
        alert('상품 찾기 팝업을 호출합니다.');
    }

    /* 선택한 상품 화면 표시 - MenuManager 사용 */
    function renderSelectedProducts() {
        const currentMenu = MenuManager.getCurrentMenu();
        if (currentMenu) {
            MenuManager.renderSelections(currentMenu);
        }
    }

    /* 상품 리스트에서 선택 상품 제거 - MenuManager 사용 */
    function removeProduct(id) {
        MenuManager.removeItem('product', id);
        // 하위 호환성을 위해 selectedProducts 동기화
        const currentMenu = MenuManager.getCurrentMenu();
        selectedProducts = MenuManager.getSelections(currentMenu).products;
    }

    /* 탭 메뉴 변경 이벤트 - MenuManager 연동 */
    function tab_change(tab) {
        const previous_tab = $('#choose_menu').val();
        const current_tab = $(tab).attr('data-tab');
        const display_name = $(tab).attr('data-display');
        
        // 페이지 상태 업데이트
        $('#choose_menu').val(current_tab);
        $('#ai_subject').text('[테스트] AI ' + display_name);
        $('#chatInput').val('');

        // MenuManager에 현재 메뉴 설정
        MenuManager.setCurrentMenu(current_tab);

        // 메뉴 변경 시 프롬프트 command 변경
        const data_prompt_id = current_tab + '.prompt.get';
        setObjectDataAttr('prompt-id', data_prompt_id);

        // 메뉴 변경 시 자유질의 프롬프트 영역 초기화
        prompt_change(current_tab);
        init_user_inputobjects(current_tab);

        // 하위 호환성을 위해 selectedProducts 동기화
        selectedProducts = MenuManager.getSelections(current_tab).products;

        // 선택된 항목 표시
        MenuManager.renderSelections(current_tab);
    }
    
    function setObjectDataAttr(key, value) {
        const $settings = $('#btn-settings');
        if ($settings.length === 0) {
            console.error('설정 버튼이 존재하지 않습니다:', key);
            return;
        }
        $settings.data('prompt-id', value);
    }
    
    function prompt_change(menuId) {
        $('.menu-input').hide();
        $(`#menu-\${menuId}`).show();
    }
    
    function init_user_inputobjects(menuId) {
        const $menu = $(`#menu-\${menuId}`);
        if ($menu.length === 0) {
            console.error('메뉴가 존재하지 않습니다:', menuId);
            return;
        }
        $menu.find('input, textarea, select').forEach(function(){
            const $el = $(this);
            const tag = this.tagName.toLowerCase();
            if (tag === 'select') {
                this.selectedIndex = 0; // 선택 필드 초기화
            } else if ($el.is(':checked') || $el.is(':radio')) {
                $el.prop(':checked', false); // 체크박스/라디오 초기화
            } else {
                $el.val(''); // 입력 필드 초기화
            }
        });
    }

    /* 태그 정보에서 정보조회 이벤트 */
    function fn_prodDetailSummary(tagId, prodNm) {
        $('#choose_menu').val('2003');
        selectedProducts = [];
        selectedProducts.push({
            id: tagId,
            name: prodNm,
            srvtp: 'P',
            __index: 0,
            __original_index: 0
        });
        send_message();
    }

    /* 팝업창에서 데이터 전달 함수 - MenuManager 사용 */
    function onItemSelect(items) {
        if (!Array.isArray(items) || items.length === 0) {
            console.error('선택된 아이템이 없습니다.');
            return;
        }
        
        const currentMenu = MenuManager.getCurrentMenu();
        const products = [];
        
        items.forEach((item, index) => {
            if (item.if_cd && item.pd_name) {
                products.push({
                    id: item.if_cd,
                    name: item.pd_name,
                    srvtp: item.srvtp,
                    __index: item.__index,
                    __original_index: item.__original_index
                });
            }
        });

        MenuManager.setProducts(currentMenu, products);
        // 하위 호환성을 위해 selectedProducts 동기화
        selectedProducts = products;
    }

    /* 채팅 창 초기화 */
    function cleanChatBox() {
        const $chatBox = $('#chatBox');
        $chatBox.htnl('');
    }

    /* TODO: 캐시 데이터 요청/갱신/삭제 패킷 생성. */
    function generate_cache_payload(commandId) {
        if (!commandId) {
            console.error('commandId가 없습니다.');
            return;
        }

        const commands = commandId.split('.');
        if (commands.length <4) {
            return JSON.stringify({
                error: '잘못된 commandId 형식입니다.'
            });
        }
        
        const user = '${user_id}';
        const command = commands[0];
        const action = commands[2].toUpperCase();
        const cache_key = commands[3];
        const actions = {
            'GET': (cache_key) => {
                return {
                    note: '캐시데이터 조회',
                    key: cache_key,
                    index: 'search-cache-idx'
                };
            },
            'UPD': (cache_key) => {
                const htmlUnicodeEncode = function(s) {
                    return s.replace(/&/g, '&#38;')
                            .replace(/</g, '&#38;')
                            .replace(/>/g, '&#38;')
                            .replace(/"/g, '&#38;')
                            .replace(/'/g, '&#38;')
                            .replace(/\//g, '&#38;');
                }
                const changed = $('#editorBox').val();
                const new_cache_data = htmlUnicodeEncode(changed);
                const cache = $('.popup-editor').data('cache');
                const {cacheKey} = cache || {};
                console.log('캐시 데이터 갱신:', cache_key, new_cache_data);
                return {
                    note: '캐시데이터 갱신',
                    cache: {
                        mode: 'UPDATE',
                        key: cache_key,
                        msg: new_cache_data,
                        index: 'search-cache-idx'
                    }
                };
            },
            'DEL': (cache_key) => {
                const cache = $('.popup-editor').data('cache');
                const {cacheKey, docId} = cache || {};
                console.log('캐시 데이터 삭제:', cache_key, docId);
                return {
                    note: '캐시데이터 삭제',
                    cache: {
                        mode: 'DELETE',
                        key: docId,
                        index: 'search-cache-idx'
                    }
                };
            }
        };

        if (actions[action]) {
            const body = actions[action](cache_key);
            const request_id = requestRandomKey();
            if (body) {
                const streaming = $('#opt-stream').is(':checked');
                const quick = $('#opt-quick').is(':checked');
                const tags = $('#opt-tag').is(':checked');
                const command_iid = commands.slice(0,3).join('.');
                const payload = {
                    common: {
                        iid: command_iid,
                        user: '${user_id}',
                        req: request_id,
                        type: '${api_type}'
                    },
                    option: {
                        cache: quick,
                        stream: streaming,
                        tags: tags
                    },
                    query: body
                };
                return payload;
            } else {
                console.error('캐시 요청 메시지 생성 실패');
                throw new Error('캐시 요청 메시지 생성 실패');
            }
        } else {
            console.error('알 수 없는 액션:', action);
            return null;
        }
    }

    /*
     * 프롬프트 메시지 생성.
     */
    function generate_prompt_payload(commandId) {
        if (!commandId) {
            console.error('commandId가 없습니다.');
            return;
        }

        const commands = commandId.split('.');
        if (commands.length < 4) {
            return JSON.stringify({ error: 'incomplete commandId format' });
        }

        const user = '${user_id}';
        const command = commands[0];
        const task = commands[1];
        const action = commands[2].toUpperCase();
        const cache_key = commands[3];
        
        const actions = {
            'GET': (cache_key) => ({
                    note: '프롬프트 조회',
                    aiprompt: {
                        mode: 'SELECT',
                        key: 'P' + command
                    }
            }),
            'UPD': (cache_key) => {
                const changed = $('#editorBox').val();
                console.log('프롬프트 갱신:', cache_key, changed);
                return {
                    note: '프롬프트 갱신',
                    aiprompt: {
                        mode: 'UPDATE',
                        key: 'P' + command,
                        msg: changed
                    }
                };
            }
        };

       if (actions[action]) {
            const body = actions[action](cache_key);
            const request_id = requestRandomKey();
            if (body) {
                const streaming = $('#opt-stream').is(':checked');
                const quick = $('#opt-quick').is(':checked');
                const tag = $('#opt-tag').is(':checked');

                const command_iid = commands.slice(0, 3).join('.');
                const payload = {
                    common: {
                        iid: command_iid,
                        user: '${user_id}',
                        req: request_id,
                        type: '${api_type}'
                    },
                    option: {
                        cache: quick,
                        stream: streaming,
                        tags: tag
                    },
                    query: body
                };
                return payload;
            } else {
                console.error('프롬프트 요청 메시지 생성 실패');
                throw new Error('프롬프트 요청 메시지 생성 실패');
            }
        } else {
            console.error('알 수 없는 액션:', action);
            return null;
        }
    }

    /* 
     * 팝업 창 캐시 조회
     */
    function send_cache_rest(commandId) {
        if (!commandId) {
            console.error('commandId가 없습니다.');
            return;
        }

        const commands = commandId.split('.');
        const command = commands[0];
        const task = commands[1];
        const action = commands[2].toUpperCase();
        const cache_key = commands[3];

        const chatInput = $('#chatInput').val().trim();
        const payload = (task === 'cache') ? generate_cache_payload(commandId) : (task === 'prompt') ? generate_prompt_payload(commandId) : null;
        const input = getRequestMessageTitle(chatInput) || payload.query.note + '[' + payload.common.iid + ']';
        const apiRequest = JSON.stringify(payload);

        prepareMessage(input);

        if (action == 'GET') {
            const create_handle = (task) => (resp) => {
                handleRestApiCache(resp, task);
            };
            const handle = create_handle(task);
            sendAjaxRequest('/api/' + task + '/' + action.toLowerCase(), apiRequest, handle);
        } else {
            const create_handle = (task) => (resp) => {
                if (resp?.result?.success) {
                    const action_name = (action === 'UPD') ? '갱신' : (action === 'DEL') ? '삭제' : '조회';
                    alert( `캐시 ${action_name} 작업이 성공적으로 완료되었습니다.`);
                    closeCacheEditor();
                } else {
                    alert( resp.result.message || "캐시 작업에 실패했습니다.");
                }
            };

            try {
                const handle = create_handle(task);
                sendAjaxRequest('/api/' + task + '/' + action.toLowerCase(), apiRequest, handle);
            } catch (error) {
                alert(`캐시 요청 처리 중 오류가 발생했습니다: ${error.message}`);
            }
        }
        $('#chatInput').val('');
    }

    /* 캐시 편집 팝업 열기 a*/
    function openEditor(commandId, type) {
        $('#editorBox').val('');

        if (command) {
            const popup_title = {
                'CACHE': () => {
                    return '캐시 편집기';
                },
                'PROMPT': () => {
                    return '프롬프트 편집기';
                }
            };

            if (type === 'CACHE') {
                send_cache_rest(commandId);
            } else if (type === 'PROMPT') {
                send_cache_rest(commandId);
            } else {
                console.error('알 수 없는 편집 타입:', type);
                return;
            }

            const $editor = $('.popup-editor');
            const $header = $('.popup-header');
            const editor_title = popup_title[type]();
            $header.text(editor_title);

            $editor.css('diplay', 'false');
            $editor.data('command', commandId);
            $editor.data('handler_type', type);
            $editor.show();

            const winW = $(window).width();
            const winH = $(window).height();
            const popupW = $editor.outerWidth();
            const popupH = $editor.outerHeight();
            const left = (winW - popupW) / 2;
            const top = (winH - popupH) / 2;

            $editor.css({
                left: left + 'px',
                top: top + 'px',
                transition: 'none'
            });

            const $editorBody = $editor.find('.popup-body');
            const bodyHeight = $editorBody.outerHeight();

            $('#editorBox').css({
                height: bodyHeight - 100 + 'px'
            });
        }
    }

    /*
     * 에디터 창 닫기.
     */
    function closeCacheEditor() {
        $('#editBox').val('');
        const $editor = $('.popup-editor');
        $editor.fadeOut(200);
        $editor.data('cache', null);
        $editor.data('cache_source', null);
    }

    function saveCache() {
        const changed = $('#editorBox').val();
        const source = $('.popup-editor').data('cache_source');
        if (changed === source) {
            alert('변경된 내용이 없습니다.');
            return;
        } else {
            const $editor = $('.popup-editor');
            const handler_type = $editor.data('handler_type');
            let command_id = '';
            switch(handler_type) {
                case 'CACHE':
                    const $editorButton = $('.icon-button.edit');
                    command_id = $editorButton.data('command');
                    send_cache_rest(command_id.replace('.get', '.upd'));
                    break;
                case 'PROMPT':
                    const $editor = $('.popup-editor');
                    command_id = $editor.data('command');
                    send_cache_rest(command_id.replace('.get', '.upd'));
                    break;
                default:
                    alert('알 수 없는 편집 타입입니다.');
                    return;
            }
        }
    }

    /*
     * 캐시 삭제 버튼 이벤트 핸들러.
     */
    function deleteCache() {
        const $editor = $('.popup-editor');
        const handler_type = $editor.data('handler_type');
        switch(handler_type) {
            case 'CACHE':
                const command_id = $('.icon-button.edit').data('command');
                send_cache_rest(command_id.replace('.get', '.del'));
                break;
            case 'PROMPT':
                alert('프롬프트 편집기는 삭제 기능이 없습니다.');
                break;
            default:
                alert('알 수 없는 편집 타입입니다.');
                return;
        }
    }

    /*
     * 설정 버튼 클릭 이벤트 핸들러
     *  - 프롬프트 편집기 열기
     */
    function settings() {
        const $settings = $('#btn-settings');
        if ($settings.length === 0) {
            console.error('설정 버튼이 존재하지 않습니다.');
            return;
        }
        const command_id = $settings.data('prompt-id');
        if (!command_id) {
            console.error('설정 버튼에 prompt-id가 없습니다.');
            return;
        }
        openEditor(command_id, 'PROMPT');
    }

</script>
<section class="content" id="content">
    <c:if test="${not empty tabMenuList}">
        <input type="hidden" id="choose_menu" value="${tabMenuList[0].cl_hiery_ch_cd}">
    </c:if>
    <c:if test="${empty tabMenuList}">
        <input type="hidden" id="prompt-id">
    </c:if>

    <div class="tabMenu" data-selecttor="tab">
        <ul>
            <c:forEach items="${tabMenuList}" var="menu" varStatus="status">
                <c:if test="${menu.cl_hiery_ch_cd ne '2003'}">
                    <li>
                        <a href="#" onclick="tab_change(this)" data-tab="${menu.cl_hiery_ch_cd}" data-display="${menu.cl_hiery_ch_nm}" <c:if test="${status.first}">class="current"</c:if>>
                            ${menu.cl_hiery_ch_nm}
                        </a>
                    </li>
                </c:if>
            </c:forEach>
        </ul>
    </div>
    <!--
        <div class="tab_menu">
            <ul>
                <li data-tab="2001" data-display="상품요약" onclick="tab_change(this)">상품요약</li>
                <li data-tab="2002" data-display="상품비교" onclick="tab_change(this)">상품비교</li>
                <li data-tab="2003" data-display="태그정보" onclick="tab_change(this)">태그정보</li>
                <li data-tab="2004" data-display="상품상세" onclick="tab_change(this)">상품상세</li>
                <li data-tab="2005" data-display="상품상세(요약)" onclick="tab_change(this)">상품상세(요약)</li>
                <li data-tab="2006" data-display="T카드요약" onclick="tab_change(this)">T카드요약</li>
                <li data-tab="2007" data-display="복지요약" onclick="tab_change(this)">복지요약</li>
                <li data-tab="2008" data-display="조합상품요약" onclick="tab_change(this)">조합상품요약</li>
            </ul>
        </div>
    -->


    <h2 id="ai_subject" class="title">[테스트] AI 상품요약</h2>

    <div class="chat-box" id="chatBox"></div>

    <div class="chat-container">
        <div class="option-bar">
            <div class="option-left">
                    <label for="opt-stream">스트리밍:</label>
                    <input type="checkbox" id="opt-stream" checked>
                    <label for="opt-quick">빠른응답:</label>
                    <input type="checkbox" id="opt-quick" checked>
                    <label for="opt-tag">태그정보:</label>
                    <input type="checkbox" id="opt-tag" checked>
            </div>
            <div class="option-right">
                <button class="btn type1" onclick="clearChatBox()">대화내용지우기</button>
                <button class="btn type1" onclick="settings()">설정</button>
            </div>
        </div>
    </div>

    <div class="input-area">
        <div class="input-form">
            <div class="menu-input" id="menu-2004">
                <textarea id="chatInput" placeholder="메시지를 입력하세요..."></textarea>
            </div>

            <div class="menu-input" id="menu-2001">
                <label for="productSelect">상품 선택:</label>
                <select id="productSelect">
                    <option value="00">선택안함</option>
                    <!-- 상품 목록 옵션 추가 -->
                </select>
            </div>
            <div class="menu-input" id="menu-2002">
                <label for="sourceProductSelect">대상상품 선택:</label>
                <select id="sourceProductSelect">
                    <option value="00">선택안함</option>
                    <!-- 상품 목록 옵션 추가 -->
                </select>
                <label for="targetProductSelect">비교상품 선택:</label>
                <select id="targetProductSelect">
                    <option value="00">선택안함</option>
                    <!-- 상품 목록 옵션 추가 -->
                </select>
            </div>

            <div class="menu-input" id="menu-2005">
                <label for="productSelect">상품 목차:</label>
                <select id="productSelect">
                    <option value="00">선택안함</option>
                    <!-- 상품 목록 옵션 추가 -->
                </select>
            </div>

            <div class="menu-input" id="menu-2006">
                <label for="cardSelect">제휴카드:</label>
                <select id="cardSelect">
                    <option value="00">선택안함</option>
                    <!-- 상품 목록 옵션 추가 -->
                </select>
            </div>
            
            <div class="menu-input" id="menu-2007">
                <label for="welfareSelect">복지할인:</label>
                <select id="welfareSelect">
                    <option value="00">선택안함</option>
                    <!-- 상품 목록 옵션 추가 -->
                </select>
            </div>

            <div class="menu-input" id="menu-2008">
                <label for="bundleSelect">복지할인:</label>
                <select id="bundleSelect">
                    <option value="00">선택안함</option>
                    <!-- 상품 목록 옵션 추가 -->
                </select>
            </div>

        </div>
        <div class="send-area">
            <button class="btn btn-send" onclick="send_message()">전송</button>
        </div>
    </div>

    <!-- 팝업 레이어 배경 -->
    <div class="popup-overlay" id="popupOverlay"></div>
    <!-- 팝업 에디터 -->
    <div class="popup-editor">
        <div class="popup-header">캐시 편집기</div>
        <div class="popup-body">
            <textarea id="editBox" placeholder=""></textarea>
        </div>
        <div class="popup-footer">
            <button class="btn btn-save" onclick="saveCache()">저장</button>
            <button class="btn btn-save" onclick="deleteCache()">삭제</button>
            <button class="btn btn-close" onclick="closeCacheEditor()">닫기</button>
        </div>
    </div>

</section>
