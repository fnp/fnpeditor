rng.modules.data = function(sandbox) {

    var doc = sandbox.getBootstrappedData().document;
    var document_id = sandbox.getBootstrappedData().document_id;

    
    if(doc === '') {
        doc = '<document>\n\
    <section\n\
        xmlns="http://nowoczesnapolska.org.pl/sst#"\n\
        xmlns:xlink="http://www.w3.org/1999/xlink"\n\
        xmlns:dc="http://purl.org/dc/elements/1.1/"\n\
        xmlns:dcterms="http://purl.org/dc/terms/"\n\
    >\n\
        <metadata>\n\
        </metadata>\n\
        <div class="p"></div>\n\
    </section>\n\
</document>';
    }
    
    
    function readCookie(name) {
        var nameEQ = escape(name) + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return unescape(c.substring(nameEQ.length, c.length));
        }
        return null;
    }
    
    $.ajaxSetup({
        crossDomain: false,
        beforeSend: function(xhr, settings) {
            if (!(/^(GET|HEAD|OPTIONS|TRACE)$/.test(settings.type))) {
                xhr.setRequestHeader("X-CSRFToken", readCookie('csrftoken'));
            }
        }
    });
    
    return {
        start: function() {
            sandbox.publish('ready');
        },
        getDocument: function() {
            return doc;
        },
        commitDocument: function(newDocument, reason) {
            doc = newDocument;
            sandbox.publish('documentChanged', doc, reason);
        },
        saveDocument: function() {
            $.ajax({
                method: 'post',
                url: '/' + gettext('editor') + '/' + document_id,
                data: JSON.stringify({document:doc})
            });
        }
        
    }

};