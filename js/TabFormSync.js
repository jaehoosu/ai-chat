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
 * @author jaehoosu
 * @date 2025-08-01
 */

class TabFormSync {
    constructor(options) {
        // 기본 설정
        this.config = {
            apiUrl: '/api/menu/list',        // 메뉴 데이터 API (필수 - 서버에서 로드)
            configUrl: null,                 // 메뉴 설정 API URL (선택사항 - 로컬 설정이 없을 때만 사용)
            tabContainer: '#tabContainer',
            formContainer: '#formContainer',
            statusElements: {
                currentMenu: '#currentMenu',
                currentValues: '#currentValues'
            },
            onTabChange: null,
            onFormChange: null,
            // 로컬 데이터 지원 (개발/테스트용)
            localMenuData: null,        // 개발/테스트용 로컬 메뉴 데이터 (서버 실패 시에만 사용)
            localMenuConfigs: null,     // 메뉴 설정 (로컬 우선 사용, 권장)
            // View 기반 옵션 데이터 (서버에서 View로 전달된 데이터)
            viewOptionData: null,       // JSP/View에서 전달된 셀렉트 옵션 데이터
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
     * 메뉴 데이터 로드 (menuData: 서버, menuConfigs: 로컬 우선)
     */
    async loadMenuData() {
        try {
            console.log('서버에서 메뉴 데이터 로드 시작...');
            
            // 1. 항상 서버에서 메뉴 데이터 로드
            const response = await fetch(this.config.apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const menuData = await response.json();
            console.log('서버 메뉴 데이터 로드 완료');
            
            // 2. 메뉴 설정은 로컬 우선, 없으면 기본 생성
            let configData = null;
            
            if (this.config.localMenuConfigs) {
                // 로컬 설정 우선 사용
                console.log('로컬 메뉴 설정 사용');
                configData = this.config.localMenuConfigs;
            } else if (this.config.configUrl) {
                // 로컬 설정이 없고 별도 설정 API가 있으면 사용
                console.log('설정 API에서 메뉴 설정 로드');
                configData = await this.loadMenuConfigs();
            }
            // configData가 null이면 processMenuData에서 기본 설정 자동 생성
            
            this.processMenuData(menuData, configData);
            
        } catch (error) {
            console.warn('서버 메뉴 데이터 로드 실패, 폴백 데이터 사용:', error);
            
            // 3. 서버 로드 실패 시 로컬 메뉴 데이터가 있으면 사용 (개발/테스트용)
            if (this.config.localMenuData) {
                console.log('로컬 메뉴 데이터로 폴백');
                const configData = this.config.localMenuConfigs || null;
                this.processMenuData(this.config.localMenuData, configData);
            } else {
                // 4. 최종 폴백 (하드코딩된 샘플 데이터)
                console.log('폴백 데이터 사용');
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
     * 메뉴 데이터 처리 (menuData: 서버, menuConfigs: 로컬)
     */
    processMenuData(menuData, localConfigData = null) {
        let menuList = [];
        let menuConfigs = {};

        console.log('메뉴 데이터 처리 시작:', { 
            hasMenuData: !!menuData, 
            hasLocalConfigs: !!localConfigData 
        });

        // 1. 서버에서 받은 메뉴 리스트 추출
        if (Array.isArray(menuData)) {
            // 단일 배열: 신규 구조 [{ id: "2001", name: "상품정보", description: "...", first_ref_text: 1 }, ...]
            // 또는 기존 구조 [{ cl_hiery_ch_cd: "2001", cl_hiery_ch_nm: "상품요약" }, ...]
            menuList = menuData;
        } else if (menuData && typeof menuData === 'object') {
            // 구조화된 객체: { tabMenuList: [...], menuList: [...] }
            menuList = menuData.tabMenuList || menuData.menuList || menuData.menus || [];
            // 서버 응답에 설정이 포함된 경우도 있을 수 있지만, 로컬 설정을 우선함
        }

        // 2. 메뉴 데이터 정렬 (first_ref_text 기준, 음수는 제외)
        if (Array.isArray(menuList)) {
            menuList = menuList
                .filter(menu => {
                    const refText = menu.first_ref_text;
                    return refText === undefined || refText >= 0;
                })
                .sort((a, b) => {
                    const aRef = a.first_ref_text || 0;
                    const bRef = b.first_ref_text || 0;
                    return aRef - bRef;
                });
        }

        // 3. 로컬 메뉴 설정 사용 (우선순위: 로컬 설정 > 기본 자동생성)
        if (localConfigData) {
            console.log('로컬 메뉴 설정 적용');
            menuConfigs = { ...localConfigData };
        }
        // localConfigData가 없으면 menuConfigs는 빈 객체로 남겨두고, 
        // buildMenuConfig에서 자동으로 기본 설정 생성

        // 4. 데이터 검증
        if (!Array.isArray(menuList) || menuList.length === 0) {
            console.warn('올바르지 않은 메뉴 데이터 형식:', menuData);
            menuList = [];
        }

        // 5. 내부 상태 설정
        this.menuList = menuList;
        this.buildMenuConfig(menuConfigs);
        
        console.log('메뉴 데이터 처리 완료:', {
            menuCount: this.menuList.length,
            configCount: Object.keys(menuConfigs).length,
            dataStructure: this.detectDataStructure(menuList[0])
        });
    }

    /**
     * 데이터 구조 감지 (신규/기존 구조)
     */
    detectDataStructure(menu) {
        if (!menu) return 'unknown';
        if (menu.id && menu.name) return 'new'; // 신규 구조
        if (menu.cl_hiery_ch_cd && menu.cl_hiery_ch_nm) return 'legacy'; // 기존 구조
        return 'unknown';
    }

    /**
     * 메뉴 ID 추출 (신규/기존 구조 호환)
     */
    getMenuId(menu) {
        return menu.id || menu.cl_hiery_ch_cd || null;
    }

    /**
     * 메뉴 이름 추출 (신규/기존 구조 호환)
     */
    getMenuName(menu) {
        return menu.name || menu.cl_hiery_ch_nm || '';
    }

    /**
     * 메뉴 설명 추출 (신규 구조 전용)
     */
    getMenuDescription(menu) {
        return menu.description || '';
    }

    /**
     * 메뉴 설정 빌드
     */
    buildMenuConfig(menuConfigs) {
        this.menuConfig = {};
        
        this.menuList.forEach(menu => {
            const menuId = this.getMenuId(menu);
            const menuName = this.getMenuName(menu);
            const menuDescription = this.getMenuDescription(menu);
            
            if (!menuId) {
                console.warn('메뉴 ID를 찾을 수 없습니다:', menu);
                return;
            }
            
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
                description: menuDescription,
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
            const menuId = this.getMenuId(menu);
            const menuName = this.getMenuName(menu);
            const menuDescription = this.getMenuDescription(menu);
            
            if (!menuId || !menuName) {
                console.warn('탭 생성 실패 - 필수 정보 누락:', menu);
                return;
            }
            
            const $li = $('<li>');
            const $a = $('<a>')
                .attr('href', '#')
                .addClass(isFirst ? 'current' : '')
                .text(menuName)
                .attr('title', menuDescription || menuName) // 툴팁으로 설명 표시
                .on('click', (e) => {
                    e.preventDefault();
                    this.changeTab(menuId, menuName, e.target);
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
            const menuId = this.getMenuId(menu);
            const menuName = this.getMenuName(menu);
            const config = this.menuConfig[menuId];
            const isFirst = index === 0;
            
            if (!menuId) {
                console.warn('폼 생성 실패 - 메뉴 ID 누락:', menu);
                return;
            }
            
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
                    .html(`<p>${menuName} 메뉴에 대한 설정 항목이 없습니다.</p>`);
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
            const menuId = this.getMenuId(firstMenu);
            
            if (menuId) {
                this.currentMenuId = menuId;
                this.initializeForm(this.currentMenuId);
                this.updateStatus();
            }
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
     * 셀렉트 옵션 추가 (View 데이터 우선, 폴백으로 샘플 데이터)
     */
    addSampleOptions($select, elementId) {
        let options = [];
        
        // 1. View에서 전달된 옵션 데이터 우선 사용
        if (this.config.viewOptionData && this.config.viewOptionData[elementId]) {
            options = this.config.viewOptionData[elementId];
            console.log(`View 옵션 데이터 사용: ${elementId}`, options);
        }
        // 2. View 데이터가 없으면 기존 샘플 데이터 사용 (폴백)
        else {
            options = this.getFallbackOptions(elementId);
            console.log(`폴백 옵션 데이터 사용: ${elementId}`, options);
        }
        
        // 3. 옵션을 셀렉트에 추가
        options.forEach(option => {
            $select.append($('<option>').val(option.value).text(option.text));
        });
    }

    /**
     * 폴백 옵션 데이터 (기존 샘플 데이터)
     */
    getFallbackOptions(elementId) {
        const sampleData = {
            'productSelect': [
                { value: 'PROD001', text: 'KT 5G 플랜 A' },
                { value: 'PROD002', text: 'KT 5G 플랜 B' },
                { value: 'PROD003', text: 'KT WiFi 상품' }
            ],
            'sourceProduct': [
                { value: 'PROD001', text: 'KT 5G 플랜 A' },
                { value: 'PROD002', text: 'KT 5G 플랜 B' },
                { value: 'PROD003', text: 'KT WiFi 상품' }
            ],
            'targetProduct': [
                { value: 'PROD001', text: 'KT 5G 플랜 A' },
                { value: 'PROD002', text: 'KT 5G 플랜 B' },
                { value: 'PROD003', text: 'KT WiFi 상품' }
            ],
            'cardSelect': [
                { value: 'CARD001', text: 'KT 알파 카드' },
                { value: 'CARD002', text: 'KT 멤버십 카드' },
                { value: 'CARD003', text: 'KT Y 카드' }
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
        
        return options;
    }

    /**
     * 폴백 데이터 로드
     */
    loadFallbackData() {
        // 신규 데이터 구조로 폴백 데이터 제공
        const fallbackData = [
            {
                "id": "2001",
                "name": "상품정보",
                "description": "상품 정보를 요약해서 보여줍니다",
                "first_ref_text": 1
            },
            {
                "id": "2002",
                "name": "상품비교",
                "description": "두 개의 상품을 비교 분석합니다",
                "first_ref_text": 2
            },
            {
                "id": "2004",
                "name": "지식질문",
                "description": "사용자 질의를 통한 상품 상세 정보",
                "first_ref_text": 4
            },
            {
                "id": "2005",
                "name": "상품목차",
                "description": "상품 상세 정보를 요약 형태로 제공",
                "first_ref_text": 5
            },
            {
                "id": "2006",
                "name": "제휴카드",
                "description": "KT 제휴 카드 정보를 요약합니다",
                "first_ref_text": 6
            },
            {
                "id": "2007",
                "name": "복지할인",
                "description": "복지 혜택 정보를 요약합니다",
                "first_ref_text": 7
            },
            {
                "id": "2008",
                "name": "결합상품",
                "description": "조합 상품의 정보를 요약합니다",
                "first_ref_text": 8
            }
        ];
        
        // 기본 폼 설정도 신규 ID 구조에 맞게 수정
        const fallbackConfigs = {
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
                    'queryInput': { type: 'textarea', defaultValue: '', label: '질문 입력', placeholder: 'KT 상품에 대해 궁금한 점을 입력하세요...' }
                }
            },
            '2005': {
                elements: {
                    'categorySelect': { type: 'select', defaultValue: '00', label: '카테고리 선택' }
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
        };
        
        console.log('폴백 데이터 로드 - 신규 구조 사용');
        this.processMenuData(fallbackData, fallbackConfigs);
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
