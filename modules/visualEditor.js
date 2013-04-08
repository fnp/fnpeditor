rng.modules.visualEditor = function(sandbox) {

    var data = sandbox.getBootstrappedData();
    var view = $(sandbox.getTemplate('main')({title: data.title, content: data.text}));
    

    return {
        start: function() {
            sandbox.publish('ready');
        },
        getView: function() {
            return view;
        }
    
    }
};