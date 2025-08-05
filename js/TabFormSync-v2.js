/**
 * TabFormSync v2.0 - 실제 데이터 구조 기반
 * 탭 메뉴와 입력 폼의 동기화를 관리하는 클래스
 * 실제 데이터: id, name, description, first_ref_text (display ordering)
 * 
 * @version 2.0.0
 * @author jaehoosu
 * @date 2025-08-05
 */

class TabFormSync {
    constructor(options = {}) {
        this.options = {
            tabContainer: '#dynamicTabMenu',
            formContainer: '#dynamicFormContainer',
            currentMenuIdField: '#currentMenuId',
            apiEndpoint: '/api/menu/list',
            showLoading: true,
            autoSync: false,
            ...options
        };
        
        this.menuData = [];           // 원본 메뉴 데이터
        this.displayMenus = [];       // 화면에 표시할 메뉴 (ordering 적용)
        this.menuConfig = {};         // 메뉴별 설정
        this.currentMenuId = null;
        this.autoSyncEnabled = false;
        
        this.init();
    }
    
    /**
     * 초기화
     */
    async init() {
        console.log('TabFormSync v2.0 초기화 시작...');
        
        try {
            await this.loadMenuData();
            this.processMenuData();
            this.generateTabMenu();
            this.generateForms();
            this.activateFirstTab();
            
            console.log('TabFormSync 초기화 완료:', {
                totalMenus: this.menuData.length,
                displayMenus: this.displayMenus.length,
                excludedMenus: this.menuData.length - this.displayMenus.length
            });
            
        } catch (error) {
            console.error('TabFormSync 초기화 실패:', error);
            this.loadFallbackData();
        }
    }
    
    /**
     * 실제 API에서 메뉴 데이터 로드
     */
    async loadMenuData() {
        try {
            if (this.options.showLoading && window.$ && $.http) {
                const response = await $.http.get(this.options.apiEndpoint);
                this.menuData = response.menuList || response.data || response;
            } else {
                const response = await fetch(this.options.apiEndpoint);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                this.menuData = data.menuList || data.data || data;
            }
            
            console.log('API에서 메뉴 데이터 로드 완료:', this.menuData.length, '개');
            
        } catch (error) {
            console.warn('API 호출 실패, 폴백 데이터 사용:', error.message);
            throw error; // 폴백 처리를 위해 에러 전파
        }
    }
    
    /**
     * 폴백 데이터 로드
     */
    loadFallbackData() {
        console.log('폴백 데이터 로드');
        
        // 실제 데이터 구조 시뮬레이션
        this.menuData = [
            {
                id: "2001",
                name: "상품요약", 
                description: "상품요약정보를 요청합니다.",
                first_ref_text: "0"
            },
            {
                id: "2002",
                name: "상품비교",
                description: "상품비교정보를 요청합니다.", 
                first_ref_text: "2"
            },
            {
                id: "2003",
                name: "상품태그",
                description: "상품태그정보를 요청합니다.",
                first_ref_text: "-3"  // 제외됨
            },
            {
                id: "2004",
                name: "상품상세",
                description: "상품상세정보를 요청합니다.",
                first_ref_text: "1"
            },
            {
                id: "2005",
                name: "숨겨진메뉴",
                description: "숨겨진 메뉴입니다.",
                first_ref_text: "-1"  // 제외됨
            },
            {
                id: "2006",
                name: "T카드요약",
                description: "T카드요약정보를 요청합니다.",
                first_ref_text: "3"
            }
        ];
        
        this.processMenuData();
        this.generateTabMenu();
        this.generateForms();
        this.activateFirstTab();
    }
    
