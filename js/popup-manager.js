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

    // 기본 CSS 스타일 (강력한 우선순위)
    const PopupStyles = `
        <style id="popup-manager-styles">
            .popup-overlay {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: rgba(0, 0, 0, 0.5) !important;
                z-index: 999999 !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                font-family: Arial, sans-serif !important;
                box-sizing: border-box !important;
            }
            
            .popup-container {
                background: white !important;
                border-radius: 8px !important;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
                width: 600px;
                height: 500px;
                min-width: 400px !important;
                min-height: 300px !important;
                max-width: 90vw !important;
                max-height: 90vh !important;
                overflow: hidden !important;
                animation: popupFadeIn 0.3s ease !important;
                position: relative;
                resize: both;
                display: flex !important;
                flex-direction: column !important;
                margin: auto;
                transform: none;
                left: 0;
                top: 0;
                box-sizing: border-box !important;
            }
            
            @keyframes popupFadeIn {
                from { opacity: 0; transform: scale(0.9); }
                to { opacity: 1; transform: scale(1); }
            }
            
            .popup-header {
                background: #f8f9fa !important;
                padding: 15px 20px !important;
                border-bottom: 1px solid #dee2e6 !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                flex-shrink: 0 !important;
                cursor: move !important;
                user-select: none !important;
                position: relative !important;
                box-sizing: border-box !important;
            }
            
            .popup-header:hover {
                background: #e9ecef !important;
            }
            
            .popup-title {
                pointer-events: none !important;
                margin: 0 !important;
                font-size: 18px !important;
                font-weight: 600 !important;
                color: #333 !important;
            }
            
            .popup-close-btn {
                background: none !important;
                border: none !important;
                font-size: 24px !important;
                color: #6c757d !important;
                cursor: pointer !important;
                padding: 0 !important;
                width: 30px !important;
                height: 30px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                border-radius: 4px !important;
            }
            
            .popup-close-btn:hover {
                background: #e9ecef !important;
                color: #495057 !important;
            }
            
            .popup-body {
                padding: 20px !important;
                flex: 1 !important;
                overflow-y: auto !important;
                display: flex !important;
                flex-direction: column !important;
                box-sizing: border-box !important;
            }
            
            .popup-form-group {
                margin-bottom: 15px !important;
                flex: 1 !important;
                display: flex !important;
                flex-direction: column !important;
            }
            
            .popup-label {
                display: block !important;
                margin-bottom: 8px !important;
                font-weight: 600 !important;
                color: #333 !important;
                font-size: 14px !important;
            }
            
            .popup-textarea {
                width: 100% !important;
                flex: 1 !important;
                min-height: 150px !important;
                padding: 12px !important;
                border: 1px solid #ddd !important;
                border-radius: 4px !important;
                font-size: 14px !important;
                font-family: 'Courier New', monospace !important;
                resize: none !important;
                box-sizing: border-box !important;
            }
            
            .popup-textarea:focus {
                outline: none !important;
                border-color: #007bff !important;
                box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25) !important;
            }
            
            .popup-btn-disabled {
                opacity: 0.5 !important;
                cursor: not-allowed !important;
                pointer-events: none !important;
            }
            
            .popup-footer {
                background: #f8f9fa !important;
                padding: 15px 20px !important;
                border-top: 1px solid #dee2e6 !important;
                display: flex !important;
                gap: 10px !important;
                justify-content: flex-end !important;
                flex-shrink: 0 !important;
                box-sizing: border-box !important;
            }
            
            /* 리사이즈 핸들 스타일링 */
            .popup-container::-webkit-resizer {
                background: #dee2e6;
                border-radius: 0 0 8px 0;
            }
            
            .popup-btn {
                padding: 8px 16px !important;
                border: none !important;
                border-radius: 4px !important;
                font-size: 14px !important;
                font-weight: 500 !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
            }
            
            /* 기본 팝업 버튼 스타일 (사용자 정의 클래스가 없을 때만 적용) */
            .popup-btn.popup-btn-primary {
                background: #007bff !important;
                color: white !important;
            }
            
            .popup-btn.popup-btn-primary:hover {
                background: #0056b3 !important;
            }
            
            .popup-btn.popup-btn-danger {
                background: #dc3545 !important;
                color: white !important;
            }
            
            .popup-btn.popup-btn-danger:hover {
                background: #c82333 !important;
            }
            
            .popup-btn.popup-btn-secondary {
                background: #6c757d !important;
                color: white !important;
            }
            
            .popup-btn.popup-btn-secondary:hover {
                background: #545b62 !important;
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
         * @param {object} options - 옵션 {title, onSave, onDelete, onClose, buttonClass}
         * @returns {object} 팝업 인스턴스
         */
        // 편집된 데이터를 원본의 HTML 엔티티 형식으로 변환 (원본은 절대 변경하지 않음)
        convertEditedDataToOriginalFormat(editedData, originalData) {
            if (!editedData) return '';
            if (!originalData) return editedData;
            
            // 원본에 HTML 엔티티가 있는지 확인
            const hasEntities = /&[a-zA-Z0-9#]+;/.test(originalData);
            
            if (!hasEntities) {
                // 원본에 엔티티가 없으면 편집된 데이터를 그대로 반환
                return editedData;
            }
            
            // 편집된 데이터를 원본과 동일한 HTML 엔티티 형식으로 변환
            // 순서가 중요: & 문자를 먼저 처리해야 함
            let converted = editedData
                .replace(/&/g, '&amp;')     // & -> &amp; (가장 먼저 처리)
                .replace(/</g, '&lt;')      // < -> &lt;
                .replace(/>/g, '&gt;')      // > -> &gt;
                .replace(/"/g, '&quot;')    // " -> &quot;
                .replace(/'/g, '&#39;')     // ' -> &#39;
                .replace(/\//g, '&#47;');   // / -> &#47;
            
            return converted;
        }

        show(type, data = '', options = {}) {
            this.injectStyles();
            
            const template = PopupTemplates[type];
            if (!template) {
                throw new Error(`Unknown popup type: ${type}`);
            }

            const popupId = `popup-${++this.popupIdCounter}`;
            const title = options.title || template.title;
            
            // HTML 생성 (버튼 클래스 옵션 적용)
            const popupHtml = this.createPopupHtml(popupId, template, title, data, options.buttonClass);
            
            // DOM에 추가
            const $popup = $(popupHtml);
            
            // 기존 코드 호환성을 위한 강제 스타일 적용
            $popup.css({
                'display': 'flex !important',
                'position': 'fixed !important',
                'top': '0 !important',
                'left': '0 !important',
                'width': '100% !important',
                'height': '100% !important',
                'z-index': '999999 !important',
                'justify-content': 'center !important',
                'align-items': 'center !important'
            });
            
            // 컨테이너 중앙 정렬 강제 (드래그 가능하도록 수정)
            const $container = $popup.find('.popup-container');
            $container.css({
                'position': 'relative',
                'margin': 'auto',
                'transform': 'none',
                'left': '0',
                'top': '0'
            });
            
            $('body').append($popup);
            
            // 강제로 표시 (기존 코드 호환성)
            $popup.show();
            
            // 입력 텍스트에 변경 이벤트 바인딩
            $popup.find('.popup-textarea').on('input', () => {
                if (popup && popup.updateSaveButton) {
                    popup.updateSaveButton();
                }
            });
            
            // 팝업 인스턴스 생성
            const popup = {
                id: popupId,
                type: type,
                element: $popup,
                originalData: data, // 원본 데이터 저장
                getData: () => $popup.find('.popup-textarea').val(),
                // 편집된 데이터를 다양한 형식으로 가져오는 메서드
                getEditedData: (options = {}) => {
                    const rawData = $popup.find('.popup-textarea').val();
                    
                    // 기본 옵션
                    const opts = {
                        format: 'raw',           // 'raw', 'encoded', 'trimmed'
                        removeEmptyLines: false, // 빈 줄 제거 여부
                        normalizeLineBreaks: false, // 줄바꿈 문자 통일 여부
                        ...options
                    };
                    
                    let result = rawData;
                    
                    // 형식에 따른 처리
                    switch (opts.format) {
                        case 'encoded':
                            // 원본 형식으로 인코딩
                            result = popup.convertToOriginalFormat(rawData);
                            break;
                        case 'trimmed':
                            // 앞뒤 공백 제거
                            result = rawData.trim();
                            break;
                        case 'raw':
                        default:
                            // 원본 그대로
                            result = rawData;
                            break;
                    }
                    
                    // 빈 줄 제거
                    if (opts.removeEmptyLines) {
                        result = result.replace(/^\s*[\r\n]/gm, '');
                    }
                    
                    // 줄바꿈 문자 통일
                    if (opts.normalizeLineBreaks) {
                        result = result.replace(/\r\n/g, '\n');
                    }
                    
                    return result;
                },
                setData: (newData) => {
                    $popup.find('.popup-textarea').val(newData);
                    popup.originalData = newData; // 원본 데이터 업데이트
                    popup.updateSaveButton(); // 저장 버튼 상태 업데이트
                },
                // 편집된 데이터를 원본 형식으로 변환하는 메서드
                convertToOriginalFormat: (editedData) => {
                    return this.convertEditedDataToOriginalFormat(editedData || popup.getData(), popup.originalData);
                },
                close: () => this.hide(popupId),
                // 변경 여부 확인 메서드
                isModified: () => {
                    const currentEditedData = popup.getData();
                    const originalData = popup.originalData; // 원본은 절대 변경하지 않음
                    
                    // 편집된 데이터만 원본 형식으로 변환하여 원본과 비교
                    const convertedEditedData = this.convertEditedDataToOriginalFormat(currentEditedData, originalData);
                    
                    // 변환된 편집 데이터와 원본 데이터 직접 비교
                    return convertedEditedData !== originalData;
                },
                // 저장 버튼 상태 업데이트 메서드
                updateSaveButton: () => {
                    const $saveBtn = $popup.find('.popup-save, [class*="popup-save"]');
                    const isChanged = popup.isModified();
                    
                    if (isChanged) {
                        $saveBtn.prop('disabled', false).removeClass('popup-btn-disabled');
                    } else {
                        $saveBtn.prop('disabled', true).addClass('popup-btn-disabled');
                    }
                }
            };
            
            // 이벤트 바인딩
            this.bindEvents(popup, options);
            
            // 초기 저장 버튼 상태 설정
            popup.updateSaveButton();
            
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
        createPopupHtml(popupId, template, title, data, buttonClass = null) {
            let content = template.html.replace('{{title}}', title);
            
            // 버튼 클래스 교체 (기존 코드 스타일 사용)
            if (buttonClass) {
                // 기본 popup-btn 클래스를 기존 버튼 클래스로 교체
                content = content.replace(/popup-btn popup-btn-primary/g, `${buttonClass}`);
                content = content.replace(/popup-btn popup-btn-danger/g, `${buttonClass}`);
                content = content.replace(/popup-btn popup-btn-secondary/g, `${buttonClass}`);
                
                // 개별 popup-btn도 교체 (혹시 놓친 것들)
                content = content.replace(/popup-btn/g, buttonClass);
            }
            
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
            const $container = $popup.find('.popup-container');
            const $header = $popup.find('.popup-header');
            
            // 드래그 이동 기능
            this.makeDraggable($container, $header, popup);
            
            // 저장 버튼 (다양한 클래스 지원)
            $popup.find('.popup-save, [class*="popup-save"]').on('click', () => {
                const data = popup.getData();
                if (options.onSave) {
                    options.onSave(data, popup);
                }
            });
            
            // 삭제 버튼 (cache만, 다양한 클래스 지원)
            $popup.find('.popup-delete, [class*="popup-delete"]').on('click', () => {
                if (confirm('정말 삭제하시겠습니까?')) {
                    if (options.onDelete) {
                        options.onDelete(popup);
                    }
                }
            });
            
            // 닫기 버튼들 (다양한 클래스 지원)
            $popup.find('.popup-close, .popup-close-btn, [class*="popup-close"]').on('click', () => {
                if (options.onClose) {
                    options.onClose(popup);
                }
                popup.close();
            });
            
            // 오버레이 클릭 시 닫기 (드래그/리사이즈 후에는 닫지 않음)
            let wasResized = false;
            let wasDragged = false;
            let lastResizeTime = 0;
            
            // 리사이즈 감지 - 더 확실한 방법
            let initialWidth = $container.width();
            let initialHeight = $container.height();
            
            // MutationObserver로 스타일 변경 감지
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        const currentWidth = $container.width();
                        const currentHeight = $container.height();
                        
                        if (currentWidth !== initialWidth || currentHeight !== initialHeight) {
                            wasResized = true;
                            lastResizeTime = Date.now();
                            setTimeout(() => { 
                                if (Date.now() - lastResizeTime >= 200) {
                                    wasResized = false; 
                                }
                            }, 200);
                            
                            initialWidth = currentWidth;
                            initialHeight = currentHeight;
                        }
                    }
                });
            });
            
            observer.observe($container[0], {
                attributes: true,
                attributeFilter: ['style']
            });
            
            // 마우스 이벤트로도 리사이즈 감지
            $container.on('mousedown', (e) => {
                // 리사이즈 핸들 영역 감지 (우하단 모서리)
                const rect = $container[0].getBoundingClientRect();
                const isResizeHandle = (
                    e.clientX > rect.right - 20 && 
                    e.clientY > rect.bottom - 20
                );
                
                if (isResizeHandle) {
                    wasResized = true;
                    lastResizeTime = Date.now();
                    
                    const checkResize = () => {
                        if (Date.now() - lastResizeTime >= 300) {
                            wasResized = false;
                        } else {
                            setTimeout(checkResize, 100);
                        }
                    };
                    setTimeout(checkResize, 100);
                }
            });
            
            $popup.on('click', (e) => {
                if (e.target === $popup[0] && !wasResized && !wasDragged) {
                    if (options.onClose) {
                        options.onClose(popup);
                    }
                    popup.close();
                }
            });
            
            // 드래그 상태를 팝업 인스턴스에 저장
            popup.setDragState = (dragged) => {
                wasDragged = dragged;
                setTimeout(() => { wasDragged = false; }, 200);
            };
            
            // 팝업 닫힐 때 observer 정리
            popup.cleanupObserver = () => {
                if (observer) {
                    observer.disconnect();
                }
            };
            
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
         * 드래그 가능하게 만들기
         */
        makeDraggable($container, $handle, popup) {
            let isDragging = false;
            let dragStarted = false;
            let startX, startY, currentLeft, currentTop;
            const dragThreshold = 5; // 드래그 시작 임계값 (픽셀)
            
            $handle.on('mousedown', (e) => {
                // 닫기 버튼 클릭은 제외
                if ($(e.target).hasClass('popup-close-btn')) {
                    return;
                }
                
                isDragging = true;
                dragStarted = false;
                startX = e.clientX;
                startY = e.clientY;
                
                // 현재 실제 위치 가져오기
                const containerStyle = $container[0].style;
                currentLeft = parseInt(containerStyle.left) || 0;
                currentTop = parseInt(containerStyle.top) || 0;
                
                e.preventDefault();
                e.stopPropagation(); // 이벤트 버블링 방지
            });
            
            $(document).on(`mousemove.popup-${popup.id}`, (e) => {
                if (!isDragging) return;
                
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                // 임계값을 넘어야 실제 드래그 시작
                if (!dragStarted && distance < dragThreshold) {
                    return;
                }
                
                if (!dragStarted) {
                    dragStarted = true;
                    // 드래그 시작 시에만 위치 설정 변경
                    $container.css({
                        'position': 'relative',
                        'left': currentLeft + 'px',
                        'top': currentTop + 'px',
                        'margin': '0'
                    });
                    $handle.css('cursor', 'grabbing');
                }
                
                const newLeft = currentLeft + deltaX;
                const newTop = currentTop + deltaY;
                
                // 화면 경계 체크
                const overlay = $container.parent();
                const maxLeft = overlay.width() - $container.outerWidth();
                const maxTop = overlay.height() - $container.outerHeight();
                
                const constrainedLeft = Math.max(-$container.outerWidth() * 0.7, Math.min(maxLeft + $container.outerWidth() * 0.7, newLeft));
                const constrainedTop = Math.max(-50, Math.min(maxTop + 50, newTop));
                
                $container.css({
                    left: constrainedLeft + 'px',
                    top: constrainedTop + 'px'
                });
                
                e.preventDefault();
                e.stopPropagation();
            });
            
            $(document).on(`mouseup.popup-${popup.id}`, (e) => {
                if (isDragging) {
                    isDragging = false;
                    
                    if (dragStarted) {
                        dragStarted = false;
                        $handle.css('cursor', 'move');
                        
                        // 드래그 완료 상태 알림
                        if (popup.setDragState) {
                            popup.setDragState(true);
                        }
                        
                        // 드래그가 완료된 후 현재 위치 업데이트
                        const containerStyle = $container[0].style;
                        currentLeft = parseInt(containerStyle.left) || 0;
                        currentTop = parseInt(containerStyle.top) || 0;
                    }
                    
                    e.stopPropagation(); // 배경 클릭 이벤트 방지
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
                // 모든 이벤트 리스너 정리
                $(document).off(`keydown.popup-${popupId}`);
                $(document).off(`mousemove.popup-${popupId} mouseup.popup-${popupId}`);
                
                // Observer 정리
                if (popup.cleanupObserver) {
                    popup.cleanupObserver();
                }
                
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
