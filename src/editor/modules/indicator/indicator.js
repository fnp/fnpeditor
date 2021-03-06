define([
'libs/jquery',
'libs/underscore',
'libs/text!./template.html'
], function($, _, template) {

'use strict';

return function(sandbox) {

    var view = {
        dom: $(_.template(template)())
    };

    return {
        start: function() { sandbox.publish('ready'); },
        getView: function() { return view.dom; },
        showMessage: function(msg) {
            view.dom.html('<span>' + msg + '</span>').show();
        },
        clearMessage: function(report) {
            view.dom.empty();
            if(report && report.message) {
                view.dom.html('<span class="success">' + report.message + '</span>').show().fadeOut(4000);
            }
        }
        
    };

};

});
