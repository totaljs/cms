NEWSCHEMA('Subscribers', function(schema) {

	schema.define('email', String, true);

	// Saves the model into the database
	schema.setSave(function($) {

		var model = $.model;
		var db = NOSQL('subscribers');
		var email = model.email.split(',');
		var ua = $.req ? $.req.useragent() : '';

		for (var i = 0; i < email.length; i++) {

			if (!email[i] || !email[i].isEmail())
				continue;

			var obj = {};
			obj.dtcreated = NOW;
			obj.ip = $.ip;
			obj.language = $.language;
			obj.unsubscribed = false;
			obj.email = email[i];
			obj.browser = ua;

			db.modify(obj, obj).where('email', obj.email).callback(function(err, count) {
				if (count) {
					if (email.length === 1)
						$SAVE('Events', { id: obj.email.hash(true) + '', type: 'subscribers/add', user: $.user ? $.user.name : '', body: obj.email }, console.log, $);
					EMIT('subscribers.save', obj);
					db.counter.hit('all', 1);
				}
			});
		}

		$.success();
	});

	// Gets listing
	schema.setQuery(function($) {

		var opt = $.options === EMPTYOBJECT ? $.query : $.options;
		var filter = NOSQL('subscribers').list();

		filter.paginate(opt.page, opt.limit, 100);
		opt.email && filter.gridfilter('email', opt, String);
		opt.language && filter.gridfilter('language', opt, String);
		opt.dtcreated && filter.gridfilter('dtcreated', opt, Date);
		filter.gridsort(opt.sort || 'dtcreated_desc');
		filter.callback($.callback);
	});

	// Removes user from DB
	schema.setRemove(function($) {
		var id = $.body.id;
		var user = $.user.name;
		NOSQL('subscribers').remove().backup(user).log('Remove: ' + id, user).where('email', id).callback(() => $.success());
	});

	// Performs download
	schema.addWorkflow('download', function($) {
		NOSQL('subscribers').find().fields('email').callback(function(err, response) {

			var builder = [];
			for (var i = 0, length = response.length; i < length; i++)
				builder.push('"' + response[i].email + '"');

			$.controller.content(builder.join('\n'), U.getContentType('csv'), { 'Content-Disposition': 'attachment; filename="subscribers.csv"' });
			$.cancel();
		});
	});

	schema.addWorkflow('toggle', function($) {
		var user = $.user.name;
		var arr = $.options.id ? $.options.id : $.query.id.split(',');
		NOSQL('subscribers').update(function(doc) {
			doc.unsubscribed = !doc.unsubscribed;
			return doc;
		}).log('Toggle: ' + arr.join(', '), user).in('email', arr).callback($.done());
	});

	schema.addWorkflow('unsubscribe', function($) {
		NOSQL('subscribers').modify({ unsubscribed: true, dtupdated: NOW }).where('email', $.query.email);
		$SAVE('Events', { type: 'subscribers/rem', user: $.user ? $.user.name : '', body: $.query.email }, NOOP, $);
		$.success();
	});

	// Clears DB
	schema.addWorkflow('clear', function($) {
		var user = $.user.name;
		NOSQL('subscribers').remove().backup(user).log('Clear all subscribers', user);
		$.success();
	});

	schema.addWorkflow('stats', function($) {
		NOSQL('subscribers').counter.monthly('all', $.callback);
	});
});