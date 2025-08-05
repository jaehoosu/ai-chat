/**
 * TabFormSync - 탭 메뉴와 입력 폼 동기화 플러그인
 * 
 * 핵심 기능:
 * - API 기반 메뉴 데이터 로드
 * - 동적 탭 메뉴 생성
 * - 동적 입력 폼 생성  
 * - 탭↔폼 실시간 동기화
 * 
 * @version 1.0.0
 * @author AI Assistant
 */

class TabFormSync {
    constructor(options) {
        // 기본 설정
        this.config = {
            apiUrl: '/api/menu/list',
            configUrl: null, // 별도 설정 API URL (선택사항)
            tabContainer: '#tabContainer',
            formContainer: '#formContainer',
            statusElements: {
                currentMenu: '#currentMenu',
                currentValues: '#currentValues'
            },
            onTabChange: null,
            onFormChange: null,
            // 로컬 설정 지원
            localMenuData: null,        // 스크립트에서 직접 정의한 메뉴 데이터
            localMenuConfigs: null,     // 스크립트에서 직접 정의한 설정 데이터
            useLocalData: false,        // 로컬 데이터 우선 사용 여부
            ...options
        };

        // 내부 상태
        this.menuList = [];
        this.menuConfig = {};
        this.currentMenuId = null;
        
        // jQuery 객체 캐싱
        this.$tabContainer = null;
        this.$formContainer = null;
        this.$statusElements = {};
    }

    /**
     * 플러그인 초기화
     */
    async init() {
        try {
            console.log('TabFormSync 초기화 시작...');
            
            // DOM 요소 캐싱
            this.cacheElements();
            
            // 메뉴 데이터 로드
            await this.loadMenuData();
            
            // UI 생성
            this.generateTabs();
            this.generateForms();
            
            // 첫 번째 탭 활성화
            this.activateFirstTab();
            
            console.log('TabFormSync 초기화 완료');
            
        } catch (error) {
            console.error('TabFormSync 초기화 실패:', error);
            this.loadFallbackData();
        }
    }

    /**
     * DOM 요소 캐싱
     */
    cacheElements() {
        this.$tabContainer = $(this.config.tabContainer);
        this.$formContainer = $(this.config.formContainer);
        
        // 상태 표시 요소들 캐싱
        Object.keys(this.config.statusElements).forEach(key => {
            this.$statusElements[key] = $(this.config.statusElements[key]);
        });
    }

