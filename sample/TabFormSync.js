/**
 * TabFormSync - 간단하고 깔끔한 탭↔폼 동기화
 * 
 * 핵심만 구현:
 * - REST API 메뉴 데이터 로드
 * - 탭 생성 & 폼 생성
 * - 탭↔폼 동기화
 * - 폼 값 추출
 */
/**
 * TabFormSync
 *
 * Simple tab <-> form synchronization utility.
 *
 * Public API (brief):
 * - constructor(config)
 *   - config.apiUrl: REST endpoint for menu list
 *   - config.tabContainer: selector for tab container (default '#tabContainer')
 *   - config.formContainer: selector for form container (default '#formContainer')
 *   - config.useInternalCSS: boolean to enable built-in CSS (default true)
 *   - config.useLocalData / config.localMenuData: for testing with local menu arrays
 *   - config.onTabChange(menuId, menuName)
 *   - config.onFormChange(formValues)
 *
 * Methods:
 * - init(): load menus and build UI
 * - registerSendHandler(menuId, handler): register external SEND handler for a menu
 * - unregisterSendHandler(menuId): remove registered handler
 * - getValues(menuId?): returns {menuId, menuName, values}
 * - getRequestData(menuId?): merges form values + tagData for requests
 * - setTagData(menuId, tagInfo), getTagData(menuId?), clearTagData(menuId?)
 * - getAllTagData(): returns stored tag data map as plain object
 *
 * Notes:
 * - registerSendHandler allows consumers to provide a function(formValues, meta)
 *   which will be invoked on Enter (Shift+Enter preserved for newline) for
 *   menus that need SEND behavior (e.g. '2004'). IME composition events are
 *   considered to avoid premature send.
 */
class TabFormSync {
    constructor(config) {
        this.apiUrl = config.apiUrl || '/api/menu/list';
        this.tabContainer = config.tabContainer || '#tabContainer';
        this.formContainer = config.formContainer || '#formContainer';
        this.onTabChange = config.onTabChange || null;
        this.onFormChange = config.onFormChange || null;
        this.onKeyboardEvent = config.onKeyboardEvent || null; // 키보드 이벤트 콜백
        
        // CSS 설정
        this.useInternalCSS = config.useInternalCSS !== false; // 기본값 true
        
        // 테스트용
        this.useLocalData = config.useLocalData || false;
        this.localData = config.localMenuData || config.localData || null;
        
        // 상태
        this.menus = [];
        this.currentMenuId = null;
        
        // Tag 데이터 별도 저장소 (UI와 독립적)
        this.tagData = new Map();
        // 메뉴별 SEND 핸들러 저장소
        this._sendHandlers = new Map();
    }

    /**
     * 시작
     */
    async init() {
        // 내장 CSS 적용
        if (this.useInternalCSS) {
            this.applyInternalCSS();
        }

        try {
            await this.loadMenus();
            this.createTabs();
            this.createForms();
            this.activateFirst();
        } catch (error) {
            console.error('TabFormSync init failed:', error);
            this.useFallback();
        }
    }

    /**
     * 메뉴 데이터 로드
     */
    async loadMenus() {
        if (this.useLocalData && this.localData) {
            this.menus = this.localData;
            return;
        }

        const response = await fetch(this.apiUrl);
    if (!response.ok) throw new Error('API 호출 실패');
        
        const data = await response.json();
        this.menus = Array.isArray(data) ? data : (data.menus || data.menuList || []);
        
        // 필터링 & 정렬
        this.menus = this.menus
            .filter(m => m.id && m.name && (m.first_ref_text || 0) >= 0)
            .sort((a, b) => (a.first_ref_text || 0) - (b.first_ref_text || 0));
    }

    /**
     * 탭 생성
     */
    createTabs() {
        const $container = $(this.tabContainer);
        $container.empty();

        this.menus.forEach((menu, index) => {
            const $tab = $('<a>')
                .attr('href', '#')
                .addClass(index === 0 ? 'active' : '')
                .text(menu.name)
                .attr('title', menu.description || '')
                .click(e => {
                    e.preventDefault();
                    this.switchTab(menu.id, e.target);
                });

            $container.append($('<li>').append($tab));
        });
    }

