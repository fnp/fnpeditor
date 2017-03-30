define(['libs/jquery', 'libs/underscore'], function($ ,_) {
    'use strict';
      
    var Layout = function(template, tutorial) {
        var layout = this;
        this.dom = $(_.template(template)({tutorial: tutorial}));
        this.views = {};
        
        this.dom.onShow = function() {
            _.values(layout.views).forEach(function(view) {
                if(view.onShow) {
                    view.onShow();
                }
            });
        };
        this.dom.onHide = function() {
            _.values(layout.views).forEach(function(view) {
                if(view.onHide) {
                    view.onHide();
                }
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
        return this.dom;
    };
    
    return {Layout: Layout};
});