    /**
     * 메뉴 데이터 처리 (ordering 및 필터링)
     */
    processMenuData() {
        // 1. first_ref_text가 양수인 메뉴만 필터링
        const visibleMenus = this.menuData.filter(menu => {
            const order = parseInt(menu.first_ref_text);
            return !isNaN(order) && order >= 0;
        });
        
        // 2. first_ref_text 순서로 정렬
        this.displayMenus = visibleMenus.sort((a, b) => {
            const orderA = parseInt(a.first_ref_text);
            const orderB = parseInt(b.first_ref_text);
            return orderA - orderB;
        });
        
        // 3. 메뉴별 기본 설정 생성
        this.buildMenuConfig();
        
        console.log('메뉴 데이터 처리 완료:', {
            original: this.menuData.length,
            visible: this.displayMenus.length,
            excluded: this.menuData.filter(m => parseInt(m.first_ref_text) < 0).length
        });
    }
    
    /**
     * 메뉴별 기본 설정 생성
     */
    buildMenuConfig() {
        this.menuConfig = {};
        
        this.displayMenus.forEach(menu => {
            this.menuConfig[menu.id] = {
                name: menu.name,
                description: menu.description,
                order: parseInt(menu.first_ref_text),
                elements: this.getDefaultElements(menu.id)
            };
        });
    }
    
    /**
     * 메뉴별 기본 폼 요소 정의
     */
    getDefaultElements(menuId) {
        const elementMap = {
            '2001': { // 상품요약
                'productSelect': { 
                    type: 'select', 
                    defaultValue: '00', 
                    label: '상품 선택',
                    required: true
                }
            },
            '2002': { // 상품비교  
                'sourceProduct': { 
                    type: 'select', 
                    defaultValue: '00', 
                    label: '대상상품',
                    required: true
                },
                'targetProduct': { 
                    type: 'select', 
                    defaultValue: '00', 
                    disabled: true, 
                    label: '비교상품'
                }
            },
            '2004': { // 상품상세
                'queryInput': { 
                    type: 'textarea', 
                    defaultValue: '', 
                    label: '질문 입력', 
                    placeholder: 'T 상품에 대해 궁금한 점을 입력하세요...',
                    required: true
                }
            },
            '2006': { // T카드요약
                'cardSelect': { 
                    type: 'select', 
                    defaultValue: '00', 
                    label: '제휴카드',
                    required: true
                }
            }
        };
        
        return elementMap[menuId] || {};
    }
    
    /**
     * 동적 탭 메뉴 생성
     */
    generateTabMenu() {
        const $tabContainer = $(this.options.tabContainer);
        $tabContainer.empty();
        
        this.displayMenus.forEach((menu, index) => {
            const isFirst = index === 0;
            const $li = $('<li>');
            const $a = $('<a>')
                .attr('href', '#')
                .attr('data-menu-id', menu.id)
                .attr('title', menu.description)
                .addClass(isFirst ? 'current' : '')
                .text(menu.name)
                .on('click', (e) => {
                    e.preventDefault();
                    this.changeTab(menu.id, menu.name, e.currentTarget);
                });
            
            $li.append($a);
            $tabContainer.append($li);
        });
        
        console.log('탭 메뉴 생성 완료:', this.displayMenus.length, '개');
    }
    
    /**
     * 동적 폼 생성
     */
    generateForms() {
        const $formContainer = $(this.options.formContainer);
        $formContainer.empty();
        
        this.displayMenus.forEach((menu, index) => {
            const menuId = menu.id;
            const config = this.menuConfig[menuId];
            const isFirst = index === 0;
            
            const $form = $('<div>')
                .addClass('menu-form')
                .addClass(isFirst ? 'active' : '')
                .attr('id', `form-${menuId}`)
                .attr('data-menu-id', menuId);
            
            // 메뉴 설명 추가
            if (config.description) {
                const $description = $('<div>')
                    .addClass('form-description')
                    .text(config.description)
                    .css({
                        'margin-bottom': '15px',
                        'padding': '10px',
                        'background': '#f8f9fa',
                        'border-left': '4px solid #007bff',
                        'color': '#6c757d',
                        'font-size': '14px'
                    });
                $form.append($description);
            }
            
            // 폼 요소들 생성
            if (config.elements && Object.keys(config.elements).length > 0) {
                Object.keys(config.elements).forEach(elementId => {
                    const elementConfig = config.elements[elementId];
                    const $formGroup = this.createFormElement(elementId, elementConfig);
                    $form.append($formGroup);
                });
            } else {
                // 설정이 없으면 기본 메시지 표시
                const $emptyMessage = $('<div>')
                    .addClass('empty-form-message')
                    .html(`
                        <p style="text-align: center; color: #6c757d; padding: 40px 20px;">
                            ${menu.name} 메뉴에 대한 설정 항목이 없습니다.
                        </p>
                    `);
                $form.append($emptyMessage);
            }
            
            $formContainer.append($form);
        });
        
        console.log('폼 생성 완료:', this.displayMenus.length, '개');
    }
    
