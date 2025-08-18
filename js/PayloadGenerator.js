/**
 * PayloadGenerator - TabFormSync와 통합된 동적 페이로드 생성기
 * 
 * 핵심 기능:
 * - TabFormSync와 연동하여 현재 선택된 메뉴와 폼 데이터로 페이로드 자동 생성
 * - 메뉴별 페이로드 템플릿 및 변환 규칙 관리
 * - 동적 페이로드 구조 및 유효성 검증
 * - 서버 API 요청 형식에 맞는 JSON 구조 생성
 * 
 * @version 1.0.0
 * @author jaehoosu
 * @date 2025-08-06
 */

class PayloadGenerator {
    constructor(options = {}) {
        this.config = {
            // 기본 공통 설정
            defaultUser: options.user || 'anonymous',
            defaultType: options.type || 'chat',
            
            // JSP 변수 연동
            jspUser: options.jspUser || null,
            jspApiType: options.jspApiType || null,
            
            // TabFormSync 인스턴스 연결
            tabFormSync: options.tabFormSync || null,
            
            // 페이로드 생성 옵션
            includeTimestamp: options.includeTimestamp !== false,
            validatePayload: options.validatePayload !== false,
            
            ...options
        };

        // 메뉴별 페이로드 템플릿 정의
        this.payloadTemplates = this.initializePayloadTemplates();
        
        // 필드 매핑 규칙
        this.fieldMappings = this.initializeFieldMappings();
    }

    /**
     * 메뉴별 페이로드 템플릿 초기화
     */
    initializePayloadTemplates() {
        return {
            '2001': { // 상품정보/상품요약
                note: '상품요약',
                requiredFields: ['products'],
                optionalFields: [],
                dataSource: 'form'
            },
            '2002': { // 상품비교
                note: '상품비교',
                requiredFields: ['sourceProduct', 'targetProduct'],
                optionalFields: [],
                dataSource: 'form'
            },
            '2003': { // 태그정보
                note: '태그정보',
                requiredFields: ['products'],
                optionalFields: [],
                dataSource: 'form'
            },
            '2004': { // 지식질문/상품상세
                note: '상품상세',
                requiredFields: ['query'],
                optionalFields: [],
                dataSource: 'input'
            },
            '2005': { // 상품목차/상품상세(요약)
                note: '상품상세(요약)',
                requiredFields: ['products'],
                optionalFields: [],
                dataSource: 'form'
            },
            '2006': { // 제휴카드/T카드요약
                note: 'T카드요약',
                requiredFields: ['cardCode'],
                optionalFields: [],
                dataSource: 'form'
            },
            '2007': { // 복지할인/복지요약
                note: '복지요약',
                requiredFields: ['welfareCode'],
                optionalFields: [],
                dataSource: 'form'
            },
            '2008': { // 결합상품/조합상품요약
                note: '조합상품요약',
                requiredFields: ['bundleCode'],
                optionalFields: [],
                dataSource: 'form'
            }
        };
    }

    /**
     * 필드 매핑 규칙 초기화
     */
    initializeFieldMappings() {
        return {
            // TabFormSync 폼 데이터 → 페이로드 필드 매핑
            '2001': {
                'productSelect': 'products'
            },
            '2002': {
                'sourceProduct': 'sourceProduct',
                'targetProduct': 'targetProduct'
            },
            '2004': {
                'queryInput': 'query'
            },
            '2005': {
                'categorySelect': 'products'
            },
            '2006': {
                'cardSelect': 'cardCode'
            },
            '2007': {
                'welfareSelect': 'welfareCode'
            },
            '2008': {
                'bundleSelect': 'bundleCode'
            }
        };
    }

    /**
     * TabFormSync와 연동하여 현재 데이터로 페이로드 생성
     */
    generateFromTabFormSync() {
        if (!this.config.tabFormSync) {
            throw new Error('TabFormSync 인스턴스가 연결되지 않았습니다.');
        }

        const currentData = this.config.tabFormSync.getCurrentData();
        if (!currentData) {
            throw new Error('TabFormSync에서 현재 데이터를 가져올 수 없습니다.');
        }

        return this.generatePayload(currentData.menuId, currentData.formData);
    }

