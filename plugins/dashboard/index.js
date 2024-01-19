exports.icon = 'ti ti-dashboard';
exports.name = '@(Dashboard)';
exports.position = 1;
exports.permissions = [];

exports.install = function() {
	ROUTE('+API    /admin/    -dashboard_online        --> Dashboard/online');
	ROUTE('+API    /admin/    -dashboard_referers      --> Dashboard/referers');
	ROUTE('+API    /admin/    -dashboard_browsers      --> Dashboard/browsers');
	ROUTE('+API    /admin/    -dashboard_stats         --> Dashboard/stats');
};
