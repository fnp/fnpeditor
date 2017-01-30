define(function(require) {

    'use strict';

    var $ = require('libs/jquery'),
        _ = require('libs/underscore'),
        Backbone = require('libs/backbone'),
        dialogTemplate = require('libs/text!./dialog.html'),
        fieldTemplates = {};
        fieldTemplates.checkbox = require('libs/text!./templates/checkbox.html');
        fieldTemplates.select = require('libs/text!./templates/select.html');
        fieldTemplates.textarea = require('libs/text!./templates/textarea.html');
        fieldTemplates.input = require('libs/text!./templates/input.html');



    var DialogView = Backbone.View.extend({
        template: _.template(dialogTemplate),
        events: {
            'click .execute-btn': 'onExecute',
            'click .cancel-btn': 'onCancel',
            'click .close': 'close'
        },
        initialize: function() {
            _.bindAll(this);
            this.actionsDisabled = false;
        },
        show: function() {
            this.setElement(this.template(_.extend({
                executeButtonText: null,
                cancelButtonText: null,
                cssClass: '',
                closeButton: true
            }, this.options)));

            var body = this.$('.modal-body');
            (this.options.fields || []).forEach(function(field) {
                var template = fieldTemplates[field.type];
                if(!template) {
                    throw new Error('Field type {type} not recognized.'.replace('{type}', field.type));
                }
                var widget = $(_.template(template)(_.extend({description: '', initialValue: ''}, field)));

                body.append(widget);

                if(_.isFunction(field.prePasteHandler) && field.type === 'input') { // TODO: extract this out to widget specific impl.
                    widget.find('input').on('paste', function(e) {
                        var clipboardData = e.originalEvent.clipboardData;
                        if(!clipboardData || !clipboardData.getData) {
                            return;
                        }
                        e.preventDefault();
                        var text = clipboardData.getData('text/plain').replace(/\r?\n|\r/g, ' ');
                        $(e.target).val(field.prePasteHandler(text));
                    });
                }
            });

            if(this.options.text) {
                body.append('<p>' + this.options.text + '</p>');
            }

            this.$el.modal({backdrop: 'static'});
            this.$el.modal('show');
            this.$('textarea, input').first().focus();
        },
        onExecute: function(e) {
            e.preventDefault();
            var view = this,
                formData = {};

            (this.options.fields || []).forEach(function(field) {
                var widget = view.$('[name=' + field.name +']');
                formData[field.name] = widget.val();
            });

            this.trigger('execute', {
                formData: formData,
                success: function() { view.actionsDisabled = false; view.close(); },
                error: function() { view.actionsDisabled = false; view.close(); },
            });
        },
        onCancel: function() {
            this.trigger('cancel');
            this.close();
        },
        close: function(e) {
            if(e) {
                e.preventDefault();
            }
            if(!this.actionsDisabled) {
                this.$el.modal('hide');
                this.$el.remove();
            }
            this.trigger('close');
        },
        toggleButtons: function(toggle) {
            this.$('.btn, button').toggleClass('disabled', !toggle);
            this.$('textarea').attr('disabled', !toggle);
            this.actionsDisabled = !toggle;
        },
        setContentView: function(view) {
            var body = this.$('.modal-body');
            body.append(view);
        }
    });

    return {
        create: function(config) {
            return new DialogView(config);
        }
    };

});