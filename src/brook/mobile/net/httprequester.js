Namespace('brook.net.httprequester').define(function(ns){
    var merge = function(aObj,bObj){
        for( var p in bObj ){
            if( bObj.hasOwnProperty( p ) ){
                aObj[p] = bObj[p];
            }
        }
        return aObj;
    };

    /**
     * onreadystatechange State Constants
     */
    if (XMLHttpRequest.UNSENT === undefined) XMLHttpRequest.UNSENT = 0;
    if (XMLHttpRequest.OPENED === undefined) XMLHttpRequest.OPENED = 1;
    if (XMLHttpRequest.HEADERS_RECEIVED === undefined) XMLHttpRequest.HEADERS_RECEIVED = 2;
    if (XMLHttpRequest.LOADING === undefined) XMLHttpRequest.LOADING = 3;
    if (XMLHttpRequest.DONE === undefined) XMLHttpRequest.DONE = 4;


    /**
     * Class HTTPRequester
     */
    function HTTPRequester() {
        this.__xhr = null;
        this.__lastRequestUrl = null;
        this.__options = {};
        this.__response = null;
    }

    HTTPRequester.POST = 'POST';
    HTTPRequester.GET  = 'GET';
    HTTPRequester.requesters = {};

    HTTPRequester.AJAX_DEFAULT_REQUEST_HEADERS = {"X-Requested-With": "XmlHttpRequest"};

    /**
     * Static getRequester
     * @param {String} key
     */
    HTTPRequester.getRequester = function(key){
        var requester;
        if (HTTPRequester.requesters[key] === undefined) {
            requester = new HTTPRequester();
            HTTPRequester.requesters[key] = requester;
        }
        else {
            throw new Error('this key exist.');
        }
        return requester;
    };

    /**
     * Static abortAll
     * abort all running request
     */
    HTTPRequester.abortAll = function() {
        Object.keys(HTTPRequester.requesters).forEach(function(key){
            HTTPRequester.requesters[key].abort();
        },this);
    };

    /**
     * Public abort
     */
    HTTPRequester.prototype.abort = function() {
        this.__xhr.onreadystatechange = null;
        this.__xhr.abort();
    };

    /**
     * Public request
     */
    HTTPRequester.prototype.request = function(options, callback) {
        var deferred;
        if ( Deferred ) {
            deferred = new Deferred();
        }

        /**
         * �ޥ���֥饦���б������硢
         * ���������try/catch��������Ƥ���������
         *
         * ���衢 __xhr ��Ʊ̾ HTTPRequester �Ǻ����Ѳ�ǽ�ʤϤ��Ǥ�����
         * readystatechange ���٥�Ȥ� remove �Ǥ��ʤ��Ȥ����Х��ʤΤ����ͤ����ꡢ
         * request ���٤˽�������Ƥ��ޤ���
         *
         * onreadystatechagne = function(){...} �ǤϤʤ��� __xhr.(add|remove)EventListener('readystatechange') ���ޤ�������
         * Firefox/Chrome �Ȥ������� remove �Ǥ�������ޤ�����
         */
        this.__xhr = new XMLHttpRequest();

        this.__setOptions(options);
        this.__setHandler(callback, deferred);
        this.__open();
        this.__setHeaders();
        this.__send();

        return deferred ? deferred : this;
    };

    /**
     * Public getResponse
     * @param {HTTPResponse}
     */
    HTTPRequester.prototype.getResponse = function() {
        return this.__response;
    };

    /**
     * Private __setOptions
     */
    HTTPRequester.prototype.__setOptions = function(options) {
        if (!options) {
            throw new Error('illegal options.')
        }

        // method(default == "POST")
        this.__options.method = options.method ? options.method : HTTPRequester.POST;

        // url(default null, throw error)
        if (!options.url) {
            throw new Error('HTTPRequester.request() needs "url" option.');
        }
        this.__options.url = options.url;

        // asynchronous(default == true)
        this.__options.asynchronous = ( typeof options.asynchronous == 'boolean' ) ? options.asynchronous : true;

        // requestContentType(default == 'application/x-www-form-urlencoded; charset=UTF-8')
        this.__options.requestContentType = options.requestContentType ? options.requestContentType : 'application/x-www-form-urlencoded; charset=UTF-8';

        // noCache(default == true)
        this.__options.noCache = ( typeof options.noCache == 'boolean' ) ? options.noCache : true;

        // expectedResponseContentType(default == null)
        this.__options.expectedResponseContentType = options.expectedResponseContentType ? options.expectedResponseContentType : null;

        // paramGET(default == null)
        this.__options.paramGET = options.paramGET ? options.paramGET : null;

        // paramPOST(default == null)
        this.__options.paramPOST = options.paramPOST ? options.paramPOST : null;

        // otherRequestHeaders(default == null)
        var otherRequestHeaders = HTTPRequester.AJAX_DEFAULT_REQUEST_HEADERS;
        this.__options.otherRequestHeaders = options.otherRequestHeaders ? merge(otherRequestHeaders, options.otherRequestHeaders) : otherRequestHeaders;
    };

    /**
     * Private __setHandler
     * @param {Function} callback
     */
    HTTPRequester.prototype.__setHandler = function(callback, deferred) {
        this.__xhr.onabort = function(evt) {
            // �ä˼���̵����
            // ɬ�פˤʤä���������Ƥ���������
        };
        this.__xhr.onreadystatechange = function(evt) {
            if ( this.__xhr.readyState == XMLHttpRequest.DONE ) {
                this.__response = new HTTPResponse(this.__xhr);
                this.__xhr.onreadystatechange = null;

                callback(this.__response, deferred);
            }
        }.bind(this);
    };

    /**
     * Private __open
     */
    HTTPRequester.prototype.__open = function() {
        var query = this.__options.paramGET ? this.__options.paramGET.toQueryString() : '';
        var requestUrl
            = this.__options.url
            + ((this.__options.url.indexOf('?') == -1) ? '?' : '&')
            + (this.__options.paramGET ? this.__options.paramGET.toQueryString() : '')
            + (this.__options.noCache ? '&'+Date.now() : '');
        this.__lastRequestUrl = requestUrl;
        this.__xhr.open(this.__options.method, requestUrl, this.__options.asynchronous);
    };

    /**
     * Private __setHeaders
     */
    HTTPRequester.prototype.__setHeaders = function() {
        // nocache
        if (this.__options.noCache) {
            this.__xhr.setRequestHeader("Cache-Control", "no-cache");
        }

        // requestContentType
        if (this.__options.method == HTTPRequester.POST) {
            this.__xhr.setRequestHeader('Content-Type', this.__options.requestContentType);
        }

        // other headers if any
        if (this.__options.otherRequestHeaders) {
            Object.keys(this.__options.otherRequestHeaders).forEach(function(key){
                this.__xhr.setRequestHeader(key, this.__options.otherRequestHeaders[key]);
            }, this);
        }

        // overrideMimeType
        if (this.__options.expectedResponseContentType) {
            this.__xhr.overrideMimeType(this.__options.expectedResponseContentType);
        }
    };

    /**
     * Private __send
     */
    HTTPRequester.prototype.__send = function() {
        var postBody = null;
        if ( this.__options.paramPOST != null && this.__options.method == HTTPRequester.POST ) {
            postBody = (typeof(this.__options.paramPOST) == "string" || this.__options.paramPOST instanceof String) ? this.__options.paramPOST : this.__options.paramPOST.toQueryString();
        }
        this.__xhr.send(postBody);
    };


    /**
     * HTTPResponse
     * @param {XMLHttpRequest} xhr
     */
    function HTTPResponse(xhr) {
        // status
        // �쥹�ݥ󥹤�304�ξ�硢Firefox 200
        // Chrome 304
        // prototype.js �ϥ����Ф��� 304 ���֤äƤ����Chrome�ˤ� onSuccess ���ʤ����͡�
        // ���ޤ� XHR.status �����ʤ������ɤ������Ǥ���
        this.__status20x = ( xhr.status >= 200 && xhr.status < 300 );
        this.statusCode = xhr.status;

        // rawResponseText
        this.__rawString = xhr.responseText;

        // jsonize
        this.__object = null;
        if ( /javascript/.test(xhr.getResponseHeader('Content-Type'))  || /json/.test(xhr.getResponseHeader('Content-Type')) ) {
            try {
                this.__object = JSON.parse(this.__rawString.replace(/^\/\*-secure-([\s\S]*)\*\/\s*$/, '$1'));
            }
            catch(err) {}
        }
    }

    /**
     * Public is20x
     * is 20x status code?
     * @return {Boolean}
     */
    HTTPResponse.prototype.is20x = function() {
        return (this.__status20x);
    };

    /**
     * Public getObject
     * get response parsed JSON Object
     * @return {Object}
     */
    HTTPResponse.prototype.getObject = function() {
        return this.__object;
    };

    /**
     * Public getRawString
     * get raw responseText
     * @return {String}
     */
    HTTPResponse.prototype.getRawString = function() {
        return this.__rawString;
    };

    ns.provide({
        HTTPRequester : HTTPRequester,
        HTTPResponse  : HTTPResponse
    });
});
