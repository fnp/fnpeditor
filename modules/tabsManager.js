rng.modules.tabsManager = function(sandbox) {

    var $ = sandbox.$;
    
    var view = $(sandbox.getTemplate('main')());
    
    var tabContent = {};
    
    function selectTab(tabCode) {
        var tabBar = $(view, '#rng-main-tabs');
        var prevTabCode = tabBar.find('li.active a').attr('href').substr(1);
        tabBar.find('li').removeClass('active');
        tabBar.find('a[href=#' + tabCode + ']').parent().addClass('active');
        $(view, '.rng-tab-content').hide();
        $(view, '#rng-tab-content-' + tabCode).show();
    }
    
    $('#rng-main-tabs li a').click(function(e) {
        selectTab($(e.target).attr('href').substr(1));
    });
    
    return {
        start: function() {
            sandbox.publish('ready');
        },
        
        getView: function() {
            return view;
        },
        
        addTab: function(title, view) {
            tabContent[title] = view;
        }
    }

};