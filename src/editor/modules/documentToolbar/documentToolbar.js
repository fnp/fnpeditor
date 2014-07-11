define(['libs/jquery', 'libs/underscore', 'modules/documentToolbar/actionView', 'libs/text!./template.html'], function($, _, actionView, template) {

'use strict';


return function(sandbox) {
    
    var addedActions = [],
        contextParams = {},
        document, canvas;

    var view = {
        node: $(_.template(template)()),
        getOption: function(option) {
            return this.node.find('.rng-module-documentToolbar-toolbarOption[data-option=' + option +']').val();
        },
        addAction: function(group, actionDescription) {
            var action = sandbox.createAction(actionDescription.actionName, actionDescription.actionConfig),
                view;
            addedActions.push(action);
            view = actionView.create(action);
            
            _.pairs(contextParams).forEach(function(pair) {
                var name = pair[0],
                    value = pair[1];
                action.updateContextParam(name, value);
            });

            group.append(view.dom);
            view.on('actionExecuted', function(action, ret) {
                sandbox.publish('actionExecuted', action, ret);
            });

            view.on('hover', function() {
                sandbox.publish('actionHovered', action);
            });
            view.on('leave', function() {
                sandbox.publish('actionOff', action);
            });
        },
        addActionsGroup: function() {
            var div = $('<div>');
            div.addClass('rng-module-documentToolbar-toolbarGroup');
            this.node.append(div);
            return div;
        }
    };
    
    var setContextParam = function(what, ctx) {
        contextParams[what] = ctx;
        addedActions.forEach(function(action) {
            action.updateContextParam(what, contextParams[what]);
        });
    };

    sandbox.registerKeyHandler('keydown', function(e) {
        if(e.keyCode === 17) {
            addedActions.forEach(function(action) {
                action.updateKeyParam('ctrl', true);
            });
        }
    });
    sandbox.registerKeyHandler('keyup', function(e) {
        if(e.keyCode === 17) {
            addedActions.forEach(function(action) {
                action.updateKeyParam('ctrl', false);
            });
        }
    });

    return {
        start: function() {
            var config = sandbox.getConfig().toolbar || {};
            config.forEach(function(actionsGroup) {
                var group = view.addActionsGroup();
                actionsGroup.forEach(function(actionDescription) {
                    if(typeof actionDescription === 'string') {
                        actionDescription = {actionName: actionDescription, actionConfig: {}};
                    }
                    view.addAction(group, actionDescription);
                });
            });
            sandbox.publish('ready');
        },
        getView: function() { return view.node; },
        setDocumentFragment: function(fragment) {
            if(!document) {
                document = fragment.document;
                document.on('operationEnd', function() {
                    setContextParam('document', document);
                });
                setContextParam('document', document);
            }
            setContextParam('fragment', fragment);

        },
        setCanvas: function(_canvas) {
            setContextParam('canvas', _canvas);
            if(!canvas) {
                canvas = _canvas;
                canvas.on('changed', function() {
                    setContextParam('canvas', _canvas);
                });
            }
        },
        getOption: function(option) { return view.getOption(option); }
    };
};

});