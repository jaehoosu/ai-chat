/**
 * TabFormSync - 간단하고 깔끔한 탭↔폼 동기화
 * 
 * 핵심만 구현:
 * - REST API 메뉴 데이터 로드
 * - 탭 생성 & 폼 생성
 * - 탭↔폼 동기화
 * - 폼 값 추출
 */
class TabFormSync {
    constructor(config) {
        this.apiUrl = config.apiUrl || '/api/menu/list';
        this.tabContainer = config.tabContainer || '#tabContainer';
        this.formContainer = config.formContainer || '#formContainer';
        this.onTabChange = config.onTabChange || null;
        this.onFormChange = config.onFormChange || null;
        
        // CSS 설정
        this.useInternalCSS = config.useInternalCSS !== false; // 기본값 true
        
        // 테스트용
        this.useLocalData = config.useLocalData || false;
        this.localData = config.localMenuData || config.localData || null;
        
        // 상태
        this.menus = [];
        this.currentMenuId = null;
    }

    /**
     * 시작
     */
    async init() {
        console.log('TabFormSync 시작...');
        
        // 내장 CSS 적용
        if (this.useInternalCSS) {
            this.applyInternalCSS();
        }
        
        try {
            await this.loadMenus();
            this.createTabs();
            this.createForms();
            this.activateFirst();
            console.log('완료!');
        } catch (error) {
            console.error('실패:', error);
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
                    $form.append(this.createField(field));
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
    createField(field) {
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
        } else {
            $input = $('<input>')
                .attr('type', 'text')
                .attr('id', field.id)
                .attr('placeholder', field.placeholder || '');
        }

        if (field.disabled) $input.prop('disabled', true);
        
        $input.on('change input', () => {
            if (this.onFormChange) {
                this.onFormChange(this.getValues());
            }
        });

        return $group.append($label).append($input);
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
    getValues() {
        if (!this.currentMenuId) return null;

        const $form = $(`#form-${this.currentMenuId}`);
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
            menuId: this.currentMenuId,
            menuName: this.getMenuName(this.currentMenuId),
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
}

// 전역 등록
window.TabFormSync = TabFormSync;