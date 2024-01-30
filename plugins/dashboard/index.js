exports.icon = 'ti ti-dashboard';
exports.name = '@(Dashboard)';
exports.position = 1;
exports.permissions = [];

exports.install = function() {
	ROUTE('+API    ?    -dashboard_online       --> Dashboard/online');
	ROUTE('+API    ?    -dashboard_referers     --> Dashboard/referers');
	ROUTE('+API    ?    -dashboard_browsers     --> Dashboard/browsers');
	ROUTE('+API    ?    -dashboard_stats        --> Dashboard/stats');
};