    /**
     * 폼 생성
     */
    createForms() {
        const $container = $(this.formContainer);
        $container.empty();

        this.menus.forEach((menu, index) => {
            const $form = $('<div>')
                .addClass('tab-form')
                .addClass(index === 0 ? 'active' : '')
                .attr('id', `form-${menu.id}`);

            // 폼 내용 생성
            const formConfig = this.getFormConfig(menu.id);
            if (formConfig) {
                formConfig.forEach(field => {
                    $form.append(this.createField(field, menu.id));
                });
            } else {
                $form.append(`<p>${menu.name} 설정 없음</p>`);
            }

            $container.append($form);
        });
    }

    /**
     * 폼 필드 생성
     */
    createField(field, menuId) {
        const $group = $('<div>').addClass('field-group');
        const $label = $('<label>').text(field.label);
        
        let $input;
        if (field.type === 'select') {
            $input = $('<select>').attr('id', field.id);
            $input.append('<option value="">선택하세요</option>');
            
            if (field.options) {
                field.options.forEach(opt => {
                    $input.append(`<option value="${opt.value}">${opt.text}</option>`);
                });
            }
        } else if (field.type === 'textarea') {
            $input = $('<textarea>')
                .attr('id', field.id)
                .attr('placeholder', field.placeholder || '');
            
            // 메뉴 2004(지식질문) 또는 해당 메뉴에 등록된 send handler가 있는 경우에만
            // Enter 키를 SEND로 사용하도록 바인딩합니다. Shift+Enter는 줄바꿈을 유지합니다.
            // IME 입력 중 Enter(조합완료)를 무시하도록 composition 이벤트를 처리합니다.
                try {
                    const shouldBindSend = String(menuId) === '2004' || this._sendHandlers.has(String(menuId));
                if (shouldBindSend) {
                    let composing = false;
                    $input.on('compositionstart', () => { composing = true; });
                    $input.on('compositionend', () => { composing = false; });

                    $input.on('keydown', (e) => {
                        if (composing) return; // IME 조합 중에는 무시
                        const key = e.key || e.keyCode || e.which;
                        const isEnter = key === 'Enter' || key === 13 || key === '13';
                        if (isEnter && !e.shiftKey) {
                            const handler = this._sendHandlers.get(String(menuId));
                            if (typeof handler === 'function') {
                                e.preventDefault();
                                const formValues = this.getValues(menuId);
                                const rawText = $input.val();
                                try {
                                    const maybePromise = handler(formValues, { menuId: String(menuId), rawText, element: $input[0] });
                                    if (maybePromise && typeof maybePromise.then === 'function') {
                                        // external consumer handles Promise
                                    }
                                } catch (err) {
                                    console.error('sendHandler error', err);
                                }
                            }
                        }
                    });
                }
            } catch (e) {
                console.warn('Failed to bind send handler for textarea', e);
            }
        } else {
            $input = $('<input>')
                .attr('type', 'text')
                .attr('id', field.id)
                .attr('placeholder', field.placeholder || '');
        }

        if (field.disabled) $input.prop('disabled', true);
        
        $input.on('change input', () => {
            if (this.onFormChange) {
                this.onFormChange(this.getValues(menuId));
            }
        });

        return $group.append($label).append($input);
    }

    /**
     * 외부에서 메뉴별 SEND 핸들러 등록
     * handler(formValues, meta) - meta: {menuId, rawText, element}
     */
    registerSendHandler(menuId, handler) {
    if (!menuId || typeof handler !== 'function') return false;
        this._sendHandlers.set(String(menuId), handler);
        // 이미 생성된 textarea가 있으면 동적으로 이벤트 바인딩
        try {
            const $textarea = $(`#form-${menuId}`).find('textarea');
            if ($textarea && $textarea.length) {
                let composing = false;
                $textarea.off('.sendHandler');
                $textarea.on('compositionstart.sendHandler', () => { composing = true; });
                $textarea.on('compositionend.sendHandler', () => { composing = false; });

                $textarea.on('keydown.sendHandler', (e) => {
                    if (composing) return;
                    const key = e.key || e.keyCode || e.which;
                    const isEnter = key === 'Enter' || key === 13 || key === '13';
                    if (isEnter && !e.shiftKey) {
                        e.preventDefault();
                        const formValues = this.getValues(menuId);
                        const rawText = $textarea.val();
                        try {
                            handler(formValues, { menuId: String(menuId), rawText, element: $textarea[0] });
                        } catch (err) {
                            console.error('sendHandler error', err);
                        }
                    }
                });
            }
        } catch (e) {
            console.warn('Failed to bind dynamic send handler', e);
        }
        return true;
    }

