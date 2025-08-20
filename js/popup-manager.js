/**
 * PopupManager - 편집 가능한 팝업 관리 모듈
 * 
 * 기능:
 * - Cache/Prompt 데이터 편집 팝업
 * - 저장/삭제/닫기 액션 지원
 * - 템플릿 기반 팝업 생성
 * - 이벤트 기반 콜백 처리
 * 
 * 사용법:
 * PopupManager.show('cache', data, {
 *     onSave: (data) => console.log('저장:', data),
 *     onDelete: () => console.log('삭제'),
 *     onClose: () => console.log('닫기')
 * });
 */

(function($) {
    'use strict';

    // jQuery가 로드되었는지 확인
    if (typeof $ === 'undefined') {
        throw new Error('PopupManager requires jQuery');
    }

    // 팝업 템플릿 정의
    const PopupTemplates = {
        cache: {
            title: '캐시 데이터 편집',
            html: `
                <div class="popup-header">
                    <h3 class="popup-title">{{title}}</h3>
                    <button class="popup-close-btn">&times;</button>
                </div>
                <div class="popup-body">
                    <div class="popup-form-group">
                        <label class="popup-label">데이터 내용:</label>
                        <textarea class="popup-textarea" placeholder="캐시 데이터를 입력하세요..."></textarea>
                    </div>
                </div>
                <div class="popup-footer">
                    <button class="popup-btn popup-btn-primary popup-save">저장</button>
                    <button class="popup-btn popup-btn-danger popup-delete">삭제</button>
                    <button class="popup-btn popup-btn-secondary popup-close">닫기</button>
                </div>`,
            actions: ['save', 'delete', 'close']
        },
        
        prompt: {
            title: '프롬프트 편집',
            html: `
                <div class="popup-header">
                    <h3 class="popup-title">{{title}}</h3>
                    <button class="popup-close-btn">&times;</button>
                </div>
                <div class="popup-body">
                    <div class="popup-form-group">
                        <label class="popup-label">프롬프트 내용:</label>
                        <textarea class="popup-textarea" placeholder="프롬프트를 입력하세요..."></textarea>
                    </div>
                </div>
                <div class="popup-footer">
                    <button class="popup-btn popup-btn-primary popup-save">저장</button>
                    <button class="popup-btn popup-btn-secondary popup-close">닫기</button>
                </div>`,
            actions: ['save', 'close']
        }
    };

    // 기본 CSS 스타일
    const PopupStyles = `
        <style id="popup-manager-styles">
            .popup-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 10000;
                display: flex;
                justify-content: center;
                align-items: center;
                font-family: Arial, sans-serif;
            }
            
            .popup-container {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow: hidden;
                animation: popupFadeIn 0.3s ease;
            }
            
            @keyframes popupFadeIn {
                from { opacity: 0; transform: scale(0.9); }
                to { opacity: 1; transform: scale(1); }
            }
            
            .popup-header {
                background: #f8f9fa;
                padding: 15px 20px;
                border-bottom: 1px solid #dee2e6;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .popup-title {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: #333;
            }
            
            .popup-close-btn {
                background: none;
                border: none;
                font-size: 24px;
                color: #6c757d;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
            }
            
            .popup-close-btn:hover {
                background: #e9ecef;
                color: #495057;
            }
            
            .popup-body {
                padding: 20px;
                max-height: 60vh;
                overflow-y: auto;
            }
            
            .popup-form-group {
                margin-bottom: 15px;
            }
            
            .popup-label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: #333;
                font-size: 14px;
            }
            
            .popup-textarea {
                width: 100%;
                min-height: 200px;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
                font-family: 'Courier New', monospace;
                resize: vertical;
                box-sizing: border-box;
            }
            
            .popup-textarea:focus {
                outline: none;
                border-color: #007bff;
                box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
            }
            
            .popup-footer {
                background: #f8f9fa;
                padding: 15px 20px;
                border-top: 1px solid #dee2e6;
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }
            
            .popup-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .popup-btn-primary {
                background: #007bff;
                color: white;
            }
            
            .popup-btn-primary:hover {
                background: #0056b3;
            }
            
            .popup-btn-danger {
                background: #dc3545;
                color: white;
            }
            
            .popup-btn-danger:hover {
                background: #c82333;
            }
            
            .popup-btn-secondary {
                background: #6c757d;
                color: white;
            }
            
            .popup-btn-secondary:hover {
                background: #545b62;
            }
        </style>
    `;

    // PopupManager 클래스
    class PopupManager {
        constructor() {
            this.activePopups = new Map();
            this.popupIdCounter = 0;
            this.stylesInjected = false;
        }

        /**
         * CSS 스타일 주입
         */
        injectStyles() {
            if (!this.stylesInjected) {
                $('head').append(PopupStyles);
                this.stylesInjected = true;
            }
        }

        /**
         * 팝업 표시
         * @param {string} type - 팝업 타입 ('cache' 또는 'prompt')
         * @param {string} data - 초기 데이터
         * @param {object} options - 옵션 {title, onSave, onDelete, onClose}
         * @returns {object} 팝업 인스턴스
         */
        show(type, data = '', options = {}) {
            this.injectStyles();
            
            const template = PopupTemplates[type];
            if (!template) {
                throw new Error(`Unknown popup type: ${type}`);
            }

            const popupId = `popup-${++this.popupIdCounter}`;
            const title = options.title || template.title;
            
            // HTML 생성
            const popupHtml = this.createPopupHtml(popupId, template, title, data);
            
            // DOM에 추가
            const $popup = $(popupHtml);
            $('body').append($popup);
            
            // 팝업 인스턴스 생성
            const popup = {
                id: popupId,
                type: type,
                element: $popup,
                getData: () => $popup.find('.popup-textarea').val(),
                setData: (newData) => $popup.find('.popup-textarea').val(newData),
                close: () => this.hide(popupId)
            };
            
            // 이벤트 바인딩
            this.bindEvents(popup, options);
            
            // 포커스 설정
            setTimeout(() => {
                $popup.find('.popup-textarea').focus();
            }, 100);
            
            this.activePopups.set(popupId, popup);
            return popup;
        }

        /**
         * 팝업 HTML 생성
         */
        createPopupHtml(popupId, template, title, data) {
            const content = template.html.replace('{{title}}', title);
            
            return `
                <div id="${popupId}" class="popup-overlay">
                    <div class="popup-container">
                        ${content}
                    </div>
                </div>
            `.replace('<textarea class="popup-textarea"', `<textarea class="popup-textarea">${data}</textarea><textarea style="display:none" class="popup-textarea"`);
        }

        /**
         * 이벤트 바인딩
         */
        bindEvents(popup, options) {
            const $popup = popup.element;
            
            // 저장 버튼
            $popup.find('.popup-save').on('click', () => {
                const data = popup.getData();
                if (options.onSave) {
                    options.onSave(data, popup);
                }
            });
            
            // 삭제 버튼 (cache만)
            $popup.find('.popup-delete').on('click', () => {
                if (confirm('정말 삭제하시겠습니까?')) {
                    if (options.onDelete) {
                        options.onDelete(popup);
                    }
                }
            });
            
            // 닫기 버튼들
            $popup.find('.popup-close, .popup-close-btn').on('click', () => {
                if (options.onClose) {
                    options.onClose(popup);
                }
                popup.close();
            });
            
            // 오버레이 클릭 시 닫기
            $popup.on('click', (e) => {
                if (e.target === $popup[0]) {
                    if (options.onClose) {
                        options.onClose(popup);
                    }
                    popup.close();
                }
            });
            
            // ESC 키로 닫기
            $(document).on(`keydown.popup-${popup.id}`, (e) => {
                if (e.key === 'Escape') {
                    if (options.onClose) {
                        options.onClose(popup);
                    }
                    popup.close();
                }
            });
        }

        /**
         * 팝업 숨기기
         * @param {string} popupId - 팝업 ID
         */
        hide(popupId) {
            const popup = this.activePopups.get(popupId);
            if (popup) {
                // 이벤트 리스너 정리
                $(document).off(`keydown.popup-${popupId}`);
                
                // 애니메이션과 함께 제거
                popup.element.fadeOut(200, () => {
                    popup.element.remove();
                });
                
                this.activePopups.delete(popupId);
            }
        }

        /**
         * 모든 팝업 닫기
         */
        hideAll() {
            for (const [popupId] of this.activePopups) {
                this.hide(popupId);
            }
        }

        /**
         * 활성 팝업 개수
         */
        getActiveCount() {
            return this.activePopups.size;
        }
    }

    // 전역 인스턴스 생성
    const popupManager = new PopupManager();

    // jQuery에 플러그인 등록
    $.popupManager = popupManager;

    // 전역 객체로도 접근 가능
    window.PopupManager = popupManager;

})(jQuery);
