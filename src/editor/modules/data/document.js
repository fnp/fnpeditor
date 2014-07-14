define(function(require) {
    
'use strict';

/* globals gettext */

var _ = require('libs/underscore'),
    Dialog = require('views/dialog/dialog'),
    wlxml = require('wlxml/wlxml'),
    logging = require('fnpjs/logging/logging');


var logger = logging.getLogger('document');

var Document = function() {
    wlxml.WLXMLDocument.apply(this, Array.prototype.slice.call(arguments, 0));
    this.properties = {};
};
Document.prototype = Object.create(wlxml.WLXMLDocument.prototype);

_.extend(Document.prototype, {
    transaction: function(body, params) {
        params = params || {};
        var error = params.error;
        params.error = function(e) {
            logger.exception(e);

            var dialog = Dialog.create({
                title: gettext('Error'),
                text: gettext('Something wrong happend when applying this change so it was undone.'),
                executeButtonText: gettext('Close')
            });
            dialog.show();
            if(error) {
                error(e);
            }
            dialog.on('execute', function(e) {
                e.success();
            });
        }.bind(this);
        return wlxml.WLXMLDocument.prototype.transaction.call(this, body, params);
    },
    getUrlForLink: function(link) {
        var cfg = this.options.editorConfig;
        if(link.substr(0, 7) === 'file://' && cfg && cfg.documentAttachmentUrl) {
            link = cfg.documentAttachmentUrl(link.substr(7));
        }
        return link;
    },
    getLinkForUrl: function(url) {
        /* globals window */
        var baseUrl = function(url) {return url.split('/').slice(0,-1).join('/');};
        if(baseUrl(url) === baseUrl(window.location.origin + this.getUrlForLink('file://test'))) {
            return 'file://' + _.last(url.split('/'));
        }
        return url;
    },
    setProperty: function(propName, propValue) {
        if(this.properties[propName] !== propValue) {
            this.properties[propName] = propValue;
            this.trigger('propertyChanged', propName, propValue);
        }
    }
});

var DumbDocument = function() {
    Document.apply(this, Array.prototype.slice.call(arguments, 0));
};
DumbDocument.prototype = Object.create(Document.prototype);
_.extend(DumbDocument.prototype, {
    loadXML: function(xml) {
        this._xml = xml;
        this.trigger('contentSet');
    },
    toXML: function() {
        return this._xml;
    }
});

return {Document: Document, DumbDocument: DumbDocument};

});