    /**
     * 메뉴 ID와 폼 데이터로 페이로드 생성
     */
    generatePayload(menuId, formData = {}) {
        if (!menuId) {
            throw new Error('메뉴 ID가 필요합니다.');
        }

        const template = this.payloadTemplates[menuId];
        if (!template) {
            throw new Error(`지원하지 않는 메뉴 ID입니다: ${menuId}`);
        }

        // 공통 헤더 생성
        const common = this.generateCommonHeader(menuId);
        
        // 옵션 생성
        const option = this.generateOptions();
        
        // 쿼리 본문 생성
        const query = this.generateQueryBody(menuId, formData, template);

        const payload = {
            common,
            option,
            query
        };

        // 유효성 검증
        if (this.config.validatePayload) {
            this.validatePayload(payload, template);
        }

        return payload;
    }

    /**
     * 공통 헤더 생성
     */
    generateCommonHeader(menuId) {
        return {
            iid: menuId,
            user: this.config.jspUser || this.config.defaultUser,
            req: this.generateRequestId(),
            type: this.config.jspApiType || this.config.defaultType,
            ...(this.config.includeTimestamp && { timestamp: new Date().toISOString() })
        };
    }

    /**
     * 옵션 생성 (DOM에서 체크박스 상태 읽기)
     */
    generateOptions() {
        // DOM 요소가 있으면 실제 값 사용, 없으면 기본값
        const getCheckboxValue = (id, defaultValue = false) => {
            const element = document.getElementById(id);
            return element ? element.checked : defaultValue;
        };

        return {
            cache: getCheckboxValue('opt-quick', true),
            stream: getCheckboxValue('opt-stream', true),
            tags: getCheckboxValue('opt-tag', true)
        };
    }

    /**
     * 쿼리 본문 생성
     */
    generateQueryBody(menuId, formData, template) {
        const query = {
            note: template.note
        };

        // 메뉴별 데이터 변환
        switch (menuId) {
            case '2001': // 상품정보
            case '2003': // 태그정보  
            case '2005': // 상품목차
                query.products = this.extractProducts(formData);
                break;

            case '2002': // 상품비교
                const products = this.extractProducts(formData);
                query.sourceProduct = products[0] || null;
                query.targetProduct = products[1] || null;
                break;

            case '2004': // 지식질문
                query.query = this.extractTextInput(formData, 'queryInput');
                break;

            case '2006': // 제휴카드
                query.cardCode = this.extractSelectValue(formData, 'cardSelect');
                break;

            case '2007': // 복지할인
                query.welfareCode = this.extractSelectValue(formData, 'welfareSelect');
                break;

            case '2008': // 결합상품
                query.bundleCode = this.extractSelectValue(formData, 'bundleSelect');
                break;

            default:
                throw new Error(`알 수 없는 메뉴 ID: ${menuId}`);
        }

        return query;
    }

    /**
     * 폼 데이터에서 상품 정보 추출
     */
    extractProducts(formData) {
        const products = [];
        
        // 단일 상품 선택
        const productData = this.extractFormElement(formData, 'productSelect');
        if (productData) {
            products.push(this.createProductObject(productData));
        }

        // 상품 비교용 소스/타겟
        const sourceData = this.extractFormElement(formData, 'sourceProduct');
        const targetData = this.extractFormElement(formData, 'targetProduct');
        
        if (sourceData) {
            const product = this.createProductObject(sourceData);
            product.__index = 0;
            product.__original_index = 0;
            products.push(product);
        }

        if (targetData) {
            const product = this.createProductObject(targetData);
            product.__index = 1;
            product.__original_index = 1;
            products.push(product);
        }

        return products;
    }

    /**
     * 상품 객체 생성
     */
    createProductObject(formElementData) {
        return {
            id: formElementData.value,
            name: formElementData.text,
            srvtp: 'P',
            __index: 0,
            __original_index: 0
        };
    }

    /**
     * 폼 데이터에서 선택 값 추출
     */
    extractSelectValue(formData, elementId) {
        const element = this.extractFormElement(formData, elementId);
        return element && element.value !== '00' ? element.value : null;
    }

    /**
     * 폼 데이터에서 텍스트 입력 값 추출
     */
    extractTextInput(formData, elementId) {
        const element = this.extractFormElement(formData, elementId);
        return element ? element.value : null;
    }

    /**
     * 폼 데이터에서 특정 요소 추출
     */
    extractFormElement(formData, elementId) {
        return formData[elementId] || null;
    }

