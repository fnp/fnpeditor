define([
'libs/text!./templates/restoreDialog.html',
'libs/underscore',
'libs/backbone',
'libs/jquery'
], function(restoreDialogTemplate, _, Backbone, $) {

    var DialogView = Backbone.View.extend({
        template: _.template(restoreDialogTemplate),
        events: {
            'click .restore-btn': 'onSave',
            'click .cancel-btn': 'close',
            'click .close': 'close'
        },
        initialize: function() {
            _.bindAll(this);
            this.actionsDisabled = false;
        },
        show: function() {           
            this.setElement(this.template());
            this.$el.modal({backdrop: 'static'});
            this.$el.modal('show');
            this.$('textarea').focus();
        },
        onSave: function(e) {
            e.preventDefault();
            var view = this;
            this.trigger('restore', {
                data: {description: view.$el.find('textarea').val()},
                success: function() { view.actionsDisabled = false; view.close(); },
                error: function() { view.actionsDisabled = false; view.close(); },
            });
        },
        close: function(e) {
            if(e)
                e.preventDefault();
            if(!this.actionsDisabled) {
                this.$el.modal('hide');
                this.$el.remove();
            }
        },
        toggleButtons: function(toggle) {
            this.$('.btn, button').toggleClass('disabled', !toggle);
            this.$('textarea').attr('disabled', !toggle);
            this.actionsDisabled = !toggle;
        }
    });

    return {
        create: function() {
            return new DialogView();
        }
    };

});