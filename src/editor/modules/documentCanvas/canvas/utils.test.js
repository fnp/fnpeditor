define([
'libs/jquery',
'libs/chai',
'modules/documentCanvas/canvas/utils'

], function($, chai, utils) {

'use strict';
/* jshint multistr:true */
/* global describe, it */


var expect = chai.expect;


describe('utils.nearestInDocumentOrder', function() {


    var tests = [
        ['return null if no match found',
            '<span>\
                <span></span>\
                <div id="b">\
                <span></span>\
            </span>'
        ],
        ['returns nearest sibling if applicable',
            '<div n1>\
                <div n2></div>\
                <div n3>\
                    <div id="a"></div>\
                    <div id="b"></div>\
                    <div id="c"></div>\
                </div>\
                <div n4></div>\
            </div>'
        ],
        ['looks inside siblings children',
            '<div>\
                <div></div>\
                <div>\
                    <div></div>\
                    <span>\
                        <div id="a"></div>\
                    </span>\
                    <div id="b"></div>\
                    <span>\
                        <div id="c"></div>\
                    </span>\
                    <div></div>\
                </div>\
                <div></div>\
            </div>'
        ]


    ];

    tests.forEach(function(test) {
        var description = test[0],
            html = test[1];
        it(description, function() {
            var dom = $(html),
                a = dom.find('#a').length ? dom.find('#a')[0] : null,
                b = dom.find('#b')[0],
                c = dom.find('#c').length ? dom.find('#c')[0] : null;
            expect(utils.nearestInDocumentOrder('div', 'above', b)).to.equal(a, 'above');
            expect(utils.nearestInDocumentOrder('div', 'below', b)).to.equal(c, 'below');
        });
    });

});

});