    /**
     * 폼 요소 생성
     */
    createFormElement(elementId, config) {
        const $formGroup = $('<div>').addClass('form-group');
        
        // 라벨 생성 (필수 표시 포함)
        const $label = $('<label>')
            .attr('for', elementId)
            .html(config.label + (config.required ? ' <span style="color: red;">*</span>' : ''));
        
        $formGroup.append($label);
        
        if (config.type === 'select') {
            const $select = $('<select>')
                .attr('id', elementId)
                .prop('disabled', config.disabled || false)
                .on('change', () => this.handleElementChange(elementId));
            
            // 기본 옵션 추가
            $select.append($('<option>').val('00').text('선택안함'));
            
            // 샘플 옵션 추가 (실제 환경에서는 API에서 로드)
            this.addSampleOptions($select, elementId);
            
            $formGroup.append($select);
            
        } else if (config.type === 'textarea') {
            const $textarea = $('<textarea>')
                .attr('id', elementId)
                .attr('placeholder', config.placeholder || '')
                .on('input', () => this.handleElementChange(elementId));
            
            $formGroup.append($textarea);
            
        } else if (config.type === 'input') {
            const $input = $('<input>')
                .attr('type', 'text')
                .attr('id', elementId)
                .attr('placeholder', config.placeholder || '')
                .on('input', () => this.handleElementChange(elementId));
            
            $formGroup.append($input);
        }
        
        return $formGroup;
    }
    
    /**
     * 샘플 옵션 추가 (실제 환경에서는 API에서 로드)
     */
    addSampleOptions($select, elementId) {
        const sampleData = {
            'productSelect': [
                { value: 'PROD001', text: 'T 5G 플랜 A' },
                { value: 'PROD002', text: 'T 5G 플랜 B' },
                { value: 'PROD003', text: 'T WiFi 상품' }
            ],
            'sourceProduct': [
                { value: 'PROD001', text: 'T 5G 플랜 A' },
                { value: 'PROD002', text: 'T 5G 플랜 B' },
                { value: 'PROD003', text: 'T WiFi 상품' }
            ],
            'targetProduct': [
                { value: 'PROD001', text: 'T 5G 플랜 A' },
                { value: 'PROD002', text: 'T 5G 플랜 B' },
                { value: 'PROD003', text: 'T WiFi 상품' }
            ],
            'cardSelect': [
                { value: 'CARD001', text: 'T 알파 카드' },
                { value: 'CARD002', text: 'T 멤버십 카드' },
                { value: 'CARD003', text: 'T Y 카드' }
            ]
        };
        
        const options = sampleData[elementId] || [];
        options.forEach(option => {
            $select.append($('<option>').val(option.value).text(option.text));
        });
    }
    
    /**
     * 첫 번째 탭 활성화
     */
    activateFirstTab() {
        if (this.displayMenus.length > 0) {
            const firstMenu = this.displayMenus[0];
            this.currentMenuId = firstMenu.id;
            $(this.options.currentMenuIdField).val(firstMenu.id);
            this.initializeForm(firstMenu.id);
            
            console.log('첫 번째 탭 활성화:', firstMenu.name);
        }
    }
    
