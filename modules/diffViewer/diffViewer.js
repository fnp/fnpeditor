define([
'libs/jquery-1.9.1.min',
'libs/underscore-min',
'views/tabs/tabs',
'libs/text!./diff.html'
], function($, _, tabs, diffTemplateSrc) {

'use strict';

return function(sandbox) {
    
    var dom = $('<div>').addClass('rng-module-diffViewer');
    var tabsView = (new tabs.View({position: 'right'})).render();
    dom.append(tabsView.getAsView());
    
    var DiffView = function() {
        this.dom = $(diffTemplateSrc);
    };
    
    DiffView.prototype.setTable = function(table) {
        this.dom.append(table);
    };
    

    return {
        start: function() {sandbox.publish('ready');},
        getView: function() {return dom;},
        setDiff: function(diff) {
            var diffView = new DiffView();
            diffView.setTable(diff.table);
            var slug = diff.ver1 + '-' + diff.ver2;
            tabsView.addTab(diff.ver1 + '->' + diff.ver2, slug, diffView.dom);
            tabsView.selectTab(slug);
        }
    };
};

});