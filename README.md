dom-autoscroller
================

Install
-------

`npm install --save dom-autoscroller`

Usage
-----

This example uses [link-css](https://www.npmjs.com/package/link-css), and [dragula](https://www.npmjs.com/package/dragula).

```javascript
require('link-css')('../node_modules/dragula/dist/dragula.min.css');
var dragula = require('dragula'),
    autoScroll = require('dom-autoscroller');


var drake = dragula([document.querySelector('#list'), document.querySelector('#hlist')]);
var scroll = autoScroll([
        document.querySelector('#list-container'),
        document.querySelector('#container2')
    ],{
    margin: 20,
    pixels: 5,
    scrollWhenOutside: true,
    autoScroll: function(){
        //Only scroll when the pointer is down, and there is a child being dragged.
        return this.down && drake.dragging;
    }
});
```

Keep In Mind
------------

`dom-autoscroller` exploits the simplicity of the single parent, to child relationship. A scrolling element with more than one children will likely not work well with `dom-autoscroller`.

For clarity here is a more complete example:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Drag test</title>
    <style>
    #list-container{
        /*The height produces the scroll bar.*/
        height: 100px;
        /*Make this scrollable.*/
        overflow-y: auto;
    }
    </style>
</head>
<body>
    <div id="list-container">
        <ol id="list" type="1">
            <li>zero</li>
            <li>one</li>
            <li>two</li>
            <li>three</li>
            <li>four</li>
            <li>five</li>
            <li>six</li>
            <li>seven</li>
            <li>eight</li>
            <li>nine</li>
            <li>ten</li>
            <li>eleven</li>
            <li>twelve</li>
            <li>thirteen</li>
            <li>fourteen</li>
            <li>fifteen</li>
        </ol>
    </div>
    <div id="container2">
        <ol id="hlist">
            <li>zero</li>
            <li>one</li>
            <li>two</li>
            <li>three</li>
            <li>four</li>
            <li>five</li>
            <li>six</li>
            <li>seven</li>
            <li>eight</li>
            <li>nine</li>
            <li>ten</li>
            <li>11</li>
            <li>12</li>
            <li>13</li>
            <li>14</li>
            <li>15</li>
        </ol>
    </div>
    <script>
    //Load dragula's css.
    require('link-css')('../node_modules/dragula/dist/dragula.min.css');
    var dragula = require('dragula'),
        papyri = require('dom-autoscroller');


    var drake = dragula([document.querySelector('#list'), document.querySelector('#hlist')]);
    var scroll = autoScroll([
            document.querySelector('#list-container'),
            document.querySelector('#container2')
        ],{
        margin: 20,
        pixels: 5,
        scrollWhenOutside: false,
        autoScroll: function(){
            return this.down && drake.dragging;
        }
    });
    </script>
</body>
</html>
```

If you look at the last example notice the containers have only one child, and that they're different from the containers used by *dragula*. In theory multiple children could work with `dom-autoscroller`, but the children scrolling might interfere with the workings of the library *dragula*.

[jsfiddle Demo of dom-autoscroller](https://jsfiddle.net/hollowdoor/a2or8sez/)

Auto Scroller API
-----------------

### autoScroll(element|elements, options) -> instance

Create an auto scroller on an **element**, or and **array of elements**.

**The element should have only one child element to work consistently.**

#### options.margin = Integer

An inner area to detect when the pointer is close to the edge.

#### options.autoScroll = Function

A callback function used to determine if the element should scroll, or when the element should scroll.

Return a boolean value from this function to allow scrolling.

#### options.pixels = Integer

Set how many pixels per second you want to scroll during the auto scrolling action. More is smoother.

#### options.scrollWhenOutside = Boolean

Whther or not it should continue to scroll when the pointer is outside the container. Defaults to **false**.

Auto Scroller Properties
------------------------

### down = Boolean

Is the pointer down?

### point = Object

A reference to the [pointer](https://github.com/hollowdoor/pointer_point) object.

Auto Scroller Methods
---------------------

### autoScroll

The function you set in the constructor options for `options.autoScroll`.

### destroy

Remove all event listeners needed to be able track the pointer.

About
-----

There are tons of reasons to have auto scrolling. The main one being sometimes a finger can't reach the mouse wheel comfortably. `dom-autoscroller` is a comfort module.

This is also a nice small module to do this kind of thing when auto scrolling is all you need.
