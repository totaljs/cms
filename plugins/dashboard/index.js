exports.icon = 'ti ti-dashboard';
exports.name = '@(Dashboard)';
exports.position = 1;
exports.permissions = [];

ON('componentator', function(meta) {

	if (meta.name !== 'ui')
		return;

	if (!meta.components.includes('donutchart'))
		meta.components += ',donutchart';

	if (!meta.components.includes('statsbarsimple'))
		meta.components += ',statsbarsimple';

	if (!meta.components.includes('barchart'))
		meta.components += ',barchart';

	if (!meta.components.includes('stats24'))
		meta.components += ',stats24';

});

NEWACTION('Dashboard|online', {
	name: 'Online visitors',
	route: '+API ?',
	user: true,
	action: function($) {
		var data = MODS.visitors.today();
		data.memory = process.memoryUsage();
		data.performance = F.stats.performance;
		data.visitors = MODS.visitors.instance.visitors;
		$.callback(data);
	}
});

NEWACTION('Dashboard|referers', {
	name: 'Top referers',
	route: '+API ?',
	query: 'year:Number,month:Number',
	user: true,
	action: function($) {
		var year = $.query.year || NOW.getFullYear();
		var month = $.query.month;
		var builder = DATA.scalar('nosql/referers', 'group', 'name', 'count').where('year', year);
		month && builder.where('month', month);
		builder.callback(function(err, response) {
			response.quicksort('value', true);
			$.callback(response.take(24));
		});
	}
});

NEWACTION('Dashboard|browsers', {
	name: 'Top browsers',
	route: '+API ?',
	query: 'year:Number,month:Number',
	user: true,
	action: function($) {
		var year = $.query.year || NOW.getFullYear();
		var month = $.query.month;
		var builder = DATA.scalar('nosql/browsers', 'group', 'name', 'count').where('year', year);
		month && builder.where('month', month);
		builder.callback(function(err, response) {
			response.quicksort('value', true);
			$.callback(response.take(24));
		});
	}
});

NEWACTION('Dashboard|pages', {
	name: 'Top pages',
	route: '+API ?',
	query: 'year:Number,month:Number',
	user: true,
	action: function($) {
		var year = $.query.year || NOW.getFullYear();
		var month = $.query.month;
		var builder = DATA.scalar('nosql/pages', 'group', 'name', 'count').where('year', year);
		month && builder.where('month', month);
		builder.callback(function(err, response) {
			response.quicksort('value', true);
			$.callback(response.take(24));
		});
	}
});

NEWACTION('Dashboard|stats', {
	name: 'Stats',
	route: '+API ?',
	user: true,
	action: function($) {
		MODS.visitors.monthly(response => $.callback(response));
	}
});