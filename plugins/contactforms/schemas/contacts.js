NEWSCHEMA('ContactForms', function(schema) {

	schema.define('source', 'String(50)');
	schema.define('name', 'String(60)', true);
	schema.define('firstname', 'Capitalize(40)', true);
	schema.define('lastname', 'Capitalize(40)', true);
	schema.define('email', 'Email', true);
	schema.define('body', String, true);
	schema.define('phone', 'Phone');

	schema.required('firstname, lastname', m => !m.name);
	schema.required('name', m => !m.firstname && !m.lastname);

	schema.setQuery(function($) {
		var opt = $.options === EMPTYOBJECT ? $.query : $.options;
		var filter = NOSQL('contactforms').list();
		filter.paginate(opt.page, opt.limit, 100);
		opt.source && filter.gridfilter('source', opt, String);
		opt.email && filter.gridfilter('email', opt, String);
		opt.firstname && filter.gridfilter('firstname', opt, String);
		opt.lastname && filter.gridfilter('lastname', opt, String);
		opt.phone && filter.gridfilter('phone', opt, String);
		opt.dtcreated && filter.gridfilter('dtcreated', opt, Date);
		filter.fields('-body');
		filter.gridsort(opt.sort || 'dtcreated_desc');
		filter.callback($.callback);
	});

	schema.setGet(function($) {
		NOSQL('contactforms').one().where('id', $.id).callback($.callback, 'error-contacforms-404');
	});

	schema.setRemove(function($) {
		var user = $.user.name;
		var id = (($.body.id || '') + '').split(',');
		if (id.length)
			NOSQL('contactforms').remove().backup(user).log('Remove: ' + $.id, user).in('id', id).callback($.done());
		else
			$.success();
	});

	schema.setSave(function($) {

		var model = $.model;
		model.id = UID();
		model.ip = $.ip;
		model.browser = $.req.useragent();
		model.dtcreated = NOW;

		if (!model.name)
			model.name = model.lastname + ' ' + model.firstname;

		var nosql = NOSQL('contactforms');
		nosql.insert(model.$clean());
		nosql.counter.hit('all');
		$.success();

		EMIT('contacts.save', model);

		var builder = [];

		builder.push('<b>' + model.name.encode() + '</b>');
		builder.push(model.email);
		model.phone && builder.push(model.phone);
		builder.push('');
		builder.push(model.body);

		// Sends email
		LOGMAIL(PREF.emailcontactform, '📩 ' + CONF.name, builder.join('\n')).reply(model.email, true);

		// Events
		$SAVE('Events', { type: 'contactforms/add', user: $.user ? $.user.name : '', body: model.firstname + ' ' + model.lastname, id: model.id }, NOOP, $);
	});

	// Stats
	schema.addWorkflow('stats', function($) {
		NOSQL('contactforms').counter.monthly('all', $.callback);
	});
});