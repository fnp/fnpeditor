define(function(require) {
    
'use strict';


var $ = require('libs/jquery'),
    _ = require('libs/underscore'),
    documentElement = require('modules/documentCanvas/canvas/documentElement'),
    viewTemplate = require('libs/text!./view.html');

var OrderExerciceElement = Object.create(documentElement.DocumentNodeElement.prototype);
_.extend(OrderExerciceElement, {
    init: function() {
        documentElement.DocumentNodeElement.prototype.init.call(this);
        var view  = $(_.template(viewTemplate)());
        this._container().append(view);

        this.createContainer(this.wlxmlNode.contents(), {
            manages: function() {
                return true;
            },
            dom: view.find('.content')
        });

        this.addToContextMenu('core.createGap');
        this.contextMenuActions[0].on('actionExecuted', function(ret) {
            if(ret instanceof this.wlxmlNode.document.Fragment && ret.isValid()) {
                this.canvas.select(ret);
            }
        }.bind(this));
        this.addToContextMenu('core.removeGap');
    },
    getVerticallyFirstTextElement: function() {
        // doesnt container handle this?
        var toret;
        this.containers.some(function(container) {
            toret = container.getVerticallyFirstTextElement();
            return !!toret;
        });
        return toret;
    }
});

return {tag: 'div', klass: 'exercise.gap', prototype: OrderExerciceElement};

});


    



