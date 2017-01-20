var dragula = require('dragula')//,
    autoScroll = require('../');


var drake = dragula([document.querySelector('#list'), document.querySelector('#hlist')]);

var scroll = autoScroll([
        window,
        document.querySelector('#list-container'),
        document.querySelector('#container2')
    ],{
    margin: 20,
    maxSpeed: 20,
    syncMove: true,
    autoScroll: function(){
        return this.down && drake.dragging;
    }
});
