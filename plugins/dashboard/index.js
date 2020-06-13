exports.icon = 'fa fa-dashboard';
exports.name = '@(Dashboard)';
exports.group = '@(Common)';
exports.position = 0;

exports.install = function() {
	ROUTE('GET    /admin/api/dashboard/',                    stats);
	ROUTE('GET    /admin/api/dashboard/referrers/',          referrers);
	ROUTE('GET    /admin/api/dashboard/online/',             online);
	ROUTE('GET    /admin/api/dashboard/tracking/             *Tracking --> @stats');
	ROUTE('GET    /admin/api/dashboard/clear/',              clear);
};

function online() {
	var self = this;
	var data = MODULE('visitors').today();
	data.memory = process.memoryUsage();
	data.performance = F.stats.performance;
	self.json(data);
}

function stats() {
	var self = this;
	var module = MODULE('visitors');
	module.monthly(function(response) {
		response.visitors = module.instance.visitors;
		self.json(response);
	});
}

function referrers() {
	var self = this;
	COUNTER('visitors').summarize('yearly').where('year', NOW.getFullYear()).callback(function(err, response) {
		response.quicksort('sum', true);
		self.json(response.take(24));
	});
}

function clear() {
	var self = this;
	var db = ['pages', 'posts', 'products', 'newsletters', 'subscribers', 'contactforms'];
	var id = self.query.id || 'today';
	var date = id === 'today' ? NOW.format('yyyy-MM-dd') : id === 'month' ? NOW.format('yyyy-MM') : id === 'year' ? NOW.format('yyyy') : id === 'all' ? null : 'today';
	// db.wait((name, next) => COUNER(name).reset(null, null, date, next));
	// @TODO: missing implementation
	self.success();
}