    /**
     * 탭 변경
     */
    changeTab(menuId, menuName, tabElement) {
        console.log(`탭 변경: ${menuName} (${menuId})`);
        
        // 1. 탭 스타일 업데이트
        $(this.options.tabContainer + ' a').removeClass('current');
        $(tabElement).addClass('current');
        
        // 2. 현재 메뉴 ID 저장
        this.currentMenuId = menuId;
        $(this.options.currentMenuIdField).val(menuId);
        
        // 3. 폼 전환
        $('.menu-form').removeClass('active');
        $(`#form-${menuId}`).addClass('active');
        
        // 4. 폼 초기화
        this.initializeForm(menuId);
        
        // 5. 페이로드 리셋 (메뉴 변경 시)
        this.resetPayloadDisplay();
        
        // 6. 이벤트 발생
        this.triggerEvent('tabChanged', { 
            menuId, 
            menuName, 
            payloadReset: true 
        });
        
        // 7. 자동 동기화가 활성화된 경우 새 메뉴의 페이로드 생성
        if (this.autoSyncEnabled) {
            setTimeout(() => {
                this.triggerEvent('autoSync', this.generatePayload());
            }, 100); // 폼 초기화 후 페이로드 생성
        }
    }
    
    /**
     * 페이로드 표시 영역 리셋
     */
    resetPayloadDisplay() {
        // 페이로드 표시 영역 숨기기
        if (window.$ && $('#payloadDisplay').length > 0) {
            $('#payloadDisplay').hide().empty();
        }
        
        // 이벤트 발생 (외부에서 처리할 수 있도록)
        this.triggerEvent('payloadReset', { 
            menuId: this.currentMenuId,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * 폼 초기화
     */
    initializeForm(menuId) {
        const config = this.menuConfig[menuId];
        if (!config || !config.elements) return;
        
        Object.keys(config.elements).forEach(elementId => {
            const elementConfig = config.elements[elementId];
            const $element = $('#' + elementId);
            
            if ($element.length > 0) {
                // 기본값 설정
                $element.val(elementConfig.defaultValue);
                
                // 비활성화 상태 설정
                $element.prop('disabled', elementConfig.disabled || false);
            }
        });
        
        // 특별한 의존성 처리
        this.handleSpecialDependencies(menuId);
    }
    
    /**
     * 특별한 의존성 처리 (상품비교 등)
     */
    handleSpecialDependencies(menuId) {
        if (menuId === '2002') { // 상품비교
            const $sourceSelect = $('#sourceProduct');
            const $targetSelect = $('#targetProduct');
            
            // 소스 상품 변경 시 타겟 상품 활성화/비활성화
            $sourceSelect.off('change.dependency').on('change.dependency', () => {
                const sourceValue = $sourceSelect.val();
                if (sourceValue === '00') {
                    $targetSelect.prop('disabled', true).val('00');
                } else {
                    $targetSelect.prop('disabled', false);
                }
            });
        }
    }
    
    /**
     * 요소 변경 처리
     */
    handleElementChange(elementId) {
        console.log(`요소 변경: ${elementId}`);
        
        // 특별한 처리가 필요한 요소들
        if (elementId === 'sourceProduct') {
            const sourceValue = $('#sourceProduct').val();
            const $targetSelect = $('#targetProduct');
            
            if (sourceValue === '00') {
                $targetSelect.prop('disabled', true).val('00');
            } else {
                $targetSelect.prop('disabled', false);
            }
        }
        
        // 이벤트 발생
        this.triggerEvent('elementChanged', { elementId, menuId: this.currentMenuId });
        
        // 자동 동기화가 활성화된 경우 페이로드 업데이트
        if (this.autoSyncEnabled) {
            this.triggerEvent('autoSync', this.generatePayload());
        }
    }
    
    /**
     * 현재 폼 값들 가져오기
     */
    getCurrentValues() {
        const $currentForm = $(`#form-${this.currentMenuId}`);
        const values = [];
        
        $currentForm.find('select, input, textarea').each(function() {
            const $element = $(this);
            const value = $element.val().trim();
            if (value && value !== '00') {
                const text = $element.find('option:selected').text() || value;
                values.push(`${this.id}: ${text}`);
            }
        });
        
        return values;
    }
    
    /**
     * 페이로드 생성
     */
    generatePayload() {
        const config = this.menuConfig[this.currentMenuId];
        
        const payload = {
            menuId: this.currentMenuId,
            menuName: config.name,
            description: config.description,
            order: config.order,
            data: this.getMenuSpecificData(),
            timestamp: new Date().toISOString()
        };
        
        return payload;
    }
    
    /**
     * 메뉴별 특화 데이터 추출
     */
    getMenuSpecificData() {
        const menuId = this.currentMenuId;
        
        if (menuId === '2001') { // 상품요약
            const $productSelect = $('#productSelect');
            const selectedProduct = $productSelect.val() !== '00' ? {
                id: $productSelect.val(),
                name: $productSelect.find('option:selected').text()
            } : null;
            
            return {
                products: selectedProduct ? [selectedProduct] : []
            };
            
        } else if (menuId === '2002') { // 상품비교
            const $sourceSelect = $('#sourceProduct');
            const $targetSelect = $('#targetProduct');
            
            return {
                sourceProduct: $sourceSelect.val() !== '00' ? {
                    id: $sourceSelect.val(),
                    name: $sourceSelect.find('option:selected').text()
                } : null,
                targetProduct: $targetSelect.val() !== '00' ? {
                    id: $targetSelect.val(),
                    name: $targetSelect.find('option:selected').text()
                } : null
            };
            
        } else if (menuId === '2004') { // 상품상세
            return {
                query: $('#queryInput').val().trim()
            };
            
        } else if (menuId === '2006') { // T카드요약
            const $cardSelect = $('#cardSelect');
            return {
                cardCode: $cardSelect.val() !== '00' ? $cardSelect.val() : null,
                cardName: $cardSelect.val() !== '00' ? $cardSelect.find('option:selected').text() : null
            };
        }
        
        return {};
    }
    
    /**
     * 자동 동기화 토글
     */
    toggleAutoSync() {
        this.autoSyncEnabled = !this.autoSyncEnabled;
        console.log('자동 동기화:', this.autoSyncEnabled ? '활성화' : '비활성화');
        
        this.triggerEvent('autoSyncToggled', { enabled: this.autoSyncEnabled });
        
        return this.autoSyncEnabled;
    }
    
    /**
     * 이벤트 발생
     */
    triggerEvent(eventName, data = {}) {
        if (typeof this.options[eventName] === 'function') {
            this.options[eventName](data);
        }
        
        // jQuery 이벤트 발생
        if (window.$ && $.fn.trigger) {
            $(document).trigger(`tabFormSync:${eventName}`, data);
        }
    }
    
    /**
     * 현재 상태 정보 반환
     */
    getStatus() {
        return {
            currentMenuId: this.currentMenuId,
            currentMenuName: this.menuConfig[this.currentMenuId]?.name,
            totalMenus: this.menuData.length,
            displayMenus: this.displayMenus.length,
            excludedMenus: this.menuData.length - this.displayMenus.length,
            autoSyncEnabled: this.autoSyncEnabled,
            currentValues: this.getCurrentValues()
        };
    }
    
    /**
     * 메뉴 정보 반환
     */
    getMenuInfo(menuId = null) {
        if (menuId) {
            return this.menuConfig[menuId] || null;
        }
        return this.menuConfig;
    }
    
    /**
     * 전체 초기화
     */
    reset() {
        if (this.currentMenuId) {
            this.initializeForm(this.currentMenuId);
            console.log('폼 초기화 완료');
            this.triggerEvent('reset', { menuId: this.currentMenuId });
        }
    }
}

// 전역 스코프에 등록 (옵션)
if (typeof window !== 'undefined') {
    window.TabFormSync = TabFormSync;
}

// ES6 모듈 지원
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TabFormSync;
}
