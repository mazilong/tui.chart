/**
 * @fileoverview Column and Line Combo chart.
 * @author NHN Ent.
 *         FE Development Lab <dl_javascript@nhnent.com>
 */

'use strict';

var predicate = require('../helpers/predicate');
var calculator = require('../helpers/calculator');
var renderUtil = require('../helpers/renderUtil');
var ChartBase = require('./chartBase');
var ColumnChartSeries = require('../series/columnChartSeries');
var LineChartSeries = require('../series/lineChartSeries');
var AreaChartSeries = require('../series/areaChartSeries');

var verticalTypeComboMixer = {
    /**
     * Column and Line Combo chart.
     * @constructs verticalTypeComboMixer
     * @extends ChartBase
     * @param {Array.<Array>} rawData raw data
     * @param {object} theme chart theme
     * @param {object} options chart options
     */
    _initForVerticalTypeCombo: function(rawData, theme, options) {
        var chartTypesMap;

        chartTypesMap = this._makeChartTypesMap(rawData.series, options.yAxis, options.chartType);

        tui.util.extend(this, chartTypesMap);

        this.hasRightYAxis = tui.util.isArray(options.yAxis) && options.yAxis.length > 1;

        options.tooltip = options.tooltip || {};
        options.tooltip.grouped = true;

        ChartBase.call(this, {
            rawData: rawData,
            theme: theme,
            options: options,
            hasAxes: true,
            isVertical: true,
            seriesNames: chartTypesMap.seriesNames
        });

        /**
         * yAxis options map
         * @type {object}
         */
        this.yAxisOptionsMap = this._makeYAxisOptionsMap(chartTypesMap.chartTypes, options.yAxis);
        this._addComponents(chartTypesMap);
    },

    /**
     * Make yAxis options map.
     * @param {Array.<string>} chartTypes chart types
     * @param {?object} yAxisOptions yAxis options
     * @returns {{column: ?object, line: ?object}} options map
     * @private
     */
    _makeYAxisOptionsMap: function(chartTypes, yAxisOptions) {
        var optionsMap = {};
        yAxisOptions = yAxisOptions || {};
        tui.util.forEachArray(chartTypes, function(chartType, index) {
            optionsMap[chartType] = yAxisOptions[index] || yAxisOptions;
        });

        return optionsMap;
    },

    /**
     * Make chart types map.
     * @param {object} rawSeriesData raw series data
     * @param {object} yAxisOption option for y axis
     * @returns {object} chart types map
     * @private
     */
    _makeChartTypesMap: function(rawSeriesData, yAxisOption) {
        var seriesNames = tui.util.keys(rawSeriesData).sort();
        var optionChartTypes = this._getYAxisOptionChartTypes(seriesNames, yAxisOption);
        var chartTypes = optionChartTypes.length ? optionChartTypes : seriesNames;
        var validChartTypes = tui.util.filter(optionChartTypes, function(_chartType) {
            return rawSeriesData[_chartType].length;
        });
        var chartTypesMap;

        if (validChartTypes.length === 1) {
            chartTypesMap = {
                chartTypes: validChartTypes,
                seriesNames: validChartTypes,
                optionChartTypes: !optionChartTypes.length ? optionChartTypes : validChartTypes
            };
        } else {
            chartTypesMap = {
                chartTypes: chartTypes,
                seriesNames: seriesNames,
                optionChartTypes: optionChartTypes
            };
        }

        return chartTypesMap;
    },

    /**
     * Make data for adding series component.
     * @param {Array.<string>} seriesNames - series names
     * @returns {Array.<object>}
     * @private
     */
    _makeDataForAddingSeriesComponent: function(seriesNames) {
        var seriesClasses = {
            column: ColumnChartSeries,
            line: LineChartSeries,
            area: AreaChartSeries
        };
        var optionsMap = this._makeOptionsMap(seriesNames);
        var themeMap = this._makeThemeMap(seriesNames);
        var dataProcessor = this.dataProcessor;
        var serieses = tui.util.map(seriesNames, function(seriesName) {
            var chartType = dataProcessor.findChartType(seriesName);
            var data = {
                allowNegativeTooltip: true,
                chartType: chartType,
                seriesName: seriesName,
                options: optionsMap[seriesName],
                theme: themeMap[seriesName]
            };

            return {
                name: seriesName + 'Series',
                SeriesClass: seriesClasses[chartType],
                data: data
            };
        });

        return serieses;
    },

    /**
     * Add components
     * @param {object} chartTypesMap chart types map
     * @private
     */
    _addComponents: function(chartTypesMap) {
        var axes = [
            {
                name: 'yAxis',
                chartType: chartTypesMap.chartTypes[0],
                isVertical: true
            },
            {
                name: 'xAxis'
            }
        ];
        var serieses = this._makeDataForAddingSeriesComponent(chartTypesMap.seriesNames);

        if (chartTypesMap.optionChartTypes.length) {
            axes.push({
                name: 'rightYAxis',
                chartType: chartTypesMap.chartTypes[1],
                isVertical: true
            });
        }

        this._addComponentsForAxisType({
            chartType: this.options.chartType,
            seriesNames: chartTypesMap.seriesNames,
            axis: axes,
            series: serieses,
            plot: true
        });
    },

    /**
     * Get y axis option chart types.
     * @param {Array.<string>} chartTypes chart types
     * @param {object} yAxisOption - options for y axis
     * @returns {Array.<string>}
     * @private
     */
    _getYAxisOptionChartTypes: function(chartTypes, yAxisOption) {
        var resultChartTypes = chartTypes.slice();
        var yAxisOptions = [].concat(yAxisOption || []);
        var isReverse = false;
        var optionChartTypes;

        if (!yAxisOptions.length || (yAxisOptions.length === 1 && !yAxisOptions[0].chartType)) {
            resultChartTypes = [];
        } else if (yAxisOptions.length) {
            optionChartTypes = tui.util.map(yAxisOptions, function(option) {
                return option.chartType;
            });

            tui.util.forEachArray(optionChartTypes, function(chartType, index) {
                isReverse = isReverse || (chartType && resultChartTypes[index] !== chartType || false);
            });

            if (isReverse) {
                resultChartTypes.reverse();
            }
        }

        return resultChartTypes;
    },

    /**
     * Add Scale for y axis.
     * @param {string} name - axis name
     * @param {number} index - index of this.chartTypes
     * @param {boolean} isSingleYAxis - whether single y axis or not.
     * @private
     */
    _addYAxisScale: function(name, index, isSingleYAxis) {
        var chartType = this.chartTypes[index];
        var yAxisOption = this.yAxisOptionsMap[chartType];
        var dataProcessor = this.dataProcessor;
        var additionalParams = {
            isSingleYAxis: !!isSingleYAxis
        };

        if (isSingleYAxis && this.options.series) {
            tui.util.forEach(this.options.series, function(seriesOption, seriesName) {
                var _chartType;

                if (!seriesOption.stackType) {
                    return;
                }

                _chartType = dataProcessor.findChartType(seriesName);

                if (!predicate.isAllowedStackOption(_chartType)) {
                    return;
                }

                additionalParams.chartType = _chartType;
                additionalParams.stackType = seriesOption.stackType;
            });
        }

        this.scaleModel.addScale(name, yAxisOption, {
            areaType: 'yAxis',
            chartType: chartType
        }, additionalParams);
    },

    /**
     * Add scale data for y axis.
     * @private
     * @override
     */
    _addScaleDataForYAxis: function() {
        var isSingleYAxis = this.optionChartTypes.length < 2;
        this._addYAxisScale('yAxis', 0, isSingleYAxis);
        if (!isSingleYAxis) {
            this._addYAxisScale('rightYAxis', 1);
        }
    },

    /**
     * Increase yAxis tick count.
     * @param {number} increaseTickCount increase tick count
     * @param {object} yAxisData yAxis data
     * @private
     */
    _increaseYAxisTickCount: function(increaseTickCount, yAxisData) {
        var formatFunctions = this.dataProcessor.getFormatFunctions();
        var labels;

        yAxisData.limit.max += yAxisData.step * increaseTickCount;
        labels = calculator.makeLabelsFromLimit(yAxisData.limit, yAxisData.step);
        yAxisData.labels = renderUtil.formatValues(labels, formatFunctions, this.chartType, 'yAxis');
        yAxisData.tickCount += increaseTickCount;
        yAxisData.validTickCount += increaseTickCount;
    },

    /**
     * Update tick count to make the same tick count of y Axes(yAxis, rightYAxis).
     * @param {{yAxis: object, rightYAxis: object}} axesData - axesData
     * @private
     */
    _updateYAxisTickCount: function(axesData) {
        var yAxisData = axesData.yAxis;
        var rightYAxisData = axesData.rightYAxis;
        var tickCountDiff = rightYAxisData.tickCount - yAxisData.tickCount;

        if (tickCountDiff > 0) {
            this._increaseYAxisTickCount(tickCountDiff, yAxisData);
        } else if (tickCountDiff < 0) {
            this._increaseYAxisTickCount(-tickCountDiff, rightYAxisData);
        }
    },

    /**
     * Mix in.
     * @param {function} func target function
     * @ignore
     */
    mixin: function(func) {
        tui.util.extend(func.prototype, this);
    }
};


module.exports = verticalTypeComboMixer;