define(function(require) {

    'use strict';

    var _ = require('libs/underscore'),
        Backbone = require('libs/backbone'),
        saveDialogTemplate = require('libs/text!./dialog.html'),
        fieldTemplates = {};
        fieldTemplates.checkbox = require('libs/text!./templates/checkbox.html');
        fieldTemplates.select = require('libs/text!./templates/select.html');
        fieldTemplates.textarea = require('libs/text!./templates/textarea.html');
        fieldTemplates.input = require('libs/text!./templates/input.html');



    var DialogView = Backbone.View.extend({
        template: _.template(saveDialogTemplate),
        events: {
            'click .save-btn': 'onSave',
            'click .cancel-btn': 'close',
            'click .close': 'close'
        },
        initialize: function() {
            _.bindAll(this);
            this.actionsDisabled = false;
        },
        show: function() {
            this.setElement(this.template(this.options));

            var body = this.$('.modal-body');
            this.options.fields.forEach(function(field) {
                var template = fieldTemplates[field.type];
                if(!template) {
                    throw new Error('Field type {type} not recognized.'.replace('{type}', field.type));
                }
                body.append(
                    _.template(template)(_.extend({description: ''}, field))
                );
            });

            this.$el.modal({backdrop: 'static'});
            this.$el.modal('show');
            this.$('textarea').focus();
        },
        onSave: function(e) {
            e.preventDefault();
            var view = this,
                formData = {};

            this.options.fields.forEach(function(field) {
                var widget = view.$('[name=' + field.name +']');
                formData[field.name] = widget.val();
            });

            this.trigger('save', {
                formData: formData,
                success: function() { view.actionsDisabled = false; view.close(); },
                error: function() { view.actionsDisabled = false; view.close(); },
            });
        },
        close: function(e) {
            if(e) {
                e.preventDefault();
            }
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
        create: function(config) {
            return new DialogView(config);
        }
    };

});