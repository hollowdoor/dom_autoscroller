var createPointCB = require('create-point-cb');

/*
git remote add origin https://github.com/hollowdoor/dom_autoscroller.git
git push -u origin master
*/



function AutoScroller(elements, options){
    var self = this, pixels = 2;
    options = options || {};

    this.margin = options.margin || -1;
    this.scrolling = false;
    this.scrollWhenOutside = options.scrollWhenOutside || false;

    var point = {}, pointCB = createPointCB(point), down = false;

    window.addEventListener('mousemove', pointCB, false);
    window.addEventListener('touchmove', pointCB, false);

    if(!isNaN(options.pixels)){
        pixels = options.pixels;
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
    };

    var hasWindow = null, temp = [];
    for(var i=0; i<elements.length; i++){
        if(elements[i] === window){
            hasWindow = window;
            break;
        }else{
            temp.push(elements[i])
        }
    }

    elements = temp;
    temp = null;

    Object.defineProperties(this, {
        down: {
            get: function(){ return down; }
        },
        interval: {
            get: function(){ return 1/pixels * 1000; }
        },
        pixels: {
            set: function(i){ pixels = i; },
            get: function(){ return pixels; }
        }
    });

    window.addEventListener('mousedown', onDown, false);
    window.addEventListener('touchstart', onDown, false);
    window.addEventListener('mouseup', onUp, false);
    window.addEventListener('touchend', onUp, false);

    function onDown(){
        down = true;
    }

    function onUp(){
        down = false;
    }

    var n = 0, current;

    window.addEventListener('mousemove', onMove, false);
    window.addEventListener('touchmove', onMove, false);

    function onMove(event){

        if(!self.autoScroll()) return;
        if(!event.target) return;
        var target = event.target, last;

        if(!current || !inside(point, current)){
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

        if(hasWindow){
            autoScroll(hasWindow);
        }

        if(!current) return;

        autoScroll(current);
    }

    function autoScroll(el){
        var rect = getRect(el);

        if(point.y < rect.top + self.margin){
            autoScrollV(el, -1, rect);
        }else if(point.y > rect.bottom - self.margin){
            autoScrollV(el, 1, rect);
        }

        if(point.x < rect.left + self.margin){
            autoScrollH(el, -1, rect);
        }else if(point.x > rect.right - self.margin){
            autoScrollH(el, 1, rect);
        }
    }

    /*this.point.on('move', function(el, rect){

        console.log('moveing ', ++n,  el)


        if(!el) return;
        if(!self.autoScroll()) return;
        //if(!self.scrollWhenOutside && self.point.outside(el)) return;
        if(self.point.outside(el)) return;

        rect = pointer.getRect(el);

        if(self.point.y < rect.top + self.margin){
            autoScrollV(el, -1, rect);
        }else if(self.point.y > rect.bottom - self.margin){
            autoScrollV(el, 1, rect);
        }

        if(self.point.x < rect.left + self.margin){
            autoScrollH(el, -1, rect);
        }else if(self.point.x > rect.right - self.margin){
            autoScrollH(el, 1, rect);
        }
    });*/

    function autoScrollV(el, amount, rect){

        if(!self.autoScroll()) return;
        if(!self.scrollWhenOutside && !inside(point, el, rect)) return;

        if(el === window){
            window.scrollTo(el.pageXOffset, el.pageYOffset + amount);
        }else{

            el.scrollTop = el.scrollTop + amount;
        }

        setTimeout(function(){
            if(point.y < rect.top + self.margin){
                autoScrollV(el, amount, rect);
            }else if(point.y > rect.bottom - self.margin){
                autoScrollV(el, amount, rect);
            }
        }, self.interval);
    }

    function autoScrollH(el, amount, rect){

        if(!self.autoScroll()) return;
        if(!self.scrollWhenOutside && !inside(point, el, rect)) return;

        if(el === window){
            window.scrollTo(el.pageXOffset + amount, el.pageYOffset);
        }else{
            el.scrollLeft = el.scrollLeft + amount;
        }

        setTimeout(function(){
            if(point.x < rect.left + self.margin){
                autoScrollH(el, amount, rect);
            }else if(point.x > rect.right - self.margin){
                autoScrollH(el, amount, rect);
            }
        }, self.interval);
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
            console.log(el)
            throw new TypeError("Can't call getBoundingClientRect on "+el);
        }

    }
}

function inside(point, el, rect){
    rect = rect || getRect(el);
    return (point.y > rect.top && point.y < rect.bottom &&
            point.x > rect.left && point.x < rect.right);
}
