define([], function() {
    
'use strict';

var wlxmlDict = {
    'uri': {
        'uri': 'string'
    }
};

var hasMetaAttr = function(klass, attrName, dict) {
    dict = dict || wlxmlDict;
    if(!klass)
        return false;

    var parts = klass.split('-');
    var partialClass = '';
    for(var i = 0; i < parts.length; i++) {
        partialClass += (partialClass === '' ? '' : '-') + parts[i];
        if(dict[partialClass] && dict[partialClass][attrName])
            return true;
    }
    return false;
};

var getMetaAttrsList = function(klass, dict) {
    dict = dict || wlxmlDict;
    klass = klass || '';

    var toret = {own: [], inheritedFrom: {}, all: []};
    var parts = klass.split('-');
    var partialClass = '';
    
    var generate = function(klass) {
        var toret = [],
            desc = dict[klass];

        if(!desc)
            return toret;
        
        _.keys(desc).forEach(function(key) {
            toret.push({name: key, type: desc[key]});
        });
        return toret;
    };

    toret.own = generate(klass);
    for(var i = 0; i < parts.length; i++) {
        partialClass += (partialClass === '' ? '' : '-') + parts[i];
        var list = generate(partialClass);
        if(list.length > 0) {
            toret.inheritedFrom[partialClass] = generate(partialClass);
            toret.all = toret.all.concat(toret.inheritedFrom[partialClass]);
        }
    }
    return toret;
};

return {
    hasMetaAttr: hasMetaAttr,
    getMetaAttrsList: getMetaAttrsList
};

});