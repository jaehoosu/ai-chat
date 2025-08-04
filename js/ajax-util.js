/**
 * Simple HTTP Request Utility
 * 기본적인 HTTP 메서드를 지원하는 간단한 유틸리티
 * async/await, Promise/then 지원
 * 내장 로딩 화면 지원
 * 
 * @version 1.0.0
 * @author UI-Generator Team
 * @date 2025-08-01
 */

(function($) {
    'use strict';

    // HTTP 유틸리티 객체
    const HttpUtil = {
        
        // 버전 정보
        version: '1.0.0',
        
        /**
         * 버전 정보 반환
         * @returns {string} 버전 문자열
         */
        getVersion: function() {
            return this.version;
        },
        
        // 로딩 상태 관리
        _loadingCount: 0,
        _loadingElement: null,
        
        /**
         * 내장 로딩 화면 생성
         */
        _createLoadingElement: function() {
            if (this._loadingElement) return;
            
            const loadingHtml = `
                <div id="http-loading-overlay" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                    font-family: Arial, sans-serif;
                ">
                    <div style="
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        text-align: center;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    ">
                        <div style="
                            width: 40px;
                            height: 40px;
                            border: 4px solid #f3f3f3;
                            border-top: 4px solid #3498db;
                            border-radius: 50%;
                            animation: spin 1s linear infinite;
                            margin: 0 auto 10px;
                        "></div>
                        <div style="color: #333; font-size: 14px;">처리중...</div>
                    </div>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            
            this._loadingElement = $(loadingHtml);
            $('body').append(this._loadingElement);
            this._loadingElement.hide();
        },
        
        /**
         * 기본 로딩 시작 함수
         */
        _defaultLoading: function() {
            this._createLoadingElement();
            this._loadingCount++;
            if (this._loadingCount === 1) {
                this._loadingElement.fadeIn(200);
            }
        },
        
        /**
         * 기본 로딩 종료 함수
         */
        _defaultUnloading: function() {
            this._loadingCount = Math.max(0, this._loadingCount - 1);
            if (this._loadingCount === 0 && this._loadingElement) {
                this._loadingElement.fadeOut(200);
            }
        },
        
        /**
         * 기본 요청 메서드
         * @param {string} url - 요청 URL
         * @param {object} options - 요청 옵션
         * @returns {Promise} Promise 객체
         */
        request: function(url, options = {}) {
            const defaults = {
                type: 'GET',
                contentType: 'application/json;charset=UTF-8',
                dataType: 'json',
                timeout: 30000,
                showLoading: true  // 기본적으로 로딩 화면 표시
            };
            
            const settings = $.extend({}, defaults, options);
            
            // 데이터가 객체면 JSON 문자열로 변환
            if (settings.data && typeof settings.data === 'object' && settings.type !== 'GET') {
                settings.data = JSON.stringify(settings.data);
            }
            
            // 사용자 정의 또는 기본 로딩 함수 설정
            const loadingFn = settings.loading || (settings.showLoading ? this._defaultLoading.bind(this) : null);
            const unloadingFn = settings.unloading || (settings.showLoading ? this._defaultUnloading.bind(this) : null);
            
            // 기존 beforeSend와 complete 콜백 보존
            const originalBeforeSend = settings.beforeSend;
            const originalComplete = settings.complete;
            
            // beforeSend에 로딩 추가
            settings.beforeSend = function(xhr) {
                if (loadingFn) loadingFn();
                if (originalBeforeSend) originalBeforeSend.call(this, xhr);
            };
            
            // complete에 언로딩 추가
            settings.complete = function(xhr, status) {
                if (unloadingFn) unloadingFn();
                if (originalComplete) originalComplete.call(this, xhr, status);
            };
            
            return $.ajax($.extend(settings, { url: url }));
        },

        /**
         * GET 요청
         * @param {string} url - 요청 URL
         * @param {object} options - 요청 옵션
         * @returns {Promise} Promise 객체
         */
        get: function(url, options = {}) {
            return this.request(url, $.extend(options, { type: 'GET' }));
        },

        /**
         * POST 요청
         * @param {string} url - 요청 URL
         * @param {object} data - 전송할 데이터
         * @param {object} options - 요청 옵션
         * @returns {Promise} Promise 객체
         */
        post: function(url, data = {}, options = {}) {
            return this.request(url, $.extend(options, { type: 'POST', data: data }));
        },

        /**
         * PUT 요청
         * @param {string} url - 요청 URL
         * @param {object} data - 전송할 데이터
         * @param {object} options - 요청 옵션
         * @returns {Promise} Promise 객체
         */
        put: function(url, data = {}, options = {}) {
            return this.request(url, $.extend(options, { type: 'PUT', data: data }));
        },

        /**
         * PATCH 요청
         * @param {string} url - 요청 URL
         * @param {object} data - 전송할 데이터
         * @param {object} options - 요청 옵션
         * @returns {Promise} Promise 객체
         */
        patch: function(url, data = {}, options = {}) {
            return this.request(url, $.extend(options, { type: 'PATCH', data: data }));
        },

        /**
         * DELETE 요청
         * @param {string} url - 요청 URL
         * @param {object} options - 요청 옵션
         * @returns {Promise} Promise 객체
         */
        delete: function(url, options = {}) {
            return this.request(url, $.extend(options, { type: 'DELETE' }));
        }
    };

    // jQuery에 플러그인 등록
    $.http = HttpUtil;

})(jQuery);
