define(function(require) {
    
'use strict';


var $ = require('libs/jquery'),
    _ = require('libs/underscore'),
    elementBase = require('plugins/core/edumed/elementBase'),
    genericElement = require('modules/documentCanvas/canvas/genericElement'),
    viewTemplate = require('libs/text!./view.html'),
    tipTemplate = require('libs/text!./tip.html');

var AnswerElement = Object.create(genericElement);
_.extend(AnswerElement, {
    init: function() {
        genericElement.init.call(this);
        this.tip = $(tipTemplate);
        this.tip.text(this.wlxmlNode.getAttr('answer') || '');
        this.tip.on('click', function(e) {
            var doc = this.wlxmlNode.document,
                textNode = this.wlxmlNode.contents()[0];
            e.preventDefault();
            e.stopPropagation();

            if(textNode) {
                this.canvas.select(doc.createFragment(doc.CaretFragment, {node:textNode, offset: textNode.getText().length}));
                this.canvas.showContextMenu(this, {x: e.clientX, y: e.clientY});
            }
        }.bind(this));
        this.addWidget(this.tip);
    },
    onNodeAttrChange: function(event) {
        if(event.meta.attr === 'answer') {
            this.tip.text(event.meta.newVal || '');
        }
    }
});

var ReplaceExerciseElement = Object.create(elementBase);
_.extend(ReplaceExerciseElement, {
    init: function() {
        elementBase.init.call(this);
        var view  = $(_.template(viewTemplate)());
        this._container().append(view);


        this.elementsRegister.register(
            {tag: 'span', klass: 'answer', prototype: AnswerElement}
        );

        this.createContainer(this.wlxmlNode.contents(), {
            resetBackground: true,
            manages: function() {
                return true;
            },
            dom: view.find('.content')
        });

        this.addToContextMenu('core.markToReplace');
        this.contextMenuActions[0].on('actionExecuted', function(ret) {
            if(ret instanceof this.wlxmlNode.document.Fragment && ret.isValid()) {
                this.canvas.select(ret);
            }
        }.bind(this));
        this.addToContextMenu('core.editReplaceMark');
        this.addToContextMenu('core.removeReplaceMark');

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

return {tag: 'div', klass: 'exercise.replace', prototype: ReplaceExerciseElement};

});


    



