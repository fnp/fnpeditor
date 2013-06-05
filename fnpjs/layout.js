define(['libs/jquery-1.9.1.min', 'libs/underscore-min'], function($ ,_) {
    'use strict';
      
    var Layout = function(template) {
        this.dom = $(_.template(template)());
        
    };
    
    Layout.prototype.setView = function(place, view) {
        this.dom.find('[fnpjs-place=' + place + ']').append(view);
    };
    
    Layout.prototype.getAsView = function() {
        return this.dom
    };
    
    return {Layout: Layout};
});