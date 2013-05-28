define(function() {

return function(sandbox) {
    
    var view = $(sandbox.getTemplate('main')());
    
    view.find('#rng-skelton-menu button').click(function(e) {
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
        },
        showMessage: function(message) {
            view.find('#rng-skelton-messages').html('<span>'+message+'</span>').show();
        },
        clearMessage: function() {
            view.find('#rng-skelton-messages').empty().hide();
        },
        deactivateCommand: function(cmd) {
            view.find('[data-cmd='+cmd+']').addClass('disabled');
        },
        activateCommand: function(cmd) {
            view.find('[data-cmd='+cmd+']').removeClass('disabled');
        }
    }
};

});