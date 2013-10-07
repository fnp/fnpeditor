(function() {

    mocha.setup('bdd');

    var tests = Object.keys(window.__karma__.files).filter(function (file) {
      return (/\.test\.js$/).test(file);
    });

    require({
      baseUrl: '/base/src/editor',
      deps: tests,
      callback: window.__karma__.start,

        paths: {
            'fnpjs': '../fnpjs',
            'libs': '../../libs',
            'smartxml': '../smartxml',
            'wlxml': '../wlxml'
        },

        map: {
            '*':
                {
                    'libs/jquery': '../../libs/jquery-1.9.1.min',
                    'libs/underscore': '../../libs/underscore-min',
                    'libs/bootstrap': '../../libs/bootstrap/js/bootstrap.min',
                    'libs/backbone': '../../libs/backbone-min',
                    'libs/sinon': '../../libs/sinon-1.7.3'
                }
        },

        shim: {
            '../../libs/jquery-1.9.1.min': {
                exports: '$',
            },
            '../../libs/underscore-min': {
                exports: '_'
            },
            '../../libs/bootstrap/js/bootstrap.min': {
                deps: ['libs/jquery']
            },
            '../../libs/backbone-min': {
                exports: 'Backbone',
                deps: ['libs/jquery', 'libs/underscore']
            },
            '../../libs/sinon-1.7.3': {
                exports: 'sinon'
            }
        }
    });

})();