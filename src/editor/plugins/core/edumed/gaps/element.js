define(function(require) {
    
'use strict';


var $ = require('libs/jquery'),
    _ = require('libs/underscore'),
    elementBase = require('plugins/core/edumed/elementBase'),
    viewTemplate = require('libs/text!./view.html');

var OrderExerciceElement = Object.create(elementBase);
_.extend(OrderExerciceElement, {
    init: function() {
        elementBase.init.call(this);
        var view  = $(_.template(viewTemplate)());
        this._container().append(view);

        this.createContainer(this.wlxmlNode.contents(), {
            resetBackground: true,
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


    



