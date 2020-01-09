NEWSCHEMA('SettingsKeyValue', function(schema) {
	schema.define('id', 'String(50)', true);
	schema.define('name', 'String(50)', true);
});

NEWSCHEMA('Settings/SuperUser', function(schema) {
	schema.define('id', 'String(15)');
	schema.define('name', String, true);
	schema.define('login', String, true);
	schema.define('password', String, true);
	schema.define('roles', '[String]');
});

NEWSCHEMA('Settings', function(schema) {

	schema.define('emailcontactform', 'Email', true);
	schema.define('emailreply', 'Email', true);
	schema.define('emailsender', 'Email', true);
	schema.define('url', 'Url', true);
	schema.define('templates', '[SettingsKeyValue]');
	schema.define('templatesposts', '[SettingsKeyValue]');
	schema.define('templatesnewsletters', '[SettingsKeyValue]');
	schema.define('posts', '[SettingsKeyValue]');
	schema.define('notices', '[SettingsKeyValue]');
	schema.define('users', '[Settings/SuperUser]');
	schema.define('signals', '[SettingsKeyValue]');
	schema.define('languages', '[SettingsKeyValue]');
	schema.define('smtp', String);
	schema.define('smtpoptions', 'JSON');
	schema.define('componentator', Boolean);
	schema.define('cookie', 'String(30)', true);

	schema.setGet(function($) {
		$.callback(PREF);
	});

	// Saves settings into the file
	schema.setSave(function($) {

		var model = $.clean();
		var keys = Object.keys(model);

		if (model.url.endsWith('/'))
			model.url = model.url.substring(0, model.url.length - 1);

		for (var i = 0; i < keys.length; i++)
			PREF.set(keys[i], model[keys[i]]);

		model.dtbackup = F.datetime;
		NOSQL('settings_backup').insert(JSON.parse(JSON.stringify(model)));
		model.dtbackup = undefined;

		EMIT('settings.save', PREF);
		$SAVE('Events', { type: 'settings', id: model.id, user: $.user.name, admin: true }, NOOP, $);
		$.success();
	});

	schema.addHook('dependencies', function($) {

		var obj = $.model;
		var keys = Object.keys(obj);

		// Clean default values in model
		for (var i = 0; i < keys.length; i++)
			obj[keys[i]] = undefined;

		obj.templatespages = PREF.templates;
		obj.navigations = PREF.navigations;
		obj.signals = PREF.signals;
		obj.templatesposts = PREF.templatesposts;
		obj.templatesnewsletters = PREF.templatesnewsletters;
		obj.posts = PREF.posts;
		obj.notices = PREF.notices;
		obj.languages = PREF.languages || EMPTYARRAY;
		$.callback();
	});

	// Tests SMTP
	schema.addWorkflow('smtp', function($) {
		var model = $.model;
		if (model.smtp)
			Mail.use(model.smtp, model.smtpoptions ? model.smtpoptions.parseJSON() : '', err => err ? $.invalid(err) : $.success());
		else
			$.success();
	});

	// Loads settings + rewrites framework configuration
	schema.addWorkflow('load', function($) {

		if (!PREF.url) {
			// tries to load older settings
			try {
				var data = require('fs').readFileSync(PATH.databases('settings.json')).toString('utf8').parseJSON(true);
				var keys = Object.keys(data);
				for (var i = 0; i < keys.length; i++)
					PREF.set(keys[i], data[keys[i]]);
			} catch (e) {
				// empty
			}
		}

		CONF.url = PREF.url;
		MAIN.users = [];
		CONF.admin_cookie = PREF.cookie || '__admin';

		// Refreshes internal informations
		if (PREF.users && PREF.users.length)
			MAIN.users.push.apply(MAIN.users, PREF.users);

		// Adds an admin (service) account
		var sa = (CONF.admin_superadmin || '').split(':');
		MAIN.users.push({ name: 'Administrator', login: sa[0], password: sa[1], roles: [], sa: true });

		// Optimized for the performance
		var users = {};
		for (var i = 0, length = MAIN.users.length; i < length; i++) {
			var user = MAIN.users[i];
			var key = (user.login + ':' + user.password + ':' + CONF.secret + (user.login + ':' + user.password).hash() + CONF.admin_secret).md5();
			users[key] = user;
		}

		MAIN.users = users;

		// Rewrites internal framework settings
		CONF.mail_address_from = PREF.emailsender;
		CONF.mail_address_reply = PREF.emailreply;

		!PREF.signals && PREF.set('signals', []);
		!PREF.navigations && PREF.set('navigations', []);
		!PREF.notices && PREF.set('notices', []);
		!PREF.languages && PREF.set('languages', []);
		PREF.smtp && Mail.use(PREF.smtp, PREF.smtpoptions.parseJSON());

		EMIT('settings', PREF);
		$.success();
	});
});

ON('ready', function() {
	setTimeout(function() {
		$WORKFLOW('Settings', 'load');
	}, 500);
});