rng.modules.skelton = function(sandbox) {
    return {
        start: function() {
            sandbox.publish('ready');
        },
        setMainView: function(view) {
            sandbox.getDOM().html(view);
        }
    }
};