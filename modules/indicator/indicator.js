define([
'libs/jquery-1.9.1.min',
'libs/underscore-min',
'libs/text!./template.html'
], function($, _, template) {

'use strict';

return function(sandbox) {

    var view = {
        dom: $(_.template(template)()),
        setup: function() {
        
        }
    }

    return {
        start: function() { sandbox.publish('ready'); },
        getView: function() { return view.dom; },
        showMessage: function(msg) {
            view.dom.html('<span>' + msg + '</span>').show();
        },
        clearMessage: function() {
            view.dom.empty();
        }
        
    }

}

});
