(function() {

    mocha.setup('tdd');

    var tests = Object.keys(window.__karma__.files).filter(function (file) {
      return /\.test\.js$/.test(file);
    });

    require({
      baseUrl: '/base/',
      deps: tests,
      callback: window.__karma__.start
    });

})();