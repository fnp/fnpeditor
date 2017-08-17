define(function(require) {
    
'use strict';


var $ = require('libs/jquery'),
    _ = require('libs/underscore'),
    elementBase = require('plugins/core/edumed/elementBase'),
    viewTemplate = require('libs/text!./view.html');

var MatchExerciseElement = Object.create(elementBase);
_.extend(MatchExerciseElement, {
    init: function() {
        elementBase.init.call(this);
        var view  = $(_.template(viewTemplate)());
        this._container().append(view);

        this.createContainer(this.wlxmlNode.contents(), {
            resetBackground: true,
            manages: function() {
                return true;
            }
        });
    }
});

return {tag: 'div', klass: 'exercise.match', prototype: MatchExerciseElement};

});
