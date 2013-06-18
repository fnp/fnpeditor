define(['libs/jquery-1.9.1.min', 'libs/underscore-min'], function($ ,_) {
    'use strict';
      
    var Layout = function(template) {
        var layout = this;
        this.dom = $(_.template(template)());
        this.views = {};
        
        this.dom.onShow = function() {
            _.values(layout.views).forEach(function(view) {
                if(view.onShow)
                    view.onShow();
            });
        };
        
    };
    
    Layout.prototype.setView = function(place, view) {
        this.dom.find('[fnpjs-place=' + place + ']').append(view);
        this.views[place] = view;
        if(this.dom.is(':visible') && view.onShow) {
            view.onShow();
        }
    };
    
    Layout.prototype.getAsView = function() {
        return this.dom
    };
    
    return {Layout: Layout};
});