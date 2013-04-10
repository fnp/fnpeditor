rng.modules.skelton = function(sandbox) {
    
    var view = $(sandbox.getTemplate('main')());
    
    view.find('#rng-skelton-menu a').click(function(e) {
        e.preventDefault();
        sandbox.publish('cmd.' + $(e.target).attr('data-cmd'));
    });
    
    return {
        start: function() {
            sandbox.getDOM().append(view);
            sandbox.publish('ready');
        },
        setMainView: function(mainView) {
            view.find('#rng-skelton-mainView').html(mainView);
        }
    }
};