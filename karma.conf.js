basePath = '';

files = [
  MOCHA,
  MOCHA_ADAPTER,
  REQUIRE,
  REQUIRE_ADAPTER,
  
  'vkbeautify.js',
  {pattern: 'libs/*.js', included: false},
  {pattern: 'fnpjs/**/*.js', included: false},
  {pattern: 'modules/**/*.js', included: false},
  {pattern: 'views/**/*.js', included: false},
  {pattern: 'fnpjs/**/*.html', included: false},
  {pattern: 'modules/**/*.html', included: false},
  {pattern: 'views/**/*.html', included: false},

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









