var createPointCB = require('create-point-cb');



var requestFrame = (function(){
    if(requestAnimationFrame){
        return requestAnimationFrame;
    }else{
        return function(fn){
            return setTimeout(fn);
        };
    }
}());

var cancelFrame = (function(){
    if(cancelAnimationFrame){
        return cancelAnimationFrame;
    }else{
        return clearTimeout;
    }
}());

function AutoScroller(elements, options){
    var self = this, maxSpeed = 4;
    options = options || {};

    this.margin = options.margin || -1;
    this.scrolling = false;
    this.scrollWhenOutside = options.scrollWhenOutside || false;

    var point = {}, pointCB = createPointCB(point), down = false;

    window.addEventListener('mousemove', pointCB, false);
    window.addEventListener('touchmove', pointCB, false);

    if(!isNaN(options.maxSpeed)){
        maxSpeed = options.maxSpeed;
    }

    if(typeof options.autoScroll === 'boolean'){
        this.autoScroll = options.autoScroll ? function(){return true;} : function(){return false;};
    }else if(typeof options.autoScroll === 'undefined'){
        this.autoScroll = function(){return false;};
    }else if(typeof options.autoScroll === 'function'){
        this.autoScroll = options.autoScroll;
    }

    this.destroy = function() {
        window.removeEventListener('mousemove', pointCB, false);
        window.removeEventListener('touchmove', pointCB, false);
        window.removeEventListener('mousedown', onDown, false);
        window.removeEventListener('touchstart', onDown, false);
        window.removeEventListener('mouseup', onUp, false);
        window.removeEventListener('touchend', onUp, false);
        elements = [];
    };

    function getElement(element){
        if(typeof element === 'string'){
            return document.querySelector(element);
        }
        return element;
    }

    this.add = function(element){
        element = getElement(element);

        for(var i=0; i<elements.length; i++){
            if(elements[i] === element) return this;
        }

        elements.push(element);
        return this;
    };

    this.remove = function(element){
        element = getElement(element);

        for(var i=0; i<elements.length; i++){
            if(element === elements[i]){
                elements.splice(i, 1);
                return this;
            }
        }
        return this;
    };

    var hasWindow = null;

    (function(temp){
        elements = [];
        temp.forEach(function(element){
            if(element === window){
                hasWindow = window;
            }else{
                self.add(element);
            }
        })
    }(elements));

    Object.defineProperties(this, {
        down: {
            get: function(){ return down; }
        },
        maxSpeed: {
            get: function(){ return maxSpeed; }
        }
    });

    var n = 0, current, animationFrame, started = false;

    window.addEventListener('mousedown', onDown, false);
    window.addEventListener('touchstart', onDown, false);
    window.addEventListener('mouseup', onUp, false);
    window.addEventListener('touchend', onUp, false);

    window.addEventListener('mousemove', onMove, false);
    window.addEventListener('touchmove', onMove, false);

    function onDown(){
        down = true;
    }

    function onUp(){
        down = false;
        started = false;
        cancelFrame(animationFrame);
    }

    function onMove(event){

        if(!self.autoScroll()) return;
        if(!event.target) return;
        var target = event.target, last;

        if(!current || !inside(point, current) && !self.scrollWhenOutside){
            if(!current && target){
                current = null;
                while(target = target.parentNode){
                    for(var i=0; i<elements.length; i++){
                        if(elements[i] === target && inside(point, elements[i])){
                            current = elements[i];
                            break;
                        }
                    }
                }
            }else{
                last = current;
                current = null;
                for(var i=0; i<elements.length; i++){
                    if(elements[i] !== last && inside(point, elements[i])){
                        current = elements[i];
                    }
                }
            }
        }

        cancelFrame(animationFrame);
        animationFrame = requestFrame(scrollTick);
    }

    function scrollTick(){
        if(hasWindow){
            autoScroll(hasWindow);
        }

        if(!current){
            return;
        }

        autoScroll(current);

        cancelFrame(animationFrame);
        animationFrame = requestFrame(scrollTick);

    }

    function autoScroll(el){
        var rect = getRect(el), scrollx, scrolly;

        if(point.x < rect.left + self.margin){
            scrollx = Math.max(-1, (point.x - rect.left) / self.margin - 1) * self.maxSpeed;
        }else if(point.x > rect.right - self.margin){
            scrollx = Math.min(1, (point.x - rect.right) / self.margin + 1) * self.maxSpeed;
        }else{
            scrollx = 0;
        }

        if(point.y < rect.top + self.margin){
            scrolly = Math.max(-1, (point.y - rect.top) / self.margin - 1) * self.maxSpeed;
        }else if(point.y > rect.bottom - self.margin){
            scrolly = Math.min(1, (point.y - rect.bottom) / self.margin + 1) * self.maxSpeed;
        }else{
            scrolly = 0;
        }

        setTimeout(function(){

            if(scrolly){
                scrollY(el, scrolly);
            }

            if(scrollx){
                scrollX(el, scrollx);
            }

        });
    }

    function scrollY(el, amount){
        if(el === window){
            window.scrollTo(el.pageXOffset, el.pageYOffset + amount);
        }else{
            //el.scrollTop = el.scrollTop + amount;
            el.scrollTop += amount;
        }
    }

    function scrollX(el, amount){
        if(el === window){
            window.scrollTo(el.pageXOffset + amount, el.pageYOffset);
        }else{
            //el.scrollLeft = el.scrollLeft + amount;
            el.scrollLeft += amount;
        }
    }

}

module.exports = function AutoScrollerFactory(element, options){
    return new AutoScroller(element, options);
};

function getRect(el){
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
}

/*
git remote add origin https://github.com/hollowdoor/dom_autoscroller.git
git push -u origin master
*/
