/**
 * @fileoverview Bar chart.
 * @author NHN Ent.
 *         FE Development Lab <dl_javascript@nhnent.com>
 */

'use strict';

var ChartBase = require('./chartBase');
var chartConst = require('../const');
var axisTypeMixer = require('./axisTypeMixer');
var rawDataHandler = require('../models/data/rawDataHandler');
var predicate = require('../helpers/predicate');
var Series = require('../components/series/barChartSeries');

var BarChart = tui.util.defineClass(ChartBase, /** @lends BarChart.prototype */ {
    /**
     * className
     * @type {string}
     */
    className: 'tui-bar-chart',
    /**
     * Bar chart.
     * @constructs BarChart
     * @extends ChartBase
     * @mixes axisTypeMixer
     * @param {Array.<Array>} rawData raw data
     * @param {object} theme chart theme
     * @param {object} options chart options
     */
    init: function(rawData, theme, options) {
        rawDataHandler.updateRawSeriesDataByOptions(rawData, options.series);
        this._updateOptionsRelatedDiverging(options);

        ChartBase.call(this, {
            rawData: rawData,
            theme: theme,
            options: options,
            hasAxes: true
        });
    },

    /**
     * Update options related diverging option.
     * @param {object} options - options
     * @private
     */
    _updateOptionsRelatedDiverging: function(options) {
        var isCenter;

        options.series = options.series || {};

        /**
         * Whether has right y axis or not.
         * @type {boolean}
         */
        this.hasRightYAxis = false;

        if (options.series.diverging) {
            options.yAxis = options.yAxis || {};
            options.xAxis = options.xAxis || {};
            options.plot = options.plot || {};


            options.series.stackType = options.series.stackType || chartConst.NORMAL_STACK_TYPE;
            this.hasRightYAxis = tui.util.isArray(options.yAxis) && options.yAxis.length > 1;

            isCenter = predicate.isYAxisAlignCenter(this.hasRightYAxis, options.yAxis.align);

            options.yAxis.isCenter = isCenter;
            options.xAxis.divided = isCenter;
            options.series.divided = isCenter;
            options.plot.divided = isCenter;
        }
    },

    /**
     * Add components
     * @private
     */
    _addComponents: function() {
        var axes = [
            {
                name: 'yAxis',
                isVertical: true
            },
            {
                name: 'xAxis'
            }
        ];

        if (this.hasRightYAxis) {
            axes.push({
                name: 'rightYAxis',
                isVertical: true
            });
        }
        this._addComponentsForAxisType({
            axis: axes,
            series: [
                {
                    name: 'barSeries',
                    SeriesClass: Series
                }
            ],
            plot: true
        });
    },

    /**
     * Get scale option.
     * @returns {{xAxis: boolean}}
     * @private
     * @override
     */
    _getScaleOption: function() {
        return {
            xAxis: true
        };
    },

    /**
     * On change selected legend.
     * @param {Array.<?boolean> | {line: ?Array.<boolean>, column: ?Array.<boolean>}} checkedLegends checked legends
     */
    onChangeCheckedLegends: function(checkedLegends) {
        var boundParams;

        if (this.hasRightYAxis) {
            boundParams = {
                optionChartTypes: ['bar', 'bar']
            };
        }

        ChartBase.prototype.onChangeCheckedLegends.call(this, checkedLegends, null, boundParams);
    }
});

tui.util.extend(BarChart.prototype, axisTypeMixer);

module.exports = BarChart;
