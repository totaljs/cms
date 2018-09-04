const Fs = require('fs');
const filename = F.path.databases('settings.json');

NEWSCHEMA('SettingsKeyValue').make(function(schema) {
	schema.define('id', 'String(50)', true);
	schema.define('name', 'String(50)', true);
});

NEWSCHEMA('SuperUser').make(function(schema) {
	schema.define('id', 'String(15)');
	schema.define('name', String, true);
	schema.define('login', String, true);
	schema.define('password', String, true);
	schema.define('roles', '[String]');
});

NEWSCHEMA('Settings').make(function(schema) {

	schema.define('emailcontactform', 'Email', true);
	schema.define('emailreply', 'Email', true);
	schema.define('emailsender', 'Email', true);
	schema.define('url', 'Url', true);
	schema.define('templates', '[SettingsKeyValue]');
	schema.define('templatesposts', '[SettingsKeyValue]');
	schema.define('templatesnewsletters', '[SettingsKeyValue]');
	schema.define('posts', '[SettingsKeyValue]');
	schema.define('notices', '[SettingsKeyValue]');
	schema.define('navigations', '[SettingsKeyValue]');
	schema.define('users', '[SuperUser]');
	schema.define('signals', '[SettingsKeyValue]');
	schema.define('languages', '[SettingsKeyValue]');
	schema.define('smtp', 'String');
	schema.define('smtpoptions', 'JSON');
	schema.define('componentator', Boolean);

	// Saves settings into the file
	schema.setSave(function($) {

		var model = $.model;
		var settings = U.extend({}, model.$clean());

		if (settings.url.endsWith('/'))
			settings.url = settings.url.substring(0, settings.url.length - 1);

		settings.datebackup = F.datetime;

		NOSQL('settings_backup').insert(JSON.parse(JSON.stringify(settings)));
		settings.datebackup = undefined;

		// Writes settings into the file
		Fs.writeFile(filename, JSON.stringify(settings), function() {
			EMIT('settings.save', settings);
			$SAVE('Event', { type: 'settings', id: model.id, user: $.user.name, admin: true }, NOOP, $);
			$.success();
		});
	});

	// Gets settings
	schema.setGet(function($) {
		Fs.readFile(filename, function(err, data) {

			var settings = null;

			if (err) {
				settings = $.model;
				settings.currency = 'EUR';
				settings.currency_entity = '&euro;';
			} else
				settings = data.toString('utf8').parseJSON(true);

			$.callback(settings);
		});
	});

	schema.addHook('dependencies', function($) {

		var config = F.global.config;
		var obj = $.model;
		var keys = Object.keys(obj);

		// Clean default values in model
		for (var i = 0; i < keys.length; i++)
			obj[keys[i]] = undefined;

		obj.templatespages = config.templates;
		obj.navigations = config.navigations;
		obj.signals = config.signals;
		obj.templatesposts = config.templatesposts;
		obj.templatesnewsletters = config.templatesnewsletters;
		obj.posts = config.posts;
		obj.notices = config.notices;
		obj.languages = config.languages || EMPTYARRAY;

		$.callback();
	});

	// Tests SMTP
	schema.addWorkflow('smtp', function($) {
		var model = $.model;
		if (model.smtp)
			F.useSMTP(model.smtp, model.smtpoptions ? model.smtpoptions.parseJSON() : '', err => err ? $.invalid(err) : $.success());
		else
			$.success();
	});

	// Loads settings + rewrites framework configuration
	schema.addWorkflow('load', function($) {
		schema.get(null, function(err, settings) {

			F.global.config = settings;
			F.config.url = settings.url;

			// Refreshes internal informations
			!settings.users && (settings.users = []);

			// Adds an admin (service) account
			var sa = F.config['admin-superadmin'].split(':');
			settings.users.push({ name: 'Administrator', login: sa[0], password: sa[1], roles: [], sa: true });

			// Optimized for the performance
			var users = {};
			for (var i = 0, length = settings.users.length; i < length; i++) {
				var user = settings.users[i];
				var key = (user.login + ':' + user.password + ':' + F.config.secret + (user.login + ':' + user.password).hash()).md5();
				users[key] = user;
			}

			settings.users = users;

			// Rewrites internal framework settings
			F.config['mail-address-from'] = settings.emailsender;
			F.config['mail-address-reply'] = settings.emailreply;

			!settings.signals && (settings.signals = []);
			!settings.navigations && (settings.navigations = []);
			!settings.posts && (settings.posts = []);
			!settings.notices && (settings.notices = []);
			!settings.templates && (settings.templates = []);
			!settings.templatesnewsletters && (settings.templatesnewsletters = []);
			!settings.templatesposts && (settings.templatesposts = []);
			!settings.languages && (settings.languages = []);

			settings.smtp && F.useSMTP(settings.smtp, settings.smtpoptions.parseJSON());
			EMIT('settings', settings);
			$.success();

		});
	});
});