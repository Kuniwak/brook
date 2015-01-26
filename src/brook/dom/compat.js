/**
@fileOverview brook/compat.js
@author daichi.hiroki<hirokidaichi@gmail.com>
*/

/*global Namespace window HTMLElement document*/

/**
@name brook.dom.compat
@namespace details here
*/
Namespace('brook.dom.compat')
.define(function(ns){
    /**
     * Returns HTMLElement.dataset by the specified HTMLElement.
     *
     * NOTE: You should NOT use the function directly, because it makes fallback
     * unavailble for Android browsers. the function made some incidents caused
     * by the Android browser's baffling behavior.
     *
     * @name brook.dom.compat.dataset
     * @function
     * @deprecated
     */
    var dataset = (function(){
        var camelize = function(string){
            return string.replace(/-+(.)?/g, function(match, chr) {
              return chr ? chr.toUpperCase() : '';
            });
        };
        var datasetNative = function(element){
            return element.dataset;
        };
        var datasetCompat = function(element){
            var sets = {};
            for(var i=0,a=element.attributes,l=a.length;i<l;i++){
                var attr = a[i];
                if( !attr.name.match(/^data-/) ) continue;
                sets[camelize(attr.name.replace(/^data-/,''))] = attr.value;
            }
            return sets;
        };

        // Graceful fallback for browsers do not support dataset yet.
        var isNativeDatasetAvailable = 'DOMStringMap' in window;
        return isNativeDatasetAvailable ? datasetNative : datasetCompat;
    })();


    /**
     * Returns a data attribute value by the specified element and the attribute
     * name. This method keeps cross-browser compatibility for legacy browsers
     * and Android browsers and others.
     *
     * @name brook.dom.compat.getDatasetValue
     * @function
     * @param {Element} elem The element to get dataset.
     * @param {string} attrName The attribute name.
     * @return {string} Data attribute value.
     */
    var getDatasetValue = function getDatasetValue(elem, attrName) {
      return getDatasetValues(elem, [attrName])[attrName];
    };


    /**
     * Returns a partial dataset object by the specified element and attribute
     * names (like a hash slice in perl). This method keeps cross-browser
     * compatibility for legacy browsers and Android browsers and others.
     *
     * @name brook.dom.compat.getDatasetValues
     * @function
     * @param {Element} elem The element to get dataset.
     * @param {Array.<string>} attrNames The attribute names to get partial
     *   dataset.
     * @return {Object.<string, string>} Data attribute values object.
     */
    var getDatasetValues = function getDatasetValues(elem, attrNames) {
      var result = {};

      var datasetObj = dataset(elem);
      for (var attrIdx = 0, attrLen = attrNames.length; attrIdx < attrLen; attrIdx++) {
        // In Android default broswer, we should check the key bacause Android
        // Android browser has the baffling behavior such as the following:
        //
        //   >> dataset[somethingUnexistentAttr] === ''
        //   true
        var attrName = attrNames[attrIdx];

        var isAttrDefined = attrName in datasetObj;
        if (!isAttrDefined) continue;

        var attrVal = datasetObj[attrName];

        result[attrName] = attrVal;
      }

      return result;
    };

    var ClassList = function(element){
        this._element = element;
        this._refresh();
    };
    var classList = function(element){
        return new ClassList(element);
    };

    (function(proto){
        var check = function(token) {
            if (token === "") {
                throw "SYNTAX_ERR";
            }
            if (token.indexOf(/\s/) != -1) {
                throw "INVALID_CHARACTER_ERR";
            }
        };
        this._fake = true;
        this._refresh = function () {
            var classes = (this._element.className || '').split(/\s+/);
            if (classes.length && classes[0] === "") {
                classes.shift();
            }
            if (classes.length && classes[classes.length - 1] === "") {
                classes.pop();
            }
            this._classList = classes;
            this.length = classes.length;
            return this;
        };
        this.item = function (i) {
            return this._classList[i] || null;
        };
        this.contains = function (token) {
            check(token);
            for (var i = 0; i < this.length; ++i) {
                if (this._classList[i] == token) {
                    return true;
                }
            }
            return false;
        };
        this.add = function (token) {
            check(token);
            for (var i = 0; i < this.length; ++i) {
                if (this._classList[i] == token) {
                    return;
                }
            }
            this._classList.push(token);
            this.length = this._classList.length;
            this._element.className = this._classList.join(" ");
        };
        this.remove = function (token) {
            check(token);
            for (var i = 0; i < this._classList.length; ++i) {
                if (this._classList[i] == token) {
                    this._classList.splice(i, 1);
                    this._element.className =  this._classList.join(" ");
                }
            }
            this.length = this._classList.length;
        };
        this.toggle = function (token) {
            check(token);
            for (var i = 0; i < this.length; ++i) {
                if (this._classList[i] == token) {
                    this.remove(token);
                    return false;
                }
            }
            this.add(token);
            return true;
        };
    }).apply(ClassList.prototype);

    var hasClassName = function(element,className){
        var classSyntax = element.className;
        if ( !(classSyntax && className) ) return false;
        return (new RegExp("(^|\\s)" + className + "(\\s|$)").test(classSyntax));
    };
    var getElementsByClassName = function(className){
        if( document.getElementsByClassName ) return document.getElementsByClassName( className );
        var allElements = document.getElementsByTagName('*');
        var ret = [];
        for(var i=0,l=allElements.length;i<l;i++){
            if( !hasClassName( allElements[i] , className ) )
                continue;
            ret.push( allElements[i] );
        }
        return ret;
    };

    ns.provide({
        getElementsByClassName : getElementsByClassName,
        hasClassName : hasClassName,
        dataset : dataset,
        classList : classList,
        getDatasetValue : getDatasetValue,
        getDatasetValues : getDatasetValues
    });
});
