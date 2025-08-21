/**
 * TabFormSync - 탭 메뉴와 입력 폼 동기화 플러그인 (v1.1)
 * 
 * 추가 기능:
 * - 메뉴별 textarea에 SHIFT+ENTER, ENTER 키 이벤트 처리
 * - 외부 이벤트 핸들러 등록 지원
 * 
 * @Author jaehoosu.
 * @version 1.1.0
 * @date 2025.08.21
 */

class TabFormSync {
    constructor(options) {
        // 기본 설정
        this.config = {
            apiUrl: options.apiUri || '/api/menu/list',
            configUrl: options.configUrl || null,
            tabContainer: options.tabContainer || '#tabContainer',
            formContainer: options.formContainer || '#formContainer',
            statusElements: {
                currentMenu: '#currentMenu',
                currentValues: '#currentValues'
            },
            onTabChange: null,
            onFormChange: null,
            localMenuData: null,
            localMenuConfigs: null,
            useLocalData: false,
            viewOptionData: null,
            ...options
        };

        this.menuList = [];
        this.menuConfig = {};
        this.currentMenuId = null;
        this.$tabContainer = null;
        this.$formContainer = null;
        this.$statusElements = {};
        this._sendHandlers = new Map();
    }

    async init() {
        try {
            this.cacheElements();
            await this.loadMenuData();
            this.generateTabs();
            this.generateForms();
            this.activateFirstTab();
        } catch (error) {
            console.error('TabFormSync 초기화 실패:', error);
            this.loadFallbackData();
        }
    }

    cacheElements() {
        this.$tabContainer = $(this.config.tabContainer);
        this.$formContainer = $(this.config.formContainer);
        Object.keys(this.config.statusElements).forEach(key => {
            this.$statusElements[key] = $(this.config.statusElements[key]);
        });
    }

    registerSendHandler(menuId, handler) {
        if (!menuId || typeof handler !== 'function') return false;
        this._sendHandlers.set(String(menuId), handler);
        try {
            this._maybeBindSendHandlerFor(menuId);
        } catch (err) {
            console.warn('registerSendHandler dynamic bind failed', err);
        }
        return true;
    }

    unregisterSendHandler(menuId) {
        if (!menuId) return false;
        this._sendHandlers.delete(String(menuId));
        const $ta = $(`#form-${menuId}`).find('textarea');
        if ($ta && $ta.length > 0) {
            $ta.off('.send');
        }
        return true;
    }

    _maybeBindSendHandlerFor(menuId) {
        if (!menuId) return false;
        const handler = this._sendHandlers.get(String(menuId));
        const $ta = $(`#form-${menuId}`).find('textarea');
        if (!$ta || $ta.length === 0) return false;

        $ta.off('.send');
        let composing = false;
        $ta.on('compositionstart.send', () => { composing = true; });
        $ta.on('compositionend.send', () => { composing = false; });

        $ta.on('keydown.send', (e) => {
            if (composing) return;
            const key = e.key || e.keyCode || e.which;
            const isEnter = key === 'Enter' || key === 13 || key === '13';
            if (isEnter && !e.shiftKey) {
                e.preventDefault();
                const formData = this.getCurrentData();
                const rawText = $ta.val();
                try {
                    if (typeof handler === 'function') {
                        handler(formData, { menuId: String(menuId), rawText, element: $ta[0] });
                        return;
                    }
                    if (this.config.onFormChange) this.config.onFormChange(this.getCurrentData());
                } catch (err) {
                    console.error('sendHandler invocation failed', err);
                }
            }
        });
    }

    getCurrentData() {
        // 현재 폼 데이터를 수집하는 메서드 (구현 필요)
        return {};
    }

    async loadMenuData() {
        this.menuList = [
            { id: '2001', name: 'Menu 2001', description: 'Description for Menu 2001' },
            { id: '2002', name: 'Menu 2002', description: 'Description for Menu 2002' },
            { id: '2003', name: 'Menu 2003', description: 'Description for Menu 2003' },
            { id: '2004', name: 'Menu 2004', description: 'Description for Menu 2004' }
        ];
    }

    generateTabs() {
        this.$tabContainer.empty();
        this.menuList.forEach((menu, index) => {
            const isActive = index === 0;
            const $tab = $(`<a href="#" data-menu-id="${menu.id}" class="${isActive ? 'current' : ''}">${menu.name}</a>`);
            $tab.on('click', (e) => {
                e.preventDefault();
                this.currentMenuId = menu.id;
                this.$tabContainer.find('a').removeClass('current');
                $tab.addClass('current');
                this.generateForms();
            });
            this.$tabContainer.append($tab);
        });
    }

    generateForms() {
        this.$formContainer.empty();
        this.menuList.forEach(menu => {
            const isActive = menu.id === this.currentMenuId;
            const menuConfig = this.menuConfig[menu.id] || {};
            const $form = $(`<div id="form-${menu.id}" class="menu-form ${isActive ? 'active' : ''}">
                <h3>${menu.name} Form</h3>
            </div>`);

            if (menuConfig.elements) {
                Object.keys(menuConfig.elements).forEach(elementId => {
                    const elementConfig = menuConfig.elements[elementId];
                    let $input;
                    switch (elementConfig.type) {
                        case 'select':
                            $input = $(`<select id="${elementId}"></select>`);
                            (this.config.viewOptionData[elementId] || []).forEach(option => {
                                $input.append(`<option value="${option.value}">${option.text}</option>`);
                            });
                            break;
                        case 'textarea':
                            $input = $(`<textarea id="${elementId}" placeholder="${elementConfig.placeholder || ''}">${elementConfig.defaultValue || ''}</textarea>`);
                            break;
                        default:
                            $input = $(`<input id="${elementId}" type="text" placeholder="${elementConfig.placeholder || ''}" value="${elementConfig.defaultValue || ''}">`);
                    }
                    $form.append(`<div class="form-group">
                        <label for="${elementId}">${elementConfig.label || elementId}</label>
                    </div>`).append($input);
                });
            }

            this.$formContainer.append($form);
        });
    }

    activateFirstTab() {
        // 첫 번째 탭을 활성화하는 메서드 (구현 필요)
    }

    loadFallbackData() {
        // 폴백 데이터를 로드하는 메서드 (구현 필요)
    }
}
