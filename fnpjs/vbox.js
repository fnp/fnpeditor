define(['libs/jquery-1.9.1.min', './layout'], function($, layout) {
    
    var VBox = function() {};
    
    VBox.prototype = new layout.Layout('<div class="fnpjs-vbox"></div>');
    VBox.prototype.appendView = function(view) {
        var item = $('<div>').addClass('fnpjs-vbox-item').append(view);
        this.dom.append(item);
    };
    
    return {VBox: VBox};
    
});