import {boolean} from 'type-func';
import {
    requestAnimationFrame as requestFrame,
    cancelAnimationFrame as cancelFrame
} from 'animation-frame-polyfill';
import {
    hasElement,
    addElements,
    removeElements
} from 'dom-set';

import {
    createPointCB,
    getClientRect as getRect,
    pointInside
} from 'dom-plane';

import mousemoveDispatcher from 'dom-mousemove-dispatcher';

function AutoScroller(elements, options = {}){
    const self = this;
    let maxSpeed = 4, scrolling = false;

    this.margin = options.margin || -1;
    //this.scrolling = false;
    this.scrollWhenOutside = options.scrollWhenOutside || false;
    // those two X and Y options might be merged together, even with the original scrollWhenOutside
    // for now, all are kept for compatibility reasons
    this.scrollWhenOutsideX = options.scrollWhenOutsideX == undefined ? this.scrollWhenOutside : options.scrollWhenOutsideX;
    this.scrollWhenOutsideY = options.scrollWhenOutsideY == undefined ? this.scrollWhenOutside : options.scrollWhenOutsideY;

    let point = {},
        pointCB = createPointCB(point),
        dispatcher = mousemoveDispatcher(),
        down = false;

    window.addEventListener('mousemove', pointCB, false);
    window.addEventListener('touchmove', pointCB, false);

    if(!isNaN(options.maxSpeed)){
        maxSpeed = options.maxSpeed;
    }

    this.autoScroll = boolean(options.autoScroll);
    this.syncMove = boolean(options.syncMove, false);

    this.destroy = function(forceCleanAnimation) {
        window.removeEventListener('mousemove', pointCB, false);
        window.removeEventListener('touchmove', pointCB, false);
        window.removeEventListener('mousedown', onDown, false);
        window.removeEventListener('touchstart', onDown, false);
        window.removeEventListener('mouseup', onUp, false);
        window.removeEventListener('touchend', onUp, false);
        window.removeEventListener('pointerup', onUp, false);
        window.removeEventListener('mouseleave', onMouseOut, false);

        window.removeEventListener('mousemove', onMove, false);
        window.removeEventListener('touchmove', onMove, false);

        window.removeEventListener('scroll', setScroll, true);
        elements = [];
        if(forceCleanAnimation){
          cleanAnimation();
        }
    };

    this.add = function(...element){
        addElements(elements, ...element);
        return this;
    };

    this.remove = function(...element){
        return removeElements(elements, ...element);
    };

    let hasWindow = null, windowAnimationFrame;

    if(Object.prototype.toString.call(elements) !== '[object Array]'){
        elements = [elements];
    }

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
        },
        point: {
            get: function(){ return point; }
        },
        scrolling: {
            get: function(){ return scrolling; }
        }
    });

    let n = 0, current = null, animationFrame;

    window.addEventListener('mousedown', onDown, false);
    window.addEventListener('touchstart', onDown, false);
    window.addEventListener('mouseup', onUp, false);
    window.addEventListener('touchend', onUp, false);

    /*
    IE does not trigger mouseup event when scrolling.
    It is a known issue that Microsoft won't fix.
    https://connect.microsoft.com/IE/feedback/details/783058/scrollbar-trigger-mousedown-but-not-mouseup
    IE supports pointer events instead
    */
    window.addEventListener('pointerup', onUp, false);

    window.addEventListener('mousemove', onMove, false);
    window.addEventListener('touchmove', onMove, false);

    window.addEventListener('mouseleave', onMouseOut, false);

    window.addEventListener('scroll', setScroll, true);

    function setScroll(e){

        for(let i=0; i<elements.length; i++){
            if(elements[i] === e.target){
                scrolling = true;
                break;
            }
        }

        if(scrolling){
            requestFrame(()=>scrolling = false)
        }
    }

    function onDown(){
        down = true;
    }

    function onUp(){
        down = false;
        cleanAnimation();
    }
    function cleanAnimation(){
      cancelFrame(animationFrame);
      cancelFrame(windowAnimationFrame);
    }
    function onMouseOut(){
        down = false;
    }

    function getTarget(target){
        if(!target){
            return null;
        }

        if(current === target){
            return target;
        }

        if(hasElement(elements, target)){
            return target;
        }

        while(target = target.parentNode){
            if(hasElement(elements, target)){
                return target;
            }
        }

        return null;
    }

    function getElementUnderPoint(){
        let underPoint = null;

        for(var i=0; i<elements.length; i++){
            if(inside(point, elements[i])){
                underPoint = elements[i];
            }
        }

        return underPoint;
    }


    function onMove(event){

        if(!self.autoScroll()) return;

        if(event['dispatched']){ return; }

        let target = event.target, body = document.body;

        if(current && !inside(point, current)){
            if(!self.scrollWhenOutside && !self.scrollWhenOutsideX && !self.scrollWhenOutsideY){
                current = null;
            }
        }

        if(target && target.parentNode === body){
            //The special condition to improve speed.
            target = getElementUnderPoint();
        }else{
            target = getTarget(target);

            if(!target){
                target = getElementUnderPoint();
            }
        }


        if(target && target !== current){
            current = target;
        }

        if(hasWindow){
            cancelFrame(windowAnimationFrame);
            windowAnimationFrame = requestFrame(scrollWindow);
        }


        if(!current){
            return;
        }

        cancelFrame(animationFrame);
        animationFrame = requestFrame(scrollTick);
    }

    function scrollWindow(){
        autoScroll(hasWindow);

        cancelFrame(windowAnimationFrame);
        windowAnimationFrame = requestFrame(scrollWindow);
    }

    function scrollTick(){

        if(!current){
            return;
        }

        autoScroll(current);

        cancelFrame(animationFrame);
        animationFrame = requestFrame(scrollTick);

    }


    function autoScroll(el){
        let rect = getRect(el), scrollx, scrolly;

        scrollx = deltaX(point, rect, self);
        scrolly = deltaY(point, rect, self);

        const horizontallyInside = point.x >= rect.left && point.x <= rect.right;
        const verticallyInside = point.y >= rect.top && point.y <= rect.bottom;
        
        if (!self.scrollWhenOutsideX && !horizontallyInside || !self.scrollWhenOutsideY && !verticallyInside) {
            scrollx = 0;
            scrolly = 0;
        }

        if(self.syncMove()){
            /*
            Notes about mousemove event dispatch.
            screen(X/Y) should need to be updated.
            Some other properties might need to be set.
            Keep the syncMove option default false until all inconsistencies are taken care of.
            */
            dispatcher.dispatch(el, {
                pageX: point.pageX + scrollx,
                pageY: point.pageY + scrolly,
                clientX: point.x + scrollx,
                clientY: point.y + scrolly
            });
        }

        setTimeout(()=>{

            if(scrolly){
                scrollY(el, scrolly);
            }

            if(scrollx){
                scrollX(el, scrollx);
            }

        });
    }

    function deltaX(point, rect, autoscroller) {
        if(point.x < rect.left + autoscroller.margin){
            return Math.floor(
                Math.max(-1, (point.x - rect.left) / autoscroller.margin - 1) * autoscroller.maxSpeed
            );
        }else if(point.x > rect.right - autoscroller.margin){
            return Math.ceil(
                Math.min(1, (point.x - rect.right) / autoscroller.margin + 1) * autoscroller.maxSpeed
            );
        }
        return 0;
    }

    function deltaY(point, rect, autoscroller) {
        if(point.y < rect.top + autoscroller.margin){
            return Math.floor(
                Math.max(-1, (point.y - rect.top) / autoscroller.margin - 1) * autoscroller.maxSpeed
            );
        }else if(point.y > rect.bottom - autoscroller.margin){
            return Math.ceil(
                Math.min(1, (point.y - rect.bottom) / autoscroller.margin + 1) * autoscroller.maxSpeed
            );
        }
        return 0;
    }

    function scrollY(el, amount){
        if(el === window){
            window.scrollTo(el.pageXOffset, el.pageYOffset + amount);
        }else{
            el.scrollTop += amount;
        }
    }

    function scrollX(el, amount){
        if(el === window){
            window.scrollTo(el.pageXOffset + amount, el.pageYOffset);
        }else{
            el.scrollLeft += amount;
        }
    }

}

export default function AutoScrollerFactory(element, options){
    return new AutoScroller(element, options);
}

function inside(point, el, rect){
    if(!rect){
        return pointInside(point, el);
    }else{
        return (point.y > rect.top && point.y < rect.bottom &&
                point.x > rect.left && point.x < rect.right);
    }
}

/*
git remote add origin https://github.com/hollowdoor/dom_autoscroller.git
git push -u origin master
*/
