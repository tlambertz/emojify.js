require('jsdom-global')()

global.assert = require('chai').assert
global.emojify = require('../dist/js/index.min')