    /**
     * 등록 해제
     */
    unregisterSendHandler(menuId) {
        if (!menuId) return false;
        try {
            $(`#form-${menuId}`).find('textarea').off('.sendHandler');
        } catch (e) {
            // ignore
        }
        return this._sendHandlers.delete(String(menuId));
    }

    /**
     * 탭 전환
     */
    switchTab(menuId, tabElement) {
        // 탭 스타일 변경
        $(this.tabContainer).find('a').removeClass('active');
        $(tabElement).addClass('active');

        // 폼 전환
        $('.tab-form').removeClass('active');
        $(`#form-${menuId}`).addClass('active');

        this.currentMenuId = menuId;
        
        // 특수 처리
        this.handleSpecial(menuId);

        if (this.onTabChange) {
            this.onTabChange(menuId, this.getMenuName(menuId));
        }
    }

    /**
     * 특수 처리 (상품비교 등)
     */
    handleSpecial(menuId) {
        if (menuId === '2002') { // 상품비교
            const $source = $('#sourceProduct');
            const $target = $('#targetProduct');
            
            $source.off('change.special').on('change.special', () => {
                if ($source.val()) {
                    $target.prop('disabled', false);
                } else {
                    $target.prop('disabled', true).val('');
                }
            });
        }
    }

    /**
     * 폼 값 추출
     */
    // getValues: optional menuId parameter to extract values for a specific form
    getValues(menuId) {
        const targetMenuId = menuId || this.currentMenuId;
        if (!targetMenuId) return null;

        const $form = $(`#form-${targetMenuId}`);
        const values = {};

        $form.find('select, input, textarea').each(function() {
            const $el = $(this);
            const val = $el.val();
            
            if (val && val.trim()) {
                values[this.id] = {
                    value: val,
                    text: $el.find('option:selected').text() || val
                };
            }
        });

        return {
            menuId: targetMenuId,
            menuName: this.getMenuName(targetMenuId),
            values: values
        };
    }

    /**
     * 폼 설정 (메뉴별)
     */
    getFormConfig(menuId) {
        const configs = {
            '2001': [
                { id: 'productSelect', type: 'select', label: '상품 선택',
                  options: [
                      { value: 'PROD001', text: 'T 5G 플랜 A' },
                      { value: 'PROD002', text: 'T 5G 플랜 B' }
                  ]
                }
            ],
            '2002': [
                { id: 'sourceProduct', type: 'select', label: '대상상품',
                  options: [
                      { value: 'PROD001', text: 'T 5G 플랜 A' },
                      { value: 'PROD002', text: 'T 5G 플랜 B' }
                  ]
                },
                { id: 'targetProduct', type: 'select', label: '비교상품', disabled: true,
                  options: [
                      { value: 'PROD001', text: 'T 5G 플랜 A' },
                      { value: 'PROD002', text: 'T 5G 플랜 B' }
                  ]
                }
            ],
            '2004': [
                { id: 'queryInput', type: 'textarea', label: '질문 입력',
                  placeholder: 'AI에게 궁금한 점을 입력하세요...' }
            ],
            '2005': [
                { id: 'categorySelect', type: 'select', label: '카테고리',
                  options: [
                      { value: 'CAT001', text: '모바일 요금제' },
                      { value: 'CAT002', text: '인터넷 서비스' }
                  ]
                }
            ]
        };

        return configs[menuId] || null;
    }

    /**
     * 첫 번째 탭 활성화
     */
    activateFirst() {
        if (this.menus.length > 0) {
            this.currentMenuId = this.menus[0].id;
            this.handleSpecial(this.currentMenuId);
        }
    }

    /**
     * 메뉴 이름 가져오기
     */
    getMenuName(menuId) {
        const menu = this.menus.find(m => m.id === menuId);
        return menu ? menu.name : '';
    }

