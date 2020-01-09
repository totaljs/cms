exports.icon = 'fa fa-dashboard';
exports.name = 'Dashboard';
exports.position = 0;

exports.install = function() {
	ROUTE('GET    /admin/api/dashboard/',                    json_dashboard);
	ROUTE('GET    /admin/api/dashboard/referrers/',          json_dashboard_referrers);
	ROUTE('GET    /admin/api/dashboard/online/',             json_dashboard_online);
	ROUTE('GET    /admin/api/dashboard/tracking/             *Tracking --> @stats');
};

function json_dashboard_online() {
	var self = this;
	var data = MODULE('visitors').today();
	data.memory = process.memoryUsage();
	data.performance = F.stats.performance;
	self.json(data);
}

function json_dashboard() {
	MODULE('visitors').monthly(this.callback());
}

function json_dashboard_referrers() {
	NOSQL('visitors').counter.stats_sum(24, NOW.getFullYear(), this.callback());
}