    /**
     * 요청 ID 생성
     */
    generateRequestId() {
        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        const randomHashKey = btoa(String.fromCharCode.apply(null, array));
        return randomHashKey.replace(/\//g, '_')
                           .replace(/\+/g, '_')
                           .replace(/=+$/, '');
    }

    /**
     * 페이로드 유효성 검증
     */
    validatePayload(payload, template) {
        // 필수 구조 확인
        if (!payload.common || !payload.option || !payload.query) {
            throw new Error('페이로드에 필수 섹션(common, option, query)이 누락되었습니다.');
        }

        // 공통 헤더 필수 필드 확인
        const requiredCommonFields = ['iid', 'user', 'req', 'type'];
        for (const field of requiredCommonFields) {
            if (!payload.common[field]) {
                throw new Error(`공통 헤더에 필수 필드가 누락되었습니다: ${field}`);
            }
        }

        // 쿼리 필수 필드 확인 (메뉴별)
        for (const field of template.requiredFields) {
            if (payload.query[field] === undefined || payload.query[field] === null) {
                throw new Error(`쿼리에 필수 필드가 누락되었습니다: ${field}`);
            }
        }

        return true;
    }

    /**
     * 레거시 호환을 위한 기존 함수 형태로 페이로드 생성
     */
    generateLegacyPayload() {
        // 기존 JSP 방식과 호환
        const body_type = document.getElementById('choose_menu')?.value?.trim();
        if (!body_type) {
            throw new Error('메뉴가 선택되지 않았습니다.');
        }

        // TabFormSync가 연결되어 있으면 사용, 아니면 레거시 방식
        if (this.config.tabFormSync) {
            return this.generateFromTabFormSync();
        } else {
            return this.generateLegacyPayloadDirect(body_type);
        }
    }

    /**
     * 레거시 방식으로 직접 페이로드 생성 (기존 코드 호환)
     */
    generateLegacyPayloadDirect(body_type) {
        const body = this.createLegacyBody(body_type);
        
        if (!body) {
            throw new Error("요청 메시지 본문 생성 실패");
        }

        const streaming = document.getElementById('opt-stream')?.checked || false;
        const quick = document.getElementById('opt-quick')?.checked || false;
        const tag = document.getElementById('opt-tag')?.checked || false;

        return {
            common: {
                iid: body_type,
                user: this.config.jspUser || this.config.defaultUser,
                req: this.generateRequestId(),
                type: this.config.jspApiType || this.config.defaultType
            },
            option: {
                cache: quick,
                stream: streaming,
                tags: tag
            },
            query: body
        };
    }

    /**
     * 레거시 본문 생성 (기존 create_body 함수 호환)
     */
    createLegacyBody(body_type) {
        // 전역 변수 selectedProducts 참조 (레거시 호환)
        const selectedProducts = window.selectedProducts || [];
        
        switch (body_type) {
            case '2001':
                return {
                    note: '상품요약',
                    products: selectedProducts
                };
            case '2002':
                return {
                    note: '상품비교',
                    sourceProduct: selectedProducts[0] || null,
                    targetProduct: selectedProducts[1] || null
                };
            case '2003':
                return {
                    note: '태그정보',
                    products: selectedProducts
                };
            case '2004':
                const chatInput = document.getElementById('chatInput')?.value?.trim();
                return {
                    note: '상품상세',
                    query: chatInput
                };
            case '2005':
                return {
                    note: '상품상세(요약)',
                    products: selectedProducts
                };
            case '2006':
                const cardSelect = document.getElementById('cardSelect')?.value;
                return {
                    note: 'T카드요약',
                    cardCode: cardSelect !== '00' ? cardSelect : null
                };
            case '2007':
                const welfareSelect = document.getElementById('welfareSelect')?.value;
                return {
                    note: '복지요약',
                    welfareCode: welfareSelect !== '00' ? welfareSelect : null
                };
            case '2008':
                const bundleSelect = document.getElementById('bundleSelect')?.value;
                return {
                    note: '조합상품요약',
                    bundleCode: bundleSelect !== '00' ? bundleSelect : null
                };
            default:
                return null;
        }
    }

    /**
     * 디버깅용 페이로드 정보 출력
     */
    debugPayload(payload) {
        console.group('🔍 PayloadGenerator Debug');
        console.log('Generated Payload:', payload);
        console.log('Payload Size:', JSON.stringify(payload).length, 'bytes');
        console.log('Menu ID:', payload.common?.iid);
        console.log('User:', payload.common?.user);
        console.log('Request ID:', payload.common?.req);
        console.log('Query Type:', payload.query?.note);
        console.groupEnd();
        return payload;
    }
}

// CommonJS/AMD 지원
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PayloadGenerator;
} else if (typeof define === 'function' && define.amd) {
    define(() => PayloadGenerator);
} else {
    window.PayloadGenerator = PayloadGenerator;
}