    /**
     * 폴백 데이터
     */
    useFallback() {
        console.log('폴백 데이터 사용');
        // 내장 CSS 적용 (fallback에서도 스타일이 필요함)
        if (this.useInternalCSS) {
            try { this.applyInternalCSS(); } catch (e) { console.warn('applyInternalCSS failed', e); }
        }
        this.menus = [
            { id: "2001", name: "상품정보", description: "상품 정보 요약", first_ref_text: 1 },
            { id: "2002", name: "상품비교", description: "상품 비교 분석", first_ref_text: 2 },
            { id: "2004", name: "지식질문", description: "AI 질의응답", first_ref_text: 4 },
            { id: "2005", name: "상품목차", description: "상품 상세정보", first_ref_text: 5 }
        ];
        
        this.createTabs();
        this.createForms();
        this.activateFirst();
    }

    /**
     * 리셋
     */
    reset() {
        if (this.currentMenuId) {
            $(`#form-${this.currentMenuId}`).find('select, input, textarea').val('');
        }
    }

    /**
     * 내장 CSS 적용
     */
    applyInternalCSS() {
        const cssId = 'tabFormSyncCSS';
        
        // 이미 적용되었는지 확인
        if (document.getElementById(cssId)) {
            return;
        }

        const css = `
            /* TabFormSync 내장 CSS */
            ${this.tabContainer} {
                list-style: none;
                padding: 0;
                margin: 0;
                display: flex;
                border-bottom: 2px solid #e9ecef;
                background: #f8f9fa;
                border-radius: 8px 8px 0 0;
                overflow: hidden;
            }

            ${this.tabContainer} li {
                margin: 0;
            }

            ${this.tabContainer} a {
                display: block;
                padding: 15px 25px;
                text-decoration: none;
                color: #6c757d;
                background: #f8f9fa;
                border: none;
                transition: all 0.3s ease;
                cursor: pointer;
                font-weight: 500;
                border-right: 1px solid #e9ecef;
            }

            ${this.tabContainer} a:hover {
                background: #e9ecef;
                color: #495057;
            }

            ${this.tabContainer} a.active {
                background: #007bff;
                color: white;
                font-weight: 600;
            }

            ${this.formContainer} {
                background: white;
                border: 1px solid #e9ecef;
                border-top: none;
                border-radius: 0 0 8px 8px;
                padding: 30px;
                min-height: 200px;
            }

            .tab-form {
                display: none;
            }

            .tab-form.active {
                display: block;
                animation: fadeIn 0.3s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .field-group {
                margin-bottom: 20px;
            }

            .field-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: #495057;
            }

            .field-group select,
            .field-group input,
            .field-group textarea {
                width: 100%;
                max-width: 400px;
                padding: 12px 15px;
                border: 1px solid #ced4da;
                border-radius: 6px;
                font-size: 14px;
                transition: border-color 0.3s ease, box-shadow 0.3s ease;
                box-sizing: border-box;
            }

            .field-group select:focus,
            .field-group input:focus,
            .field-group textarea:focus {
                outline: none;
                border-color: #007bff;
                box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
            }

            .field-group textarea {
                min-height: 100px;
                resize: vertical;
            }

            .field-group select:disabled,
            .field-group input:disabled,
            .field-group textarea:disabled {
                background-color: #f8f9fa;
                color: #6c757d;
                cursor: not-allowed;
            }
        `;

        const style = document.createElement('style');
        style.id = cssId;
        style.textContent = css;
        document.head.appendChild(style);
        
        console.log('TabFormSync 내장 CSS 적용됨');
    }

    /**
     * 현재 데이터 추출 (HTML 테스트용)
     */
    getCurrentData() {
        const values = this.getValues();
        if (!values) return null;
        
        const menu = this.menus.find(m => m.id === values.menuId);
        
        return {
            menuId: values.menuId,
            menuName: values.menuName,
            menuDescription: menu ? menu.description : '',
            formData: values.values
        };
    }

