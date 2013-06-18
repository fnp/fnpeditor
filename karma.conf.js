basePath = '';

files = [
  MOCHA,
  MOCHA_ADAPTER,
  /*REQUIRE,
  REQUIRE_ADAPTER*/
  'libs/chai.js',
  'libsjquery-1.9.1.min.js',
  'modules/documentCanvas/tests/tests_transform.js'
  
];

reporters = ['progress'];

port = 9876;
runnerPort = 9100;
captureTimeout = 60000;

autoWatch = true;
singleRun = false;

browsers = ['PhantomJS'];

colors = true;
logLevel = LOG_INFO;









