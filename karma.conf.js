basePath = '';

files = [
  MOCHA,
  MOCHA_ADAPTER,
  REQUIRE,
  REQUIRE_ADAPTER,
  
  'libs/vkbeautify.js',
  {pattern: 'libs/*.js', included: false},
  {pattern: 'src/**/*.js', included: false},
  {pattern: 'src/**/*.html', included: false},
  'tests/main.js',
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









