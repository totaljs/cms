NEWSCHEMA('Dashboard', function(schema) {

	schema.action('online', {
		name: 'Online visitors',
		action: function($) {
			var data = MODULE('visitors').today();
			data.memory = process.memoryUsage();
			data.performance = F.stats.performance;
			$.callback(data);
		}
	});

	schema.action('referrers', {
		name: 'Referrers',
		query: 'year:Number',
		action: function($) {
			var year = $.query.year || NOW.getFullYear();
			COUNTER('visitors').summarize('yearly').where('year', year).callback(function(err, response) {
				response.quicksort('sum', true);
				$.callback(response.take(24));
			});
		}
	});

	schema.action('stats', {
		name: 'Stats',
		action: function($) {
			var mod = MODULE('visitors');
			mod.monthly(function(response) {
				response.visitors = mod.instance.visitors;
				$.callback(response);
			});
		}
	});

});