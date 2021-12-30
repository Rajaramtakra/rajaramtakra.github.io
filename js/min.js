var ex76 = {
    // variables
    l1w  : 358, // layer 1 width
    l1h  : 235, // layer 1 height
    l2w  : 441, // layer 2 width
    l3w  : 307, // layer 3 width

    // inner variables
    obj  : 0,
    xm   : 0,
    ym   : 0,
    x1 : 0,
    y1 : 0,
    x2 : 0,
    x3 : 0,

    // initialization
    init : function() {
        this.obj = document.getElementById('main_object');
        
        this.x2 = this.obj.clientWidth;
        this.x3 = -this.l3w;

        this.run();
    },

    // refreshing mouse positions
    mousemove : function(e) {
        this.xm = e.clientX;
        this.ym = e.clientY;

        // recalculation new positions
        this.x1 = this.xm - this.obj.offsetLeft - ex76.l1w/2;
        this.y1 = this.ym - this.obj.offsetTop - ex76.l1h/2;
    },

    // loop function
    run : function() {
        // shifting second layer object to left
        ex76.x2--;
        if (ex76.x2 < -ex76.l2w) ex76.x2 = ex76.obj.clientWidth;

        // shifting second layer object to right
        ex76.x3++;
        if (ex76.x3 > ex76.obj.clientWidth) ex76.x3 = -ex76.l3w;

        // updating background-position value with new positions
        ex76.obj.style.backgroundPosition = ex76.x1 + 'px ' + ex76.y1 + ', ' + ex76.x2 + 'px top, ' + ex76.x3 + 'px bottom, left top';

        // loop
        setTimeout(ex76.run, 20);
    }
};
 
window.onload = function() {
    ex76.init(); // initialization

    // binding mouse move event
    /*document.onmousemove = function(e) {
        if (window.event)
            e = window.event;
        ex76.mousemove(e);
    }*/
}