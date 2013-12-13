define([

], function() {
    
'use strict';



var names = {
    tag: {
        '': '-',
        section: 'sekcja',
        header: 'nagłówek',
        div: 'blok',
        span: 'tekst',
        aside: 'poboczny'
    },
    'class': {
        '': '-',
        author: 'autor',
        title: 'tytuł',
        cite: 'cytat',
        'cite.code': 'cytat.kod',
        'cite.code.xml': 'cytat.kod.xml',
        'list.items': 'lista',
        'list.items.enum': 'lista.numerowana',
        item: 'element',
        uri: 'uri',
        p: 'paragraf',
        footnote: 'przypis',
        todo: 'todo',
        emp: 'wyróżnienie'
    }
};

return {
    getLabel: function(of, name) {
        return (names[of] && (names[of][name] || name)) || '?';
    },
    getTagLabel: function(tagName) {
        return this.getLabel('tag', tagName);
    },
    getClassLabel: function(className) {
        return this.getLabel('class', className);
    }
};

});