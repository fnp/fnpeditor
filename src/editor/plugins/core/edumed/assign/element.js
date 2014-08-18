define(function(require) {
    
'use strict';


var _ = require('libs/underscore');

var elementBase = require('plugins/core/edumed/elementBase'),
    AssignExerciseView = require('./view');

var AssignExerciseElement = Object.create(elementBase);
_.extend(AssignExerciseElement, {
    init: function() {
        elementBase.init.call(this);
        
        this.view = new AssignExerciseView(this, this.wlxmlNode);
        this._container().append(this.view.dom);

        this.view.on('assignmentAdded', function() {

        }.bind(this));

        this.view.on('assignmentRemoved', function() {

        }.bind(this));


        var exerciseNode = this.wlxmlNode;
        this.createContainer(this.wlxmlNode.object.getDescription(), {
            resetBackground: true,
            manages: function(node, removedFrom) {
                if(exerciseNode.object.isList(node) || (removedFrom && exerciseNode.object.isList(removedFrom))) {
                    return false;
                }
                return exerciseNode.sameNode(node.parent() || removedFrom); 
            }.bind(),
            dom: this.view.dom.find('.description')
        });

        this.reloadView();
    },
    onNodeAdded: function(event) {
        var node = event.meta.node;
        if(this.wlxmlNode.object.isItemNode(node)) {
            this.reloadView();
        }
    },
    onNodeAttrChange: function(event) {
        void(event);
    },
    onNodeDetached: function(event) {
        if(this.wlxmlNode.object.isItemNode(event.meta.node, event.meta.parent)) {
            this.reloadView();
        }
    },
    reloadView: function() {
        this.view.clearItems();
        this.wlxmlNode.object.getSourceItems().forEach(function(item) {
            this.view.addSourceItem(item);
        }.bind(this));
        this.wlxmlNode.object.getDestinationItems().forEach(function(item) {
            this.view.addDestinationItem(item);
        }.bind(this));
    },
    getVerticallyFirstTextElement: function() {
        var toret;
        this.containers.some(function(container) {
            toret = container.getVerticallyFirstTextElement();
            return !!toret;
        });
        return toret;
    }
});

return {tag: 'div', klass: 'exercise.assign', prototype: AssignExerciseElement};

});
