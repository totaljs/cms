exports.icon = 'ti ti-dashboard';
exports.name = '@(Dashboard)';
exports.position = 1;
exports.permissions = [];

exports.install = function() {
	ROUTE('API    /admin/    -dashboard_online       *Dashboard   --> online');
	ROUTE('API    /admin/    -dashboard_referrers    *Dashboard   --> referrers');
	ROUTE('API    /admin/    -dashboard_stats        *Dashboard   --> stats');
};
