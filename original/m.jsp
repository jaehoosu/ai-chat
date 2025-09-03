<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page trimDirectiveWhitespaces="true" %>
<%@include file="../common/include/taglib.jsp"%>
<%--
Class Name: aimgmt.jsp
Description: AI Management 페이지
Modification Information
수정일 수정자 수정내용
--------------------------
2025.05.26 jaehoosu 신규

author: jaehoosu
since: 2025.05.26
--%>

<style> 
/* 탭 메뉴 스타일 */ 
#tabContainer { list-style: none; padding: 0; margin: 0; display: flex; border-bottom: 2px solid #e9ecef; /*background: #f8f9fa;*/ border-radius: 8px 8px 0, 0; overflow: hidden; } 
#tabContainer li { margin: 0; } 
#tabContainer a { display: block; padding: 15px 25px; text-decoration: none; color: #6c757d; background: #f8f9fa; border: none; transition: all 0.3s ease; cursor: pointer; font-weight: 500; border-right: 1px solid #e9ecef; border-bottom: 3px solid transparent; } 
#tabContainer a:hover { background: #e9ecef; color: #495057; } 
#tabContainer a.current { background: white; color: #00b5ad; font-weight: 600; border-bottom-color: #00b5ad; } 
/* 폼 컨테이너 스타일 */ 
#formContainer { flex: 1; background: white; border-top: none; border-radius: 0 0 8px 8px; padding: 10px; } 
.menu-form { display: none; } 
.menu-form.active { display: block; animation: fadeIn 0.3s ease; } 
@Keyframes fadeIn { from {opacity:0, transform: translateY(10px);} to {opacity:1, transform: translateY(0);} } 
.from-group { margin-bottom: 25px; } 
.from-group label { display: block; margin-bottom: 8px; font-weight: 600; color: #495057; font-size: 14px; } 
.from-group select,
.from-group input,
.from-group textarea { 
    width: 100%; 
    max-width: 400px; 
    padding: 12px 15px; 
    border: 1px solid #ced4da; 
    border-radius: 6px; 
    font-size: 14px; 
    transition: border-color 0.3s ease, box-shadow 0.3s ease; 
    box-sizing: border-box; 
} 
.from-group select:focus, 
.from-group input:focus, 
.from-group textarea:focus { outline: none; border-color: #007bff; box-shadow: 0 0 0 3px rgba(0,125,255, 0.1); } 
.from-group textarea { min-height: 100px; resize: vertical; } 
.from-group select:disabled, 
.from-group input:disabled, 
.from-group textarea:disabled { border-color: #f8f9fa; color: #6c757d; cursor: not-allowed; } 
.empty-form-message { text-align: center; color: #6c757d; font-style: italic; padding: 40px 0; } 
/* 프롬프트 영역 */ 
.input-area { display:flex; align-items:flex-start; gap:10px; margin-top:15px; } 
/* 입력 영역 */ 
.send-area { min-width:80px; display:flex; justify-content:center; } 
.btn-send { width:100%; height:80px; font-size:16px; cursor:pointer; }
</style> 
<script src="${pageContext.request.contextPath}/js/kzone/kzone.ai.tabsync.js"></script>
<script src="${pageContext.request.contextPath}/js/kzone/kzone.ai.chatbox.js"></script> 
<script src="${pageContext.request.contextPath}/js/kzone/kzone.ai.httputil.js"></script> 
<script src="${pageContext.request.contextPath}/js/kzone/kzone.ai.popup.js"></script> 
<script type="text/javascript">
let $tabMenu;
let $chatBox;

const menuConfigs = {
                '2001': {
                    elements: {
                        'productSelect': { type: 'select', defaultValue: '00', label: '상품 선택' }
                    }
                },
                '2002': {
                    elements: {
                        'sourceProduct': { type: 'select', defaultValue: '00', label: '대상상품' },
                        'targetProduct': { type: 'select', defaultValue: '00', disabled: true, label: '비교상품' }
                    }
                },
                '2004': {
                    elements: {
                        'queryInput': { type: 'textarea', defaultValue: '', label: '질문 입력', placeholder: '상품에 대해 궁금한 점을 입력하세요...' }
                    }
                },
                '2005': {
                    elements: {
                        'productSelect': { type: 'select', defaultValue: '00', label: '상품 선택' }
                    }
                },
                '2006': {
                    elements: {
                        'cardSelect': { type: 'select', defaultValue: '00', label: '제휴카드 ' }
                    }
                },
               '2007': {
                   elements: {
                       'welfareSelect': { type: 'select', defaultValue: '00', label: '복지할인 ' }
                   }
               },
               '2008': {
                   elements: {
                       'bundleSelect': { type: 'select', defaultValue: '00', label: '결합상품 ' }
                   }
               }
            };
            
const viewOptionData = {
    'productSelect': [
        <c:forEach var="product" items="${productList}" varStatus="status">
            {
                value: '<c:out value="${product.key}" />',
                text: '<c:out value="${product.value}" />'
            }<c:if test="${!status.last}">,</c:if>
        </c:forEach>
    ],
    'cardSelect': [
        <c:forEach var="card" items="${cardList}" varStatus="status">
            {
                value: '<c:out value="${card.key}" />',
                text: '<c:out value="${card.value}" />'
            }<c:if test="${!status.last}">,</c:if>
        </c:forEach>
    ],
    'welfareSelect': [
        <c:forEach var="welfare" items="${welfareList}" varStatus="status">
            {
                value: '<c:out value="${welfare.key}" />',
                text: '<c:out value="${welfare.value}" />'
            }<c:if test="${!status.last}">,</c:if>
        </c:forEach>
    ],
    'bundleSelect': [
        <c:forEach var="bundle" items="${bundleList}" varStatus="status">
            {
                value: '<c:out value="${bundle.key}" />',
                text: '<c:out value="${bundle.value}" />'
            }<c:if test="${!status.last}">,</c:if>
        </c:forEach>
    ],
    'sourceProduct': [
        <c:forEach var="product" items="${productList}" varStatus="status">
            {
                value: '<c:out value="${product.key}" />',
                text: '<c:out value="${product.value}" />'
            }<c:if test="${!status.last}">,</c:if>
        </c:forEach>
    ],
    'targetProduct': [
        <c:forEach var="product" items="${productList}" varStatus="status">
            {
                value: '<c:out value="${product.key}" />',
                text: '<c:out value="${product.value}" />'
            }<c:if test="${!status.last}">,</c:if>
        </c:forEach>
    ],
};

/**
 * 공통 옵션 값 가져오기
 */
function _getCommonOptions() {
    return {
        stream: $('#opt-stream').is(':checked'),
        cache: $('#opt-quick').is(':checked'),  
        tags: $('#opt-tag').is(':checked')
    };
}

/**
 * 요청 ID 생성 (랜덤 키)
 */
function _generateRequestId() {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    const randomHashKey = btoa(String.fromCharCode.apply(null, array));
    return randomHashKey.replace(/\//g, '_')
                        .replace(/\+/g, '_')
                        .replace(/=+$/, '');
}

/**
 * 메뉴별 query body 생성
 */
function _createQueryBody(menuId, formData) {
    const queryBodies = {
        '2001': () => {
            // 상품정보
            const productId = formData.productSelect?.value || '00';
            const productNm = formData.productSelect?.text || '';
            return {
                note: '상품요약',
                product: [
                    {
                        code: productId,
                        name: productNm
                    }
                ]
            };
        },
        
        '2002': () => {
            // 상품비교
            const sourceId = formData.sourceProduct?.value || '00';
            const targetId = formData.targetProduct?.value || '00';
            const sourceNm = formData.sourceProduct?.text || '';
            const targetNm = formData.targetProduct?.text || '';
            return {
                note: '상품비교',
                comparison: {
                    source: {
                        code: sourceId,
                        name: sourceNm
                    },
                    target: {
                        code: targetId,
                        name: targetNm
                    }
                }
            };
        },
        
        '2003': () => {
            // 상품태그
            2003
            const productId = formData.selectedTag || '00';
            const productNm = formData.selectedProduct || '';
            return {
                note: '태그상세',
                product: [
                    {
                        code: productId,
                        name: productNm
                    }
                ]
            };
        },
        
        '2004': () => {
            // 지식질문
            const query = formData.queryInput?.value || '';
            return {
                note: "지식추천",
                prompt: {
                    sentence: query
                },
                product: []
            };
        },
        
        '2005': () => {
            // 상품목차
            const category = formData.productSelect?.value || '00';
            const categoryNm = formData.productSelect?.text || '';
            return {
                note: '목차',
                topic: {
                    resp: 'html'
                },
                product: [
                    {
                        code: category,
                        name: categoryNm
                    }
                ]
            };
        },
        
        '2006': () => {
            // 제휴카드
            const cardId = formData.cardSelect?.value || '00';
            const cardNm = formData.cardSelect?.text || '';
            return {
                note: 'KT제휴카드',
                card: [{
                    code: cardId,
                    name: cardNm
                }]
            };
        },
        
        '2007': () => {
            // 복지할인
            const welfareId = formData.welfareSelect?.value || '00';
            const welfareNm = formData.welfareSelect?.text || '';
            return {
                note: '복지할인',
                card: [{
                    code: welfareId,
                    name: welfareNm
                }]
            };
        },
        
        '2008': () => {
            // 결합상품
            const bundleId = formData.bundleSelect?.value || '00';
            const bundleNm = formData.bundleSelect?.text || '00';
            return {
                note: '결합상품',
                bundle: {
                    code: '',
                    name: bundleNm
                }
            };
        }
    };
    
    const generator = queryBodies[menuId];
    return generator ? generator() : null;
}    
function _showResult(title, content, isError = false) {
    console.log( content );
    $chatBox.chatBox('addErrorMessage', {content: content});
}

function _isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
}

function _generatePayload() {
    if (!$tabMenu || !$tabMenu.currentMenuId) {
        showResult('❌ 페이로드 생성 실패', 'TabFormSync가 초기화되지 않았거나 선택된 메뉴가 없습니다.', true);
        return null;
    }
    
    try {
        // 태그정보 조회인지 판단.
        const tagData = $tabMenu.getTagData('2003');
        $tabMenu.clearTagData('2003');
        
        const currentData = tagData ? tagData : $tabMenu.getCurrentData();
        const menuId      = tagData ? '2003' : currentData.menuId;
        const formData    = tagData ? currentData : currentData.formData;
        const options     = _getCommonOptions();
        const requestId   = _generateRequestId();
        
        if (_isEmptyObject(formData)) {
            _showResult('❌ Query Body 생성 실패', `메뉴 ID \${menuId}에 대한 query body를 생성할 수 없습니다.`, true);
            return null; 
        }
        
        
        // query body 생성
        const queryBody = _createQueryBody(menuId, formData);
        if (!queryBody) {
            _showResult('❌ Query Body 생성 실패', `메뉴 ID \${menuId}에 대한 query body를 생성할 수 없습니다.`, true);
            return null;
        }
        
        const payload = {
            common: {
                iid: menuId,
                user: '${user_id}',
                req: requestId,
                type: '${api_type}'
            },
            option: {
                cache: options.cache,           // 캐시 사용 여부
                stream: options.stream,         // 스트리밍 여부
                tags: options.tags              // 태그 정보 포함 여부
            },
            query: queryBody
        };
        return payload;
    } catch (err) {
        console.error(err);
        return null;
    }
}
/**
 * 요청 결과 꺼내기.
 */
function _getContent(result) {
    const content = result.summaryContent 
                || result.prodCompare 
                || result.prodDetailSummary 
                || result.prodDetailTitle 
                || result.ktCardSummary 
                || result.welfareSummary
                || result.answer 
                || result.combSummary
                || "내용없음";
    return content;
}

function _diff_datetime(req, res) {
    const t1 = new Date(req);
    const t2 = new Date(res);
    const dt = t2 - t1;
    const elapse = dt / 1000;
    return elapse;
}

/*
 * 응답데이터에서 해시키 확인 및 추출. 
 */
function _retrieveCacheKeyInResponse(result) {
    const handlers = {
        '2001': (result) => {return result.cacheKey; },
        '2002': (result) => {return result.tgtProdId + '_' + result.comprProdId;},
        '2003': (result) => {return result.tagId;},
        '2004': (result) => {return null;},
        '2005': (result) => {return null;},
        '2006': (result) => {return result.cardCd;},
        '2007': (result) => {return result.welfareCd;},
        '2008': (result) => {return result.combCd || result.cacheKey;}
    };
    if (handlers[result.infId]) {
        return handlers[result.infId]?.(result);
    }
}

/**
 * TODO: 캐시 데이터 요청/갱신/삭제 패킷 생성.
 */
function _generate_cache_payload(commandId, popup) {
    if (!commandId) return null;
    
    const commands = commandId.split('.');
    if (commands.length < 4) return JSON.stringify({ error: "Incomplete commandId" });
    
    const user = '${user_id}';
    const command = commands[0];
    const action = commands[2].toUpperCase();
    const cache_key = commands[3];
    
    const actions = {
        'GET': (cache_key) => ({
            note: '캐시데이터 조회',
            cache: {
                mode: 'SELECT',
                key: cache_key,
                index: 'search-cache-idx'
            }
        }),
        'UPD': (cache_key) => {
            const htmlUnicodeEncode = function(s) {
                return s.replace(/&/g, '&#38;')
                        .replace(/</g, '&#38;')
                        .replace(/>/g, '&#38;')
                        .replace(/"/g, '&#38;')
                        .replace(/'/g, '&#38;')
                        .replace(/\//g, '&#38;');
            };
            
            const content = popup.getData();
            const new_cache_msg = htmlUnicodeEncode(content);
            //const cache = $('.popup-editor').data('cache');
            const {cacheKey} = cache;
            console.log( new_cache_msg );
            
            return {
                note: '캐시데이터 갱신',
                cache: {
                    mode: 'UPDATE',
                    key: cacheKey,
                    msg: new_cache_msg,
                    index: 'search-cache-idx'
                }
            };
        },
        'DEL': (cache_key) => {
            // TODO: 값 속성으로 셋팅하고 전달 받기. 
            const cache = $('.popup-editor').data('cache');
            const {cacheKey, docId} = cache;
            console.log('cache key: ' + cacheKey + ', docId: ' + docId );
            return {
                note: '캐시데이터 삭제',
                cache: {
                    mode: 'DELETE',
                    key: docId,
                    index: 'search-cache-idx'
                }
            };
        },
    };
    
    /*
     * 메시지 생성.
     */
    if (actions[action]) {
        const body = actions[action](cache_key);
        const request_id = _generateRequestId();
        if (body) {
            const streaming = $('#opt-stream').is(':checked');
            const quick = $('#opt-quick').is(':checked');
            const tag = $('#opt-tag').is(':checked');
            const command_iid = commands.slice(0,3).join('.');
            const payload = {
                common: {
                    iid: command_iid,
                    user: '${user_id}',
                    req: request_id,
                    type: '${api_type}',
                },
                option: {
                    cache: quick,
                    stream: streaming,
                    tags: tag,
                },
                query: body
            };
            return payload;
        } else {
            return null;
        }
    } else {
        console.log('No handler for this case');
        return null;
    } 
}

/**
 * 프롬프트 메시지 생성
 */
function _generate_prompt_payload(commandId) {
    if (!commandId) return null;
    
    const commands = commandId.split('.');
    if (commands.length !== 3) return JSON.stringify({ error: "Incomplete commandId" });
    
    const user = '${user_id}';
    const command = commands[0];
    const action = commands[2].toUpperCase();
    const cache_key = commands[3];
    
    const actions = {
        'GET': (cache_key) => ({
            note: '프롬프트 데이터 조회',
            aiprompt: {
                mode: 'SELECT',
                key: 'P' + command
            }
        }),
        'UPD': (cache_key) => {
            const changed = $('#editorBox').val();
            console.log(changed);
            return {
                note: '프롬프트 데이터 갱신',
                aiprompt: {
                    mode: 'UPDATE',
                    key: 'P' + command,
                    msg: changed
                }
            };
        }
    };
    
    /*
     * 메시지 생성.
     */
    if (actions[action]) {
        const body = actions[action](cache_key);
        const request_id = _generateRequestId();
        
        if (body) {
            const streaming = $('#opt-stream').is(':checked');
            const quick = $('#opt-quick').is(':checked');
            const tag = $('#opt-tag').is(':checked');
            const command_iid = commands.slice(0,3).join('.');
            const payload = {
                common: {
                    iid: command_iid,
                    user: '${user_id}',
                    req: request_id,
                    type: '${api_type}',
                },
                option: {
                    cache: quick,
                    stream: streaming,
                    tags: tag,
                },
                query: body
            };
            return payload;
        } else {
            return null;
        }
    } else {
        console.log('No handler for this case');
        return null;
    } 
}

/**
 * extract response 
 */
function _extractResponseMessage(response, task) {
    const handle = {
                'PROMPT': (resp) => {
                    const prompt_json = JSON.stringify(resp?.result || '', null, 2);
                    return prompt_json;
                },
                'CACHE': (resp) => {
                    const cache_json = resp?.result?.document?.cacheMsg || '';
                    return cache_json;
                }
            };
    const task_name = task.toUpperCase();
    if (handle[task_name]) {
        const messages = handle[task_name](response);
        return messages;
    } else {
        return '';
    }
}

function _popupActionEventHandler(commandId, popup) {
    console.log( `\${commandId} \n \${popup}` );
    
    const commands = commandId.split('.');
    const command = commands[0];
    const task = commands[1];
    const action = commands[2].toUpperCase();
    const cache_key = commands[3];
    const payload = (task === 'cache') ? _generate_cache_payload(commandId, popup) : (task === 'prompt') ? _generate_prompt_payload(commandId, popup) : null;
    
    if (payload.error) {
        kzone.util.tbdAlert( '메시지 형식이 맞지 않습니다.' );
        return;
    }
    
    const url = '${pageContext.request.contextPath}/ai/' + task + '/' + action.toLowerCase();
    const apiRequest = JSON.stringify(payload);
    const options = {
        loading: kzone.util.loading,
        unloading: kzone.util.unloading
    };
    
    $.http.post(url, apiRequest, options)
        .then(response => {
            console.log(response);
        })
        .catch(error => {
            console.error(error);
        });
    
}

/**
 * 팝업 캐시/프롬프트 조회
 */
async function _send_cache_rest(commandId) {
    if (!commandId) return;
    
    const commands = commandId.split('.');
    const command = commands[0];
    const task = commands[1];
    const action = commands[2].toUpperCase();
    const cache_key = commands[3];
    const payload = (task === 'cache') ? _generate_cache_payload(commandId) : (task === 'prompt') ? _generate_prompt_payload(commandId) : null;
    
    if (payload.error) {
        kzone.util.tbdAlert( '메시지 형식이 맞지 않습니다.' );
        return;
    }
    
    const url = '${pageContext.request.contextPath}/ai/' + task + '/' + action.toLowerCase();
    const apiRequest = JSON.stringify(payload);
    const options = {
        loading: kzone.util.loading,
        unloading: kzone.util.unloading
    };
    
    const create_handlers = (task) => (resp, additionalData = null) => {
        console.log('INFO', 'Cache 팝업 열기 요청');
        console.log('task', task);
        console.log('resp', resp);
        console.log('add.', additionalData);
        
        const responseData = _extractResponseMessage(resp, task);
        const title = task.toUpperCase();
        
        const popup = PopupManager.show(
                                    task, 
                                    responseData, 
                                    {
                                        title: `\${title} `,
                                        buttonClass: 'btn type1',
                                        onSave: function(data, popup) {
                                            console.log('SAVE', 'Cache 저장 요청');
                                            const command_id = (task === 'prompt') ? commandId.replace('.get.', '.upd') : commandId.replace('.get.', '.upd.'); 
                                            _popupActionEventHandler(command_id, popup);
                                            popup.close();
                                        },
                                        onDelete: function(popup) {
                                            console.log('DELETE', 'Cache 삭제 요청');
                                            if (task === 'cache') {
                                                const command_id = commandId.replace('.get.', '.del.'); 
                                                _popupActionEventHandler(command_id, popup);
                                                popup.close();
                                            }
                                        },
                                        onClose: function(popup) {
                                            console.log('CLOSE', 'Cache 팝업 닫힘');
                                        }
                                    });
        console.log('SUCCESS', `팝업 생성 완료 (ID: \${popup.id})`);
    };
    const handle = create_handlers(task); 
                
    $.http.post(url, apiRequest, options)
        .then(response => {
            console.log(response);
            handle(response, {timestamp: Date.now()});
        })
        .catch(error => {
            console.error(error);
        });
}

function _addLog(msg) {
    console.log(`\${new Date().toLocaleTimeString()} - \${msg}`);
}
function _sendHandler(values, meta) {
    _addLog(`SEND handler called for menu \${meta.menuId}`);
    _addLog(`rawText: "\${meta.rawText}"`);
    _addLog(`formValues: \${JSON.stringify(values)}`);
    // 예: 비동기 시뮬레이션
    return new Promise((resolve) => setTimeout(() => { _addLog('Simulated send complete'); resolve(true); }, 600));
}



$(document).ready(function () {
	console.log('>> Page loading...');
    
    init_page();
    init_events();
});

function init_page() {
    /* TAB MENU */
    $tabMenu = new TabFormSync({
                                apiUrl: '${pageContext.request.contextPath}/ai/tabmenu',
                                configUrl: null, // 별도 설정 API URL (선택사항)
                                tabContainer: '#tabContainer',
                                formContainer: '#formContainer',
                                localMenuConfigs: menuConfigs,
                                useLocalData: true,
                                viewOptionData: viewOptionData,
                            });
    $tabMenu.init();
   
    /* CHAT-BOX */
    $chatBox = $('#chatBox');
    $chatBox.chatBox({
        height: '400px',
        autoScroll: true,
        enableTimestamp: true,
        onCacheAction: function(action, cacheKey, metadata) {
            console.log('캐시 액션 처리:', action, cacheKey, metadata);
            
            // 캐시 관리 팝업 처리
            if (action === 'manage') {
                console.log('캐시 관리 팝업 시뮬레이션:', cacheKey);
                const type = cacheKey.split('.');
                openEditor(cacheKey, type[1].toUpperCase());
                return;
            }
            
            // 기타 액션 처리 (삭제, 새로고침 등)
            if (action === 'delete') {
                console.log('캐시 삭제 API 호출 시뮬레이션:', cacheKey);
                // 예: await deleteCache(cacheKey);
            } else if (action === 'refresh') {
                console.log('캐시 새로고침 API 호출 시뮬레이션:', cacheKey);
                // 예: await refreshCache(cacheKey);
            }
            
            // 성공 메시지 표시
            const actionText = action === 'delete' ? '삭제' : '새로고침';
            alert(`캐시 ${actionText}가 성공적으로 처리되었습니다!\n\n캐시 키: ${cacheKey}\n명령어: ${metadata.command || 'N/A'}`);
        }
        
    });
}

function init_events() {
    $('#clean-chatbox').on('click', function(e){
        $chatBox.chatBox('clear');
    });
    
    $('#propmpt-mgmt').on('click', function(e){
        const commandId = $tabMenu.getCurrentData().menuId + '.prompt.get';
        openEditor(commandId, 'prompt'.toUpperCase());
    });
    
    $('#send-message').on('click', function(e){
        const payload = _generatePayload();
        if (!payload) {
            return;
        }
        
        $chatBox.chatBox('addRequestMessage', {
            content: `\${payload.query.note} 정보 조회 요청...`
        });
        
        const url = '${pageContext.request.contextPath}/ai/askByRest';
        const apiRequest = JSON.stringify(payload);
        const options = {
            loading: kzone.util.loading,
            unloading: kzone.util.unloading
        };
        $.http.post(url, apiRequest, options)
            .then(response => {
                console.log(response);
                let message;
                const data = kzone.util.isObject(response) ? response : JSON.parse(response);
                if (data?.result) {
                    const resultObject = data?.result;

                    // groupping
                    const user_id = resultObject.userId;
                    const req_key = resultObject.rqtKey;
                    const groupId = 'group-' + encodeURIComponent(user_id + '_' + req_key).replaceAll('%', '');
                    
                    // response content
                    const res_content = _getContent(resultObject);
                    
                    // elapse time
                    const elapsed_time = _diff_datetime(response.rqtDt, response.rspnDt);
                    const options = _getCommonOptions();
                    const cache_key = resultObject.infId + '.cache.get.' + _retrieveCacheKeyInResponse(resultObject);
                    
                    message = {
                        groupId: groupId,
                        content: res_content,
                        metadata: {
                            cacheYn: resultObject.cacheMsgYn,
                            cacheKey: cache_key,
                            responseTime: elapsed_time
                        },
                        isComplete: true
                    };
                } else {
                    message = {
                        content: '응답 메시지가 없습니다. 질의문을 입력하세요.',
                    };
                }
                $chatBox.chatBox('addResponseMessage', message);
            })
            .catch(error => {
                console.error(error);
            });
    });
    
    $('#closeEditor').on('click', function(e){
        closeCacheEditor();
    });
}

/* 캐시 편집 팝업 열기 */
function openEditor(commandId, type) {
    // TODO: loadCache();
    if (commandId) {
        if ( type === 'CACHE') {
            _send_cache_rest(commandId);
            console.log('---- cache loading -----');
        }
        else if (type === 'PROMPT') {
            _send_cache_rest(commandId);
            console.log('---- prompt loading -----');
        }
        else {
            return;
        }
    } 
}

/* 캐시 편집 팝업 닫기 */
function closeCacheEditor() {
    $('#editorBox').val('');
    $('.popup-editor').fadeOut(200);
}

 /**
  * 태그 정보에서 정보 조회 이벤트
  */
function fn_prodDetailSummary(tagId, prodNm) {
    
    if (typeof $tabMenu.setTagData === 'function') {
        $tabMenu.setTagData('2003', {
            selectedTag: tagId,
            selectedProduct: prodNm,
            clickedAt: new Date().toISOString(),
            source: 'tag_click'
        });
        
        $('#send-message').trigger('click')
    }
}
</script>
<div id="tabContainer"></div>

<div class="chat-box" id="chatBox">
	<!-- chat messages display area -->
</div>

<div class="chat-container">
    <div class="option-bar">
        <div class="option-left"> 
            <label> <input type="checkbox" id="#opt-stream">스트리밍 <label>
            <label> <input type="checkbox" id="opt-quick">빠른답변 <label>
            <label> <input type="checkbox" id="opt-tag">태그 </label>
        </div>
        <div class="option-right">
            <button class="btn type1" id="clean-chatbox">대화 지우기</button>
            <button class="btn type1" id="propmpt-mgmt">프롬프트 관리</button>
        </div>
    </div>
</div>
<div class="input-area">
    <div id="formContainer"></div>
    <div class="send-area">
        <button class="btn type2" id="send-message">전송</button>
    </div>
</div>