    /**
     * 전체 데이터 추출 (HTML 테스트용)
     */
    getAllData() {
        const allData = {};
        
        this.menus.forEach(menu => {
            const oldMenuId = this.currentMenuId;
            this.currentMenuId = menu.id;
            const values = this.getValues();
            
            allData[menu.id] = {
                menuName: menu.name,
                menuDescription: menu.description,
                formData: values ? values.values : {}
            };
            
            this.currentMenuId = oldMenuId;
        });
        
        return {
            currentMenuId: this.currentMenuId,
            allMenuData: allData
        };
    }

    /**
     * 값 추출 테스트 (HTML 테스트용)
     */
    testValueExtraction() {
        console.log('=== 값 추출 테스트 시작 ===');
        
        const currentData = this.getCurrentData();
        const allData = this.getAllData();
        
        console.log('현재 데이터:', currentData);
        console.log('전체 데이터:', allData);
        
        // 검증
        const validation = {
            hasCurrentMenu: !!currentData,
            currentMenuHasData: currentData ? Object.keys(currentData.formData).length > 0 : false,
            totalMenus: this.menus.length,
            menusWithData: Object.values(allData.allMenuData).filter(m => Object.keys(m.formData).length > 0).length
        };
        
        console.log('검증 결과:', validation);
        console.log('=== 값 추출 테스트 완료 ===');
        
        return { currentData, allData, validation };
    }

    /**
     * Tag 데이터 설정 (UI와 독립적인 저장소)
     * @param {string} menuId - 메뉴 ID
     * @param {object} tagInfo - Tag 관련 정보
     */
    setTagData(menuId, tagInfo) {
        this.tagData.set(menuId, {
            ...tagInfo,
            timestamp: Date.now()
        });
        console.log(`Tag 데이터 설정 [${menuId}]:`, tagInfo);
    }

    /**
     * Tag 데이터 가져오기
     * @param {string} menuId - 메뉴 ID (선택사항, 없으면 현재 메뉴)
     * @returns {object|null} Tag 데이터
     */
    getTagData(menuId = null) {
        const targetMenuId = menuId || this.currentMenuId;
        const tagData = this.tagData.get(targetMenuId);
        console.log(`Tag 데이터 조회 [${targetMenuId}]:`, tagData);
        return tagData || null;
    }

    /**
     * Tag 데이터 삭제
     * @param {string} menuId - 메뉴 ID (선택사항, 없으면 현재 메뉴)
     */
    clearTagData(menuId = null) {
        const targetMenuId = menuId || this.currentMenuId;
        const deleted = this.tagData.delete(targetMenuId);
        console.log(`Tag 데이터 삭제 [${targetMenuId}]:`, deleted);
        return deleted;
    }

    /**
     * 모든 Tag 데이터 가져오기
     * @returns {object} 모든 메뉴의 Tag 데이터
     */
    getAllTagData() {
        const allTagData = {};
        for (const [menuId, tagData] of this.tagData) {
            allTagData[menuId] = tagData;
        }
        console.log('전체 Tag 데이터:', allTagData);
        return allTagData;
    }

    /**
     * 폼 데이터와 Tag 데이터를 결합하여 요청 데이터 생성
     * @param {string} menuId - 메뉴 ID (선택사항, 없으면 현재 메뉴)
     * @returns {object} 결합된 요청 데이터
     */
    getRequestData(menuId = null) {
        const targetMenuId = menuId || this.currentMenuId;
        const formData = this.getValues(targetMenuId);
        const tagData = this.getTagData(targetMenuId);
        
        // 메뉴 2003(상품요약)의 경우 Tag 데이터 우선 사용
        if (targetMenuId === '2003' && tagData) {
            const requestData = {
                menuId: targetMenuId,
                menuName: this.getMenuName(targetMenuId),
                formData: formData ? formData.values : {},
                tagData: tagData,
                // Tag에서 선택된 상품이 있으면 우선 사용
                productSelect: tagData.selectedProduct || tagData.productSelect || (formData ? formData.values.productSelect : null)
            };
            console.log('요청 데이터 생성 (Tag 포함):', requestData);
            return requestData;
        }
        
        // 일반적인 경우
        const requestData = {
            menuId: targetMenuId,
            menuName: this.getMenuName(targetMenuId),
            formData: formData ? formData.values : {},
            tagData: tagData
        };
        console.log('요청 데이터 생성:', requestData);
        return requestData;
    }
}

// 전역 등록
window.TabFormSync = TabFormSync;