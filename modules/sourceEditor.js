rng.modules.sourceEditor = function(sandbox) {

    return {
        start: function() {
            sandbox.publish('ready');
        },
        getView: function() {
            return $('<p>source editor</p>');
        }
    
    }
};