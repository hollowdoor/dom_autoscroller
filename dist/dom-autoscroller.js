var autoScroll = (function () {
  'use strict';

  function getDef(f, d) {
      if (typeof f === 'undefined') {
          return typeof d === 'undefined' ? f : d;
      }

      return f;
  }
  function boolean(func, def) {

      func = getDef(func, def);

      if (typeof func === 'function') {
          return function f() {
              for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                  args[_key] = arguments[_key];
              }

              return !!func.apply(this, args);
          };
      }

      return !!func ? function () {
          return true;
      } : function () {
          return false;
      };
  }

  var prefix = ['webkit', 'moz', 'ms', 'o'];

  var requestAnimationFrame = function () {

    for (var i = 0, limit = prefix.length; i < limit && !window.requestAnimationFrame; ++i) {
      window.requestAnimationFrame = window[prefix[i] + 'RequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
      (function () {
        var lastTime = 0;

        window.requestAnimationFrame = function (callback) {
          var now = new Date().getTime();
          var ttc = Math.max(0, 16 - now - lastTime);
          var timer = window.setTimeout(function () {
            return callback(now + ttc);
          }, ttc);

          lastTime = now + ttc;

          return timer;
        };
      })();
    }

    return window.requestAnimationFrame.bind(window);
  }();

  var cancelAnimationFrame = function () {

    for (var i = 0, limit = prefix.length; i < limit && !window.cancelAnimationFrame; ++i) {
      window.cancelAnimationFrame = window[prefix[i] + 'CancelAnimationFrame'] || window[prefix[i] + 'CancelRequestAnimationFrame'];
    }

    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = function (timer) {
        window.clearTimeout(timer);
      };
    }

    return window.cancelAnimationFrame.bind(window);
  }();

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
  };

  /**
   * Returns `true` if provided input is Element.
   * @name isElement
   * @param {*} [input]
   * @returns {boolean}
   */
  function isElement (input) {
    return input != null && (typeof input === 'undefined' ? 'undefined' : _typeof(input)) === 'object' && input.nodeType === 1 && _typeof(input.style) === 'object' && _typeof(input.ownerDocument) === 'object';
  }

  function indexOfElement(elements, element) {
      element = resolveElement(element, true);
      if (!isElement(element)) return -1;
      for (var i = 0; i < elements.length; i++) {
          if (elements[i] === element) {
              return i;
          }
      }
      return -1;
  }

  function hasElement(elements, element) {
      return -1 !== indexOfElement(elements, element);
  }

  function pushElements(elements, toAdd) {

      for (var i = 0; i < toAdd.length; i++) {
          if (!hasElement(elements, toAdd[i])) elements.push(toAdd[i]);
      }

      return toAdd;
  }

  function addElements(elements) {
      for (var _len2 = arguments.length, toAdd = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
          toAdd[_key2 - 1] = arguments[_key2];
      }

      toAdd = toAdd.map(resolveElement);
      return pushElements(elements, toAdd);
  }

  function removeElements(elements) {
      for (var _len3 = arguments.length, toRemove = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
          toRemove[_key3 - 1] = arguments[_key3];
      }

      return toRemove.map(resolveElement).reduce(function (last, e) {

          var index = indexOfElement(elements, e);

          if (index !== -1) return last.concat(elements.splice(index, 1));
          return last;
      }, []);
  }

  function resolveElement(element, noThrow) {
      if (typeof element === 'string') {
          try {
              return document.querySelector(element);
          } catch (e) {
              throw e;
          }
      }

      if (!isElement(element) && !noThrow) {
          throw new TypeError(element + ' is not a DOM element.');
      }
      return element;
  }

  var index$2 = function createPointCB(object) {

      // A persistent object (as opposed to returned object) is used to save memory
      // This is good to prevent layout thrashing, or for games, and such

      // NOTE
      // This uses IE fixes which should be OK to remove some day. :)
      // Some speed will be gained by removal of these.

      // pointCB should be saved in a variable on return
      // This allows the usage of element.removeEventListener

      return function pointCB(event) {

          event = event || window.event; // IE-ism
          object.target = event.target || event.srcElement || event.originalTarget;
          object.element = this;
          object.type = event.type;

          // Support touch
          // http://www.creativebloq.com/javascript/make-your-site-work-touch-devices-51411644

          if (event.targetTouches) {
              object.x = event.targetTouches[0].clientX;
              object.y = event.targetTouches[0].clientY;
              object.pageX = event.pageX;
              object.pageY = event.pageY;
          } else {

              // If pageX/Y aren't available and clientX/Y are,
              // calculate pageX/Y - logic taken from jQuery.
              // (This is to support old IE)
              // NOTE Hopefully this can be removed soon.

              if (event.pageX === null && event.clientX !== null) {
                  var eventDoc = event.target && event.target.ownerDocument || document;
                  var doc = eventDoc.documentElement;
                  var body = eventDoc.body;

                  object.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
                  object.pageY = event.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0);
              } else {
                  object.pageX = event.pageX;
                  object.pageY = event.pageY;
              }

              // pageX, and pageY change with page scroll
              // so we're not going to use those for x, and y.
              // NOTE Most browsers also alias clientX/Y with x/y
              // so that's something to consider down the road.

              object.x = event.clientX;
              object.y = event.clientY;
          }
      };

      //NOTE Remember accessibility, Aria roles, and labels.
  };

  function createWindowRect() {
      var props = {
          top: { value: 0, enumerable: true },
          left: { value: 0, enumerable: true },
          right: { value: window.innerWidth, enumerable: true },
          bottom: { value: window.innerHeight, enumerable: true },
          width: { value: window.innerWidth, enumerable: true },
          height: { value: window.innerHeight, enumerable: true },
          x: { value: 0, enumerable: true },
          y: { value: 0, enumerable: true }
      };

      if (Object.create) {
          return Object.create({}, props);
      } else {
          var rect = {};
          Object.defineProperties(rect, props);
          return rect;
      }
  }

  function getClientRect(el) {
      if (el === window) {
          return createWindowRect();
      } else {
          try {
              var rect = el.getBoundingClientRect();
              if (rect.x === undefined) {
                  rext.x = rect.left;
                  rect.y = rect.top;
              }
              return rect;
          } catch (e) {
              throw new TypeError("Can't call getBoundingClientRect on " + el);
          }
      }
  }

  function pointInside(point, el) {
      var rect = getClientRect(el);
      return point.y > rect.top && point.y < rect.bottom && point.x > rect.left && point.x < rect.right;
  }

  function AutoScroller(elements) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var self = this;
      var maxSpeed = 4,
          scrolling = false;

      this.margin = options.margin || -1;
      //this.scrolling = false;
      this.scrollWhenOutside = options.scrollWhenOutside || false;

      var point = {},
          pointCB = index$2(point),
          down = false;

      window.addEventListener('mousemove', pointCB, false);
      window.addEventListener('touchmove', pointCB, false);

      if (!isNaN(options.maxSpeed)) {
          maxSpeed = options.maxSpeed;
      }

      this.autoScroll = boolean(options.autoScroll);

      this.destroy = function () {
          window.removeEventListener('mousemove', pointCB, false);
          window.removeEventListener('touchmove', pointCB, false);
          window.removeEventListener('mousedown', onDown, false);
          window.removeEventListener('touchstart', onDown, false);
          window.removeEventListener('mouseup', onUp, false);
          window.removeEventListener('touchend', onUp, false);

          window.removeEventListener('scroll', setScroll, true);
          elements = [];
      };

      this.add = function () {
          for (var _len = arguments.length, element = Array(_len), _key = 0; _key < _len; _key++) {
              element[_key] = arguments[_key];
          }

          addElements.apply(undefined, [elements].concat(element));
          return this;
      };

      this.remove = function () {
          for (var _len2 = arguments.length, element = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
              element[_key2] = arguments[_key2];
          }

          return removeElements.apply(undefined, [elements].concat(element));
      };

      var hasWindow = null,
          windowAnimationFrame = void 0;

      if (Object.prototype.toString.call(elements) !== '[object Array]') {
          elements = [elements];
      }

      (function (temp) {
          elements = [];
          temp.forEach(function (element) {
              if (element === window) {
                  hasWindow = window;
              } else {
                  self.add(element);
              }
          });
      })(elements);

      Object.defineProperties(this, {
          down: {
              get: function get() {
                  return down;
              }
          },
          maxSpeed: {
              get: function get() {
                  return maxSpeed;
              }
          },
          point: {
              get: function get() {
                  return point;
              }
          },
          scrolling: {
              get: function get() {
                  return scrolling;
              }
          }
      });

      var n = 0,
          current = null,
          animationFrame = void 0;

      window.addEventListener('mousedown', onDown, false);
      window.addEventListener('touchstart', onDown, false);
      window.addEventListener('mouseup', onUp, false);
      window.addEventListener('touchend', onUp, false);

      window.addEventListener('mousemove', onMove, false);
      window.addEventListener('touchmove', onMove, false);

      window.addEventListener('mouseleave', onMouseOut, false);

      window.addEventListener('scroll', setScroll, true);

      function setScroll(e) {

          for (var i = 0; i < elements.length; i++) {
              if (elements[i] === e.target) {
                  scrolling = true;
                  break;
              }
          }

          if (scrolling) {
              requestAnimationFrame(function () {
                  return scrolling = false;
              });
          }
      }

      function onDown() {
          down = true;
      }

      function onUp() {
          down = false;
          cancelAnimationFrame(animationFrame);
          cancelAnimationFrame(windowAnimationFrame);
      }

      function onMouseOut() {
          down = false;
      }

      function getTarget(target) {
          if (!target) {
              return null;
          }

          if (current === target) {
              return target;
          }

          if (hasElement(elements, target)) {
              return target;
          }

          while (target = target.parentNode) {
              if (hasElement(elements, target)) {
                  return target;
              }
          }

          return null;
      }

      function getElementUnderPoint() {
          var underPoint = null;

          for (var i = 0; i < elements.length; i++) {
              if (inside(point, elements[i])) {
                  underPoint = elements[i];
              }
          }

          return underPoint;
      }

      function onMove(event) {

          if (!self.autoScroll()) return;
          var target = event.target,
              body = document.body;

          if (current && !inside(point, current)) {
              if (!self.scrollWhenOutside) {
                  current = null;
              }
          }

          if (target && target.parentNode === body) {
              //The special condition to improve speed.
              target = getElementUnderPoint();
          } else {
              target = getTarget(target);

              if (!target) {
                  target = getElementUnderPoint();
              }
          }

          if (target && target !== current) {
              current = target;
          }

          if (hasWindow) {
              cancelAnimationFrame(windowAnimationFrame);
              windowAnimationFrame = requestAnimationFrame(scrollWindow);
          }

          if (!current) {
              return;
          }

          cancelAnimationFrame(animationFrame);
          animationFrame = requestAnimationFrame(scrollTick);
      }

      function scrollWindow() {
          autoScroll(hasWindow);

          cancelAnimationFrame(windowAnimationFrame);
          windowAnimationFrame = requestAnimationFrame(scrollWindow);
      }

      function scrollTick() {

          if (!current) {
              return;
          }

          autoScroll(current);

          cancelAnimationFrame(animationFrame);
          animationFrame = requestAnimationFrame(scrollTick);
      }

      function autoScroll(el) {
          var rect = getClientRect(el),
              scrollx = void 0,
              scrolly = void 0;

          if (point.x < rect.left + self.margin) {
              scrollx = Math.floor(Math.max(-1, (point.x - rect.left) / self.margin - 1) * self.maxSpeed);
          } else if (point.x > rect.right - self.margin) {
              scrollx = Math.ceil(Math.min(1, (point.x - rect.right) / self.margin + 1) * self.maxSpeed);
          } else {
              scrollx = 0;
          }

          if (point.y < rect.top + self.margin) {
              scrolly = Math.floor(Math.max(-1, (point.y - rect.top) / self.margin - 1) * self.maxSpeed);
          } else if (point.y > rect.bottom - self.margin) {
              scrolly = Math.ceil(Math.min(1, (point.y - rect.bottom) / self.margin + 1) * self.maxSpeed);
          } else {
              scrolly = 0;
          }

          setTimeout(function () {

              if (scrolly) {
                  scrollY(el, scrolly);
              }

              if (scrollx) {
                  scrollX(el, scrollx);
              }
          });
      }

      function scrollY(el, amount) {
          if (el === window) {
              window.scrollTo(el.pageXOffset, el.pageYOffset + amount);
          } else {
              el.scrollTop += amount;
          }
      }

      function scrollX(el, amount) {
          if (el === window) {
              window.scrollTo(el.pageXOffset + amount, el.pageYOffset);
          } else {
              el.scrollLeft += amount;
          }
      }
  }

  function AutoScrollerFactory(element, options) {
      return new AutoScroller(element, options);
  }
  function inside(point, el, rect) {
      if (!rect) {
          return pointInside(point, el);
      } else {
          return point.y > rect.top && point.y < rect.bottom && point.x > rect.left && point.x < rect.right;
      }
  }
  /*function getRect(el){
      if(el === window){
          return {
              top: 0,
              left: 0,
              right: window.innerWidth,
              bottom: window.innerHeight,
              width: window.innerWidth,
              height: window.innerHeight
          };

      }else{
          try{
              return el.getBoundingClientRect();
          }catch(e){
              throw new TypeError("Can't call getBoundingClientRect on "+el);
          }

      }
  }

  function inside(point, el, rect){
      rect = rect || getRect(el);
      return (point.y > rect.top && point.y < rect.bottom &&
              point.x > rect.left && point.x < rect.right);
  }*/

  /*
  git remote add origin https://github.com/hollowdoor/dom_autoscroller.git
  git push -u origin master
  */

  return AutoScrollerFactory;

}());
//# sourceMappingURL=dom-autoscroller.js.map
