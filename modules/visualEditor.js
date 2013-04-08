rng.modules.visualEditor = function(sandbox) {

    return {
        start: function() {
            sandbox.publish('ready');
        },
        getView: function() {
            return $('<p>visual editor</p>');
        }
    
    }
};