    /**
     * 메뉴 데이터 로드 (로컬 데이터 우선 지원)
     */
    async loadMenuData() {
        try {
            // 1. 로컬 데이터 우선 사용
            if (this.config.useLocalData && this.config.localMenuData) {
                console.log('로컬 메뉴 데이터 사용');
                this.processMenuData(this.config.localMenuData, this.config.localMenuConfigs);
                return;
            }
            
            // 2. API에서 메뉴 데이터 로드
            const response = await fetch(this.config.apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // 3. 설정 데이터 처리 (우선순위: 별도 API > 로컬 설정 > API 포함 설정)
            let configData = null;
            
            if (this.config.configUrl) {
                // 별도 설정 API가 있으면 사용
                configData = await this.loadMenuConfigs();
            } else if (this.config.localMenuConfigs) {
                // 로컬 설정이 있으면 사용
                console.log('로컬 메뉴 설정 사용');
                configData = this.config.localMenuConfigs;
            }
            
            this.processMenuData(data, configData);
            
        } catch (error) {
            console.warn('API 로드 실패, 로컬 데이터 또는 폴백 데이터 사용:', error);
            
            // 4. 로컬 데이터가 있으면 사용
            if (this.config.localMenuData) {
                console.log('로컬 메뉴 데이터로 폴백');
                this.processMenuData(this.config.localMenuData, this.config.localMenuConfigs);
            } else {
                // 5. 최종 폴백
                this.loadFallbackData();
            }
        }
    }

    /**
     * 별도 설정 API에서 menuConfig 로드
     */
    async loadMenuConfigs() {
        try {
            const response = await fetch(this.config.configUrl);
            if (!response.ok) {
                throw new Error(`Config API error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn('Config API 로드 실패:', error);
            return {};
        }
    }

    /**
     * 메뉴 데이터 처리 (다양한 API 응답 형태 지원)
     */
    processMenuData(data, separateConfigData = null) {
        let menuList = [];
        let menuConfigs = {};

        // 1. 메뉴 리스트 추출
        if (Array.isArray(data)) {
            // 단일 배열: [{ cl_hiery_ch_cd: "2001", cl_hiery_ch_nm: "상품요약" }, ...]
            menuList = data;
            
            // 임베디드 설정 확인 (각 메뉴 객체에 config 속성이 있는지)
            menuList.forEach(menu => {
                if (menu.config) {
                    menuConfigs[menu.cl_hiery_ch_cd] = menu.config;
                }
            });
        } else if (data && typeof data === 'object') {
            // 구조화된 객체: { tabMenuList: [...], menuConfigs: {...} }
            menuList = data.tabMenuList || data.menuList || data.menus || [];
            menuConfigs = data.menuConfigs || data.configs || data.formConfigs || {};
        }

        // 2. 별도 설정 데이터가 있으면 병합
        if (separateConfigData) {
            menuConfigs = { ...menuConfigs, ...separateConfigData };
        }

        // 3. 데이터 검증
        if (!Array.isArray(menuList) || menuList.length === 0) {
            console.warn('올바르지 않은 메뉴 데이터 형식:', data);
            menuList = [];
        }

        // 4. 내부 상태 설정
        this.menuList = menuList;
        this.buildMenuConfig(menuConfigs);
        
        console.log('메뉴 데이터 처리 완료:', {
            menuCount: this.menuList.length,
            configCount: Object.keys(menuConfigs).length
        });
    }

    /**
     * 메뉴 설정 빌드
     */
    buildMenuConfig(menuConfigs) {
        this.menuConfig = {};
        
        this.menuList.forEach(menu => {
            const menuId = menu.cl_hiery_ch_cd;
            const menuName = menu.cl_hiery_ch_nm;
            
            // 기존 설정이 있으면 사용, 없으면 기본 설정 생성
            let elements = {};
            if (menuConfigs[menuId]?.elements) {
                elements = menuConfigs[menuId].elements;
            } else {
                // menuConfigs가 없는 경우 메뉴 이름 기반으로 기본 폼 요소 생성
                elements = this.generateDefaultElements(menuId, menuName);
            }
            
            this.menuConfig[menuId] = {
                name: menuName,
                elements: elements
            };
        });
    }

    /**
     * 기본 폼 요소 생성 (menuConfigs가 없는 경우)
     */
    generateDefaultElements(menuId, menuName) {
        const elements = {};
        
        // 메뉴 이름 또는 ID 기반으로 기본 요소 생성
        if (menuName.includes('비교')) {
            // 비교 관련 메뉴
            elements['sourceSelect'] = { type: 'select', defaultValue: '00', label: '대상 항목' };
            elements['targetSelect'] = { type: 'select', defaultValue: '00', label: '비교 항목' };
        } else if (menuName.includes('상세') || menuName.includes('질문')) {
            // 상세 정보나 질문 관련 메뉴
            elements['queryInput'] = { type: 'textarea', defaultValue: '', label: '질문 입력', placeholder: '궁금한 점을 입력하세요...' };
        } else {
            // 일반 선택 메뉴
            const elementId = `${menuId}Select`;
            elements[elementId] = { type: 'select', defaultValue: '00', label: `${menuName} 선택` };
        }
        
        return elements;
    }

    /**
     * 동적 탭 메뉴 생성
     */
    generateTabs() {
        this.$tabContainer.empty();
        
        this.menuList.forEach((menu, index) => {
            const isFirst = index === 0;
            const $li = $('<li>');
            const $a = $('<a>')
                .attr('href', '#')
                .addClass(isFirst ? 'current' : '')
                .text(menu.cl_hiery_ch_nm)
                .on('click', (e) => {
                    e.preventDefault();
                    this.changeTab(menu.cl_hiery_ch_cd, menu.cl_hiery_ch_nm, e.target);
                });
            
            $li.append($a);
            this.$tabContainer.append($li);
        });
    }

    /**
     * 동적 폼 생성
     */
    generateForms() {
        this.$formContainer.empty();
        
        this.menuList.forEach((menu, index) => {
            const menuId = menu.cl_hiery_ch_cd;
            const config = this.menuConfig[menuId];
            const isFirst = index === 0;
            
            const $form = $('<div>')
                .addClass('menu-form')
                .addClass(isFirst ? 'active' : '')
                .attr('id', `form-${menuId}`);
            
            // 폼 요소들 생성
            if (config && config.elements) {
                Object.keys(config.elements).forEach(elementId => {
                    const elementConfig = config.elements[elementId];
                    const $formGroup = this.createFormElement(elementId, elementConfig);
                    $form.append($formGroup);
                });
            } else {
                // 빈 폼 메시지
                const $emptyMessage = $('<div>')
                    .addClass('empty-form-message')
                    .html(`<p>${menu.cl_hiery_ch_nm} 메뉴에 대한 설정 항목이 없습니다.</p>`);
                $form.append($emptyMessage);
            }
            
            this.$formContainer.append($form);
        });
    }

    /**
     * 폼 요소 생성
     */
    createFormElement(elementId, config) {
        const $formGroup = $('<div>').addClass('form-group');
        const $label = $('<label>')
            .attr('for', elementId)
            .text(config.label || elementId);
        
        $formGroup.append($label);
        
        if (config.type === 'select') {
            const $select = $('<select>')
                .attr('id', elementId)
                .prop('disabled', config.disabled || false)
                .on('change', () => this.updateStatus());
            
            // 기본 옵션
            $select.append($('<option>').val('00').text('선택안함'));
            
            // 샘플 옵션 추가 (실제 환경에서는 API 연동)
            this.addSampleOptions($select, elementId);
            
            $formGroup.append($select);
            
        } else if (config.type === 'textarea') {
            const $textarea = $('<textarea>')
                .attr('id', elementId)
                .attr('placeholder', config.placeholder || '')
                .on('input', () => this.updateStatus());
            
            $formGroup.append($textarea);
            
        } else if (config.type === 'input') {
            const $input = $('<input>')
                .attr('type', 'text')
                .attr('id', elementId)
                .attr('placeholder', config.placeholder || '')
                .on('input', () => this.updateStatus());
            
            $formGroup.append($input);
        }
        
        return $formGroup;
    }

    /**
     * 탭 변경 처리
     */
    changeTab(menuId, menuName, tabElement) {
        // 탭 스타일 업데이트
        this.$tabContainer.find('a').removeClass('current');
        $(tabElement).addClass('current');
        
        // 폼 전환
        this.$formContainer.find('.menu-form').removeClass('active');
        $(`#form-${menuId}`).addClass('active');
        
        // 현재 메뉴 설정
        this.currentMenuId = menuId;
        
        // 폼 초기화
        this.initializeForm(menuId);
        
        // 상태 업데이트
        this.updateStatus();
        
        // 콜백 실행
        if (this.config.onTabChange) {
            this.config.onTabChange(menuId, menuName);
        }
    }

    /**
     * 폼 초기화
     */
    initializeForm(menuId) {
        const config = this.menuConfig[menuId];
        if (!config) return;
        
        Object.keys(config.elements).forEach(elementId => {
            const elementConfig = config.elements[elementId];
            const $element = $(`#${elementId}`);
            
            if ($element.length > 0) {
                $element.val(elementConfig.defaultValue || '');
                $element.prop('disabled', elementConfig.disabled || false);
            }
        });
        
        // 상품비교 특수 처리
        this.handleProductCompareLogic();
    }

    /**
     * 상품비교 특수 로직 처리
     */
    handleProductCompareLogic() {
        const $sourceProduct = $('#sourceProduct');
        const $targetProduct = $('#targetProduct');
        
        if ($sourceProduct.length && $targetProduct.length) {
            $sourceProduct.off('change.productCompare').on('change.productCompare', () => {
                const sourceValue = $sourceProduct.val();
                if (sourceValue === '00') {
                    $targetProduct.prop('disabled', true).val('00');
                } else {
                    $targetProduct.prop('disabled', false);
                }
                this.updateStatus();
            });
        }
    }

    /**
     * 상태 업데이트
     */
    updateStatus() {
        if (!this.currentMenuId) return;
        
        const config = this.menuConfig[this.currentMenuId];
        const values = this.getCurrentValues();
        
        // 상태 표시 업데이트
        this.$statusElements.currentMenu?.text(config.name);
        this.$statusElements.currentValues?.text(values.length > 0 ? values.join(', ') : '없음');
        
        // 콜백 실행
        if (this.config.onFormChange) {
            this.config.onFormChange(this.getCurrentData());
        }
    }

    /**
     * 현재 선택된 값들 가져오기
     */
    getCurrentValues() {
        const $currentForm = $(`#form-${this.currentMenuId}`);
        const values = [];
        
        $currentForm.find('select, input, textarea').each(function() {
            const $element = $(this);
            const value = $element.val()?.toString().trim();
            if (value && value !== '00') {
                const text = $element.find('option:selected').text() || value;
                values.push(`${this.id}: ${text}`);
            }
        });
        
        return values;
    }

    /**
     * 현재 데이터 가져오기 (외부 API용)
     */
    getCurrentData() {
        if (!this.currentMenuId) return null;
        
        const config = this.menuConfig[this.currentMenuId];
        const $currentForm = $(`#form-${this.currentMenuId}`);
        const formData = {};
        
        $currentForm.find('select, input, textarea').each(function() {
            const $element = $(this);
            const value = $element.val()?.toString().trim();
            if (value && value !== '00') {
                formData[this.id] = {
                    value: value,
                    text: $element.find('option:selected').text() || value
                };
            }
        });
        
        return {
            menuId: this.currentMenuId,
            menuName: config.name,
            formData: formData
        };
    }

    /**
     * 첫 번째 탭 활성화
     */
    activateFirstTab() {
        if (this.menuList.length > 0) {
            const firstMenu = this.menuList[0];
            this.currentMenuId = firstMenu.cl_hiery_ch_cd;
            this.initializeForm(this.currentMenuId);
            this.updateStatus();
        }
    }

    /**
     * 전체 초기화
     */
    reset() {
        if (this.currentMenuId) {
            this.initializeForm(this.currentMenuId);
            this.updateStatus();
        }
        console.log('TabFormSync 초기화 완료');
    }

    /**
     * 샘플 옵션 추가 (실제 환경에서는 API 연동 필요)
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
            ],
            'welfareSelect': [
                { value: 'WF001', text: '복지포인트 할인' },
                { value: 'WF002', text: '임직원 할인' },
                { value: 'WF003', text: '제휴 복지몰' }
            ],
            'bundleSelect': [
                { value: 'BDL001', text: '인터넷+TV 결합' },
                { value: 'BDL002', text: '인터넷+휴대폰 결합' },
                { value: 'BDL003', text: '전체 결합상품' }
            ]
        };
        
        // 정확히 매칭되는 샘플 데이터가 있으면 사용
        let options = sampleData[elementId] || [];
        
        // 매칭되지 않으면 패턴 기반으로 생성
        if (options.length === 0) {
            if (elementId.includes('Select') || elementId.includes('select')) {
                const menuId = elementId.replace(/Select$/i, '');
                options = [
                    { value: `${menuId.toUpperCase()}001`, text: `${menuId} 옵션 1` },
                    { value: `${menuId.toUpperCase()}002`, text: `${menuId} 옵션 2` },
                    { value: `${menuId.toUpperCase()}003`, text: `${menuId} 옵션 3` }
                ];
            }
        }
        
        options.forEach(option => {
            $select.append($('<option>').val(option.value).text(option.text));
        });
    }

    /**
     * 폴백 데이터 로드
     */
    loadFallbackData() {
        const fallbackData = {
            tabMenuList: [
                { "cl_hiery_ch_cd": "2001", "cl_hiery_ch_nm": "상품요약" },
                { "cl_hiery_ch_cd": "2002", "cl_hiery_ch_nm": "상품비교" },
                { "cl_hiery_ch_cd": "2004", "cl_hiery_ch_nm": "상품상세" },
                { "cl_hiery_ch_cd": "2006", "cl_hiery_ch_nm": "T카드요약" },
                { "cl_hiery_ch_cd": "2007", "cl_hiery_ch_nm": "복지요약" },
                { "cl_hiery_ch_cd": "2008", "cl_hiery_ch_nm": "결합상품요약" }
            ],
            menuConfigs: {
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
                        'queryInput': { type: 'textarea', defaultValue: '', label: '질문 입력', placeholder: 'T 상품에 대해 궁금한 점을 입력하세요...' }
                    }
                },
                '2006': {
                    elements: {
                        'cardSelect': { type: 'select', defaultValue: '00', label: '제휴카드' }
                    }
                },
                '2007': {
                    elements: {
                        'welfareSelect': { type: 'select', defaultValue: '00', label: '복지할인' }
                    }
                },
                '2008': {
                    elements: {
                        'bundleSelect': { type: 'select', defaultValue: '00', label: '결합상품' }
                    }
                }
            }
        };
        
        this.processMenuData(fallbackData);
        this.generateTabs();
        this.generateForms();
        this.activateFirstTab();
    }
}

// CommonJS/AMD 지원
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TabFormSync;
} else if (typeof define === 'function' && define.amd) {
    define(() => TabFormSync);
} else {
    window.TabFormSync = TabFormSync;
}
