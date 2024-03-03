NEWACTION('Dashboard/online', {
	name: 'Online visitors',
	action: function($) {
		var data = MODS.visitors.today();
		data.memory = process.memoryUsage();
		data.performance = F.stats.performance;
		data.visitors = MODS.visitors.instance.visitors;
		$.callback(data);
	}
});

NEWACTION('Dashboard/referers', {
	name: 'Top referers',
	query: 'year:Number,month:Number',
	action: function($) {
		var year = $.query.year || NOW.getFullYear();
		var month = $.query.month;
		var builder = DATA.scalar('nosql/referers', 'group', 'name', 'count').where('year', year);
		month && builder.where('month', month);
		builder.callback(function(err, response) {
			response.quicksort('count', true);
			$.callback(response.take(24));
		});
	}
});

NEWACTION('Dashboard/browsers', {
	name: 'Top browsers',
	query: 'year:Number,month:Number',
	action: function($) {
		var year = $.query.year || NOW.getFullYear();
		var month = $.query.month;
		var builder = DATA.scalar('nosql/browsers', 'group', 'name', 'count').where('year', year);
		month && builder.where('month', month);
		builder.callback(function(err, response) {
			response.quicksort('count', true);
			$.callback(response.take(24));
		});
	}
});

NEWACTION('Dashboard/pages', {
	name: 'Top pages',
	query: 'year:Number,month:Number',
	action: function($) {
		var year = $.query.year || NOW.getFullYear();
		var month = $.query.month;
		var builder = DATA.scalar('nosql/pages', 'group', 'name', 'count').where('year', year);
		month && builder.where('month', month);
		builder.callback(function(err, response) {
			response.quicksort('count', true);
			$.callback(response.take(24));
		});
	}
});

NEWACTION('Dashboard/stats', {
	name: 'Stats',
	action: function($) {
		MODS.visitors.monthly(function(response) {
			$.callback(response);
		});
	}
});