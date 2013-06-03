define(['views/tabs/tabs'], function(tabsView) {

return function(sandbox) {
    
    var view = new tabsView.View();
    view.on('leaving', function(slug) {
        sandbox.publish('leaving', slug);
    });
    view.on('tabSelected', function(slug) {
        sandbox.publish('showed', slug);
    });
    
    return {
        start: function() {
            view.render();
            sandbox.publish('ready');
        },
        
        getView: function() {
            return view.$el;
        },
        
        addTab: function(title, slug, contentView) {
            view.addTab(title, slug, contentView);
                
        },
        getCurrentSlug: function() {
            return view.selectedTab;
        }
    }
};

});