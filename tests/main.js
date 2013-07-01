(function() {

    mocha.setup('tdd');

    var tests = Object.keys(window.__karma__.files).filter(function (file) {
      return /\.test\.js$/.test(file);
    });

    require({
      baseUrl: '/base/',
      deps: tests,
      callback: window.__karma__.start,
        shim: {
            'libs/jquery-1.9.1.min': {
                exports: '$',
            },
            'libs/underscore-min': {
                exports: '_'
            },
            'libs/bootstrap/js/bootstrap.min': {
                deps: ['libs/jquery-1.9.1.min']
            },
            'libs/backbone-min': {
                exports: 'Backbone',
                deps: ['libs/jquery-1.9.1.min', 'libs/underscore-min']
            },
            'libs/sinon-1.7.3': {
                exports: 'sinon'
            }
        },
        map: {
            '*': {
                'libs/sinon': 'libs/sinon-1.7.3'
            }
        }
    });

})();