var pointer = require('pointer-point');

/*
git remote add origin https://github.com/hollowdoor/dom_autoscroller.git
git push -u origin master
*/

function AutoScrollerFactory(element, options){
    return new AutoScroller(element, options);
}

function AutoScroller(elements, options){
    var self = this, pixels = 2;
    options = options || {};

    this.margin = options.margin || -1;
    this.scrolling = false;
    this.scrollWhenOutside = options.scrollWhenOutside || false;

    this.point = pointer(elements);

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
        this.point.destroy();
    };

    Object.defineProperties(this, {
        down: {
            get: function(){ return self.point.down; }
        },
        interval: {
            get: function(){ return 1/pixels * 1000; }
        },
        pixels: {
            set: function(i){ pixels = i; },
            get: function(){ return pixels; }
        }
    });

    this.point.on('move', function(el, rect){

        if(!el) return;
        if(!self.autoScroll()) return;
        if(!self.scrollWhenOutside && this.outside(el)) return;

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
    });

    function autoScrollV(el, amount, rect){
        //if(!self.down) return;
        if(!self.autoScroll()) return;
        if(!self.scrollWhenOutside && self.point.outside(el)) return;
        if(el === window){
            window.scrollTo(el.pageXOffset, el.pageYOffset + amount);
        }else{
            el.scrollTop = el.scrollTop + amount;
        }

        setTimeout(function(){
            if(self.point.y < rect.top + self.margin){
                autoScrollV(el, amount, rect);
            }else if(self.point.y > rect.bottom - self.margin){
                autoScrollV(el, amount, rect);
            }
        }, self.interval);
    }

    function autoScrollH(el, amount, rect){
        //if(!self.down) return;
        if(!self.autoScroll()) return;
        if(!self.scrollWhenOutside && self.point.outside(el)) return;
        if(el === window){
            window.scrollTo(el.pageXOffset + amount, el.pageYOffset);
        }else{
            el.scrollLeft = el.scrollLeft + amount;
        }

        setTimeout(function(){
            if(self.point.x < rect.left + self.margin){
                autoScrollH(el, amount, rect);
            }else if(self.point.x > rect.right - self.margin){
                autoScrollH(el, amount, rect);
            }
        }, self.interval);
    }

}

module.exports = AutoScrollerFactory;
