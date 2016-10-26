'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var createPointCB = _interopDefault(require('create-point-cb'));

var requestFrame = function () {
    if (requestAnimationFrame) {
        return requestAnimationFrame;
    } else {
        return function (fn) {
            return setTimeout(fn);
        };
    }
}();

var cancelFrame = function () {
    if (cancelAnimationFrame) {
        return cancelAnimationFrame;
    } else {
        return clearTimeout;
    }
}();

function AutoScroller(elements) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var self = this;
    var maxSpeed = 4;

    this.margin = options.margin || -1;
    this.scrolling = false;
    this.scrollWhenOutside = options.scrollWhenOutside || false;

    var point = {},
        pointCB = createPointCB(point),
        down = false;

    window.addEventListener('mousemove', pointCB, false);
    window.addEventListener('touchmove', pointCB, false);

    if (!isNaN(options.maxSpeed)) {
        maxSpeed = options.maxSpeed;
    }

    if (typeof options.autoScroll === 'boolean') {
        this.autoScroll = options.autoScroll ? function () {
            return true;
        } : function () {
            return false;
        };
    } else if (typeof options.autoScroll === 'undefined') {
        this.autoScroll = function () {
            return false;
        };
    } else if (typeof options.autoScroll === 'function') {
        this.autoScroll = options.autoScroll;
    }

    this.destroy = function () {
        window.removeEventListener('mousemove', pointCB, false);
        window.removeEventListener('touchmove', pointCB, false);
        window.removeEventListener('mousedown', onDown, false);
        window.removeEventListener('touchstart', onDown, false);
        window.removeEventListener('mouseup', onUp, false);
        window.removeEventListener('touchend', onUp, false);
        elements = [];
    };

    function getElement(element) {
        if (typeof element === 'string') {
            return document.querySelector(element);
        }
        return element;
    }

    this.add = function (element) {
        element = getElement(element);

        for (var i = 0; i < elements.length; i++) {
            if (elements[i] === element) return this;
        }

        elements.push(element);
        return this;
    };

    this.remove = function (element) {
        element = getElement(element);

        for (var i = 0; i < elements.length; i++) {
            if (element === elements[i]) {
                elements.splice(i, 1);
                return this;
            }
        }
        return this;
    };

    var hasWindow = null,
        windowAnimationFrame = void 0;

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

    function onDown() {
        down = true;
    }

    function onUp() {
        down = false;
        cancelFrame(animationFrame);
    }

    function getTarget(target) {
        if (!target) {
            return null;
        }

        if (current === target) {
            return target;
        }

        for (var i = 0; i < elements.length; i++) {
            if (elements[i] === target) {
                return target;
            }
        }

        while (target = target.parentNode) {
            for (var i = 0; i < elements.length; i++) {
                if (elements[i] === target) {
                    return target;
                }
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
            current = null;
        }

        if (target && target.parentNode === body) {
            //The special condition to improve speed.
            current = getElementUnderPoint();
        } else {
            target = getTarget(target);

            if (target) {
                current = target;
            } else {
                //The target might have still been moved.
                current = getElementUnderPoint();
            }
        }

        if (hasWindow) {
            cancelFrame(windowAnimationFrame);
            windowAnimationFrame = requestFrame(scrollWindow);
        }

        if (!current) {
            return;
        }

        cancelFrame(animationFrame);
        animationFrame = requestFrame(scrollTick);
    }

    function scrollWindow() {
        autoScroll(hasWindow);
    }

    function scrollTick() {

        if (!current) {
            return;
        }

        autoScroll(current);

        cancelFrame(animationFrame);
        animationFrame = requestFrame(scrollTick);
    }

    function autoScroll(el) {
        var rect = getRect(el),
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
            //el.scrollTop = el.scrollTop + amount;
            el.scrollTop += amount;
        }
    }

    function scrollX(el, amount) {
        if (el === window) {
            window.scrollTo(el.pageXOffset + amount, el.pageYOffset);
        } else {
            //el.scrollLeft = el.scrollLeft + amount;
            el.scrollLeft += amount;
        }
    }
}

function AutoScrollerFactory(element, options) {
    return new AutoScroller(element, options);
}

function getRect(el) {
    if (el === window) {
        return {
            top: 0,
            left: 0,
            right: window.innerWidth,
            bottom: window.innerHeight,
            width: window.innerWidth,
            height: window.innerHeight
        };
    } else {
        try {
            return el.getBoundingClientRect();
        } catch (e) {
            throw new TypeError("Can't call getBoundingClientRect on " + el);
        }
    }
}

function inside(point, el, rect) {
    rect = rect || getRect(el);
    return point.y > rect.top && point.y < rect.bottom && point.x > rect.left && point.x < rect.right;
}

/*
git remote add origin https://github.com/hollowdoor/dom_autoscroller.git
git push -u origin master
*/

module.exports = AutoScrollerFactory;
//# sourceMappingURL=bundle.js.map
