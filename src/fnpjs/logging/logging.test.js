define(function(require) {
    
'use strict';
/* global describe, it, beforeEach */
var chai = require('libs/chai'),
    logging = require('./logging.js'),
    expect = chai.expect;


// Global log object for defining expectations
var log = {
    _msgs: [],
    clear: function() {
        this._msgs = [];
    },
    append: function(msg) {
        this._msgs.push(msg);
    },
    contains: function(msg) {
        return this._msgs.indexOf(msg) !== -1;
    },
    getLast: function() {
        return this._msgs.length ? this._msgs[this._msgs.length] : undefined;
    },
    isEmpty: function() {
        return this._msgs.length === 0;
    },
    getMessages: function() {
        return this._msgs;
    }
};

// Loggin handler that just writes to the global logger object
var testLoggingHandler = function(msg) {
    log.append(msg);
};

describe('Logging', function() {
    

    beforeEach(function() {
        log.clear();
        logging.clearConfig();
    });

    var setConfig = function(loggerLevel, handlerLevel) {
        logging.setConfig({
            handlers: {
                testHandler: {
                    handler: testLoggingHandler,
                    level: handlerLevel
                }
            },
            loggers: {
                '': {
                    level: loggerLevel,
                    handlers: ['testHandler']
                }
            }
        });
    };

    it('works with sample config', function() {
        setConfig('debug', 'debug');
        var logger = logging.getLogger('some.name');
        logger.debug('debug msg');
        expect(log.contains('debug msg')).to.equal(true);
    });

    it('filters level on loggers', function() {
        setConfig('info', 'debug');
        var logger = logging.getLogger('some.name');
        logger.debug('debug msg');
        expect(log.isEmpty()).to.equal(true, 'debug message filtered out');
        logger.info('info msg');
        expect(log.contains('info msg')).to.equal(true, 'info message passed');
    });

    it('filters level on handlers', function() {
        setConfig('debug', 'info');
        var logger = logging.getLogger('some.name');
        logger.debug('debug msg');
        expect(log.isEmpty()).to.equal(true, 'debug message filtered out');
        logger.info('info msg');
        expect(log.contains('info msg')).to.equal(true, 'info message passed');
    });

    it('propagates message to upper logger depending on the propagate flag', function() {
        var config = {
                handlers: {
                    testHandler: {
                        handler: testLoggingHandler,
                        level: 'debug'
                    }
                },
                loggers: {
                    '': {
                        level: 'debug',
                        handlers: ['testHandler']
                    },
                    'logger1': {
                        level: 'debug',
                        handlers: ['testHandler']
                    }
                }
            },
            logger;

        config.loggers.logger1.propagate = false;
        logging.setConfig(config);

        logger = logging.getLogger('logger1');

        logger.debug('msg1');
        expect(log.contains('msg1')).to.equal(true, 'first message logged');
        expect(log.getMessages().length === 1).to.equal(true, 'logger didn\'t propagate its message');

        log.clear();
        config.loggers.logger1.propagate = true;
        logging.setConfig(config);

        logger.debug('msg2');
        expect(log.contains('msg2')).to.equal(true, 'second message logged');
        expect(log.getMessages().length === 2).to.equal(true, 'second message propagated to upper logger');
    });
});

});
