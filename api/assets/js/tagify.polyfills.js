!function(t){"function"==typeof define&&define.amd?define(t):t()}((function(){"use strict";function t(t,e){e=e||{bubbles:!1,cancelable:!1,detail:void 0};var n=document.createEvent("CustomEvent");return n.initCustomEvent(t,e.bubbles,e.cancelable,e.detail),n}var e;"".trim||(String.prototype.trim=function(){return this.replace(/^[\s﻿]+|[\s﻿]+$/g,"")}),window.NodeList&&!NodeList.prototype.forEach&&(NodeList.prototype.forEach=Array.prototype.forEach),Array.prototype.findIndex||Object.defineProperty(Array.prototype,"findIndex",{value:function(t){if(null==this)throw new TypeError('"this" is null or not defined');var e=Object(this),n=e.length>>>0;if("function"!=typeof t)throw new TypeError("predicate must be a function");for(var o=arguments[1],r=0;r<n;){var i=e[r];if(t.call(o,i,r,e))return r;r++}return-1},configurable:!0,writable:!0}),Array.prototype.includes||(Array.prototype.includes=function(t){return!!~this.indexOf(t)}),Array.prototype.some||(Array.prototype.some=function(t,e){if(null==this)throw new TypeError("Array.prototype.some called on null or undefined");if("function"!=typeof t)throw new TypeError;for(var n=Object(this),o=n.length>>>0,r=0;r<o;r++)if(r in n&&t.call(e,n[r],r,n))return!0;return!1}),String.prototype.includes||(String.prototype.includes=function(t,e){return"number"!=typeof e&&(e=0),!(e+t.length>this.length)&&-1!==this.indexOf(t,e)}),"function"!=typeof Object.assign&&Object.defineProperty(Object,"assign",{value:function(t,e){if(null==t)throw new TypeError("Cannot convert undefined or null to object");for(var n=Object(t),o=1;o<arguments.length;o++){var r=arguments[o];if(null!=r)for(var i in r)Object.prototype.hasOwnProperty.call(r,i)&&(n[i]=r[i])}return n},writable:!0,configurable:!0}),t.prototype=window.Event.prototype,"function"!=typeof window.CustomEvent&&(window.CustomEvent=t),Element.prototype.matches||(Element.prototype.matches=Element.prototype.msMatchesSelector||Element.prototype.webkitMatchesSelector),Element.prototype.closest||(Element.prototype.closest=function(t){var e=this;if(!document.documentElement.contains(e))return null;do{if(e.matches(t))return e;e=e.parentElement||e.parentNode}while(null!==e&&1===e.nodeType);return null}),document.execCommand("AutoUrlDetect",!1,!1),
/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js */
"document"in self&&((!("classList"in document.createElement("_"))||document.createElementNS&&!("classList"in document.createElementNS("http://www.w3.org/2000/svg","g")))&&function(t){if("Element"in t){var e="classList",n=t.Element.prototype,o=Object,r=String.prototype.trim||function(){return this.replace(/^\s+|\s+$/g,"")},i=Array.prototype.indexOf||function(t){for(var e=0,n=this.length;e<n;e++)if(e in this&&this[e]===t)return e;return-1},c=function(t,e){this.name=t,this.code=DOMException[t],this.message=e},s=function(t,e){if(""===e)throw new c("SYNTAX_ERR","The token must not be empty.");if(/\s/.test(e))throw new c("INVALID_CHARACTER_ERR","The token must not contain space characters.");return i.call(t,e)},u=function(t){for(var e=r.call(t.getAttribute("class")||""),n=e?e.split(/\s+/):[],o=0,i=n.length;o<i;o++)this.push(n[o]);this._updateClassName=function(){t.setAttribute("class",this.toString())}},l=u.prototype=[],a=function(){return new u(this)};if(c.prototype=Error.prototype,l.item=function(t){return this[t]||null},l.contains=function(t){return~s(this,t+"")},l.add=function(){var t,e=arguments,n=0,o=e.length,r=!1;do{t=e[n]+"",~s(this,t)||(this.push(t),r=!0)}while(++n<o);r&&this._updateClassName()},l.remove=function(){var t,e,n=arguments,o=0,r=n.length,i=!1;do{for(t=n[o]+"",e=s(this,t);~e;)this.splice(e,1),i=!0,e=s(this,t)}while(++o<r);i&&this._updateClassName()},l.toggle=function(t,e){var n=this.contains(t),o=n?!0!==e&&"remove":!1!==e&&"add";return o&&this[o](t),!0===e||!1===e?e:!n},l.replace=function(t,e){var n=s(t+"");~n&&(this.splice(n,1,e),this._updateClassName())},l.toString=function(){return this.join(" ")},o.defineProperty){var f={get:a,enumerable:!0,configurable:!0};try{o.defineProperty(n,e,f)}catch(t){void 0!==t.number&&-2146823252!==t.number||(f.enumerable=!1,o.defineProperty(n,e,f))}}else o.prototype.__defineGetter__&&n.__defineGetter__(e,a)}}(self),function(){var t=document.createElement("_");if(t.classList.add("c1","c2"),!t.classList.contains("c2")){var e=function(t){var e=DOMTokenList.prototype[t];DOMTokenList.prototype[t]=function(t){var n,o=arguments.length;for(n=0;n<o;n++)t=arguments[n],e.call(this,t)}};e("add"),e("remove")}if(t.classList.toggle("c3",!1),t.classList.contains("c3")){var n=DOMTokenList.prototype.toggle;DOMTokenList.prototype.toggle=function(t,e){return 1 in arguments&&!this.contains(t)==!e?e:n.call(this,t)}}"replace"in document.createElement("_").classList||(DOMTokenList.prototype.replace=function(t,e){var n=this.toString().split(" "),o=n.indexOf(t+"");~o&&(n=n.slice(o),this.remove.apply(this,n),this.add(e),this.add.apply(this,n.slice(1)))}),t=null}()),e=function(){function t(t){var e=this.constructor;return this.then((function(n){return e.resolve(t()).then((function(){return n}))}),(function(n){return e.resolve(t()).then((function(){return e.reject(n)}))}))}function e(t){return new this((function(e,n){if(!t||void 0===t.length)return n(new TypeError(typeof t+" "+t+" is not iterable(cannot read property Symbol(Symbol.iterator))"));var o=Array.prototype.slice.call(t);if(0===o.length)return e([]);var r=o.length;function i(t,n){if(n&&("object"==typeof n||"function"==typeof n)){var c=n.then;if("function"==typeof c)return void c.call(n,(function(e){i(t,e)}),(function(n){o[t]={status:"rejected",reason:n},0==--r&&e(o)}))}o[t]={status:"fulfilled",value:n},0==--r&&e(o)}for(var c=0;c<o.length;c++)i(c,o[c])}))}var n=setTimeout;function o(t){return Boolean(t&&void 0!==t.length)}function r(){}function i(t){if(!(this instanceof i))throw new TypeError("Promises must be constructed via new");if("function"!=typeof t)throw new TypeError("not a function");this._state=0,this._handled=!1,this._value=void 0,this._deferreds=[],f(t,this)}function c(t,e){for(;3===t._state;)t=t._value;0!==t._state?(t._handled=!0,i._immediateFn((function(){var n=1===t._state?e.onFulfilled:e.onRejected;if(null!==n){var o;try{o=n(t._value)}catch(t){return void u(e.promise,t)}s(e.promise,o)}else(1===t._state?s:u)(e.promise,t._value)}))):t._deferreds.push(e)}function s(t,e){try{if(e===t)throw new TypeError("A promise cannot be resolved with itself.");if(e&&("object"==typeof e||"function"==typeof e)){var n=e.then;if(e instanceof i)return t._state=3,t._value=e,void l(t);if("function"==typeof n)return void f((o=n,r=e,function(){o.apply(r,arguments)}),t)}t._state=1,t._value=e,l(t)}catch(e){u(t,e)}var o,r}function u(t,e){t._state=2,t._value=e,l(t)}function l(t){2===t._state&&0===t._deferreds.length&&i._immediateFn((function(){t._handled||i._unhandledRejectionFn(t._value)}));for(var e=0,n=t._deferreds.length;e<n;e++)c(t,t._deferreds[e]);t._deferreds=null}function a(t,e,n){this.onFulfilled="function"==typeof t?t:null,this.onRejected="function"==typeof e?e:null,this.promise=n}function f(t,e){var n=!1;try{t((function(t){n||(n=!0,s(e,t))}),(function(t){n||(n=!0,u(e,t))}))}catch(t){if(n)return;n=!0,u(e,t)}}i.prototype.catch=function(t){return this.then(null,t)},i.prototype.then=function(t,e){var n=new this.constructor(r);return c(this,new a(t,e,n)),n},i.prototype.finally=t,i.all=function(t){return new i((function(e,n){if(!o(t))return n(new TypeError("Promise.all accepts an array"));var r=Array.prototype.slice.call(t);if(0===r.length)return e([]);var i=r.length;function c(t,o){try{if(o&&("object"==typeof o||"function"==typeof o)){var s=o.then;if("function"==typeof s)return void s.call(o,(function(e){c(t,e)}),n)}r[t]=o,0==--i&&e(r)}catch(t){n(t)}}for(var s=0;s<r.length;s++)c(s,r[s])}))},i.allSettled=e,i.resolve=function(t){return t&&"object"==typeof t&&t.constructor===i?t:new i((function(e){e(t)}))},i.reject=function(t){return new i((function(e,n){n(t)}))},i.race=function(t){return new i((function(e,n){if(!o(t))return n(new TypeError("Promise.race accepts an array"));for(var r=0,c=t.length;r<c;r++)i.resolve(t[r]).then(e,n)}))},i._immediateFn="function"==typeof setImmediate&&function(t){setImmediate(t)}||function(t){n(t,0)},i._unhandledRejectionFn=function(t){"undefined"!=typeof console&&console&&console.warn("Possible Unhandled Promise Rejection:",t)};var p=function(){if("undefined"!=typeof self)return self;if("undefined"!=typeof window)return window;if("undefined"!=typeof global)return global;throw new Error("unable to locate global object")}();"function"!=typeof p.Promise?p.Promise=i:p.Promise.prototype.finally?p.Promise.allSettled||(p.Promise.allSettled=e):p.Promise.prototype.finally=t},"object"==typeof exports&&"undefined"!=typeof module?e():"function"==typeof define&&define.amd?define(e):e()}));
