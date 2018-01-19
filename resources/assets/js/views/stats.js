"use strict";

(function(root)
{
	var View = function()
	{
		if (!(this instanceof View))
			throw Error('View must be instanitated with `new`');

		this.pool_hashrate_chart = null;
		this.active_miners_chart = null;
		this.network_hashrate_chart = null;

		this.ajax = require('ajax-request');
		this.loading = false;

		this.registerHandlers();
	}

	View.prototype.registerHandlers = function()
	{
		$(document).ready(this.loadGraphsData.bind(this));
		window.setInterval(this.loadGraphsData.bind(this), 30000);

		$('.stats-view .stat-tabs li').click(this, this.handleTabs);
	}

	View.prototype.loadGraphsData = function()
	{
		if (this.loading)
			return;

		this.loading = true;

		var request = {
			'url': '/api/pool/stats/detailed',
			'method': 'GET',
			'encoding': 'utf-8',
			'headers': {
				'Accept': 'application/json',
			},
		};

		var self = this;

		this.ajax(request, function(error, response, body) {
			self.loading = false;

			if (error)
				return self.unableToLoadGraphsData();

			if (!response)
				return self.unableToLoadGraphsData();

			if (response.headers['content-type'] !== 'application/json')
				return self.unableToLoadGraphsData();

			var json;
			try {
				json = JSON.parse(body);
			} catch (error) {
				return self.unableToLoadGraphsData();
			}

			if (!json.pool_hashrate || !json.network_hashrate || !json.active_miners)
				return self.unableToLoadGraphsData();

			var load = self.loadChart.bind(self);
			load('pool_hashrate_chart', 'pool-hashrate', json.pool_hashrate);
			load('active_miners_chart', 'active-miners', json.active_miners);
			load('network_hashrate_chart', 'network-hashrate', json.network_hashrate);
		});
	}

	View.prototype.loadChart = function(property, selector, json)
	{
		$('.stats-view .chart-container.' + selector + ' .api').removeClass('is-loading');

		if (!this[property]) {
			this[property] = c3.generate({
				bindto: '.chart-container.' + selector + ' .chart',
				data: {
					json: json,
					x: 'x',
					xFormat: '%Y-%m-%d %H:%M'
				},
				axis: {
					x: {
						type: 'timeseries',
						tick: {
							format: '%Y-%m-%d %H:%M'
						}
					}
				}
			});
		} else {
			this[property].load({
				json: json,
			});
		}
	}

	View.prototype.unableToLoadGraphsData = function()
	{
		$('.stats-view .chart-container .api').removeClass('is-loading').text('?');
	}

	View.prototype.handleTabs = function(ev)
	{
		$('li', $(this).closest('ul')).removeClass('is-active');
		$(this).addClass('is-active');
		$('.stats-view .stats .chart-container').hide();
		$('.stats-view .stats .chart-container' + $(this).data('target')).show();

		ev.data.pool_hashrate_chart.resize();
		ev.data.active_miners_chart.resize();
		ev.data.network_hashrate_chart.resize();
	}

	module.exports = View;
})(this);