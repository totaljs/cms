NEWSCHEMA('Settings', function(schema) {

	schema.action('read', {
		name: 'Read settings',
		permissions: 'settings',
		action: async function($) {

			var model = {};
			var language = $.user.language;

			for (let key in PREF) {
				var val = PREF[key];
				if (key !== 'user' && typeof(val) !== 'function')
					model[key] = val;
			}

			model.items = [];

			for (let key in F.plugins) {

				let plugin = F.plugins[key];
				let cfg = plugin.config;

				if (cfg) {
					var name = TRANSLATOR(language, plugin.name);
					model.items.push({ type: 'group', name: name });
					for (let m of cfg) {
						var type = m.type;
						if (!type) {
							if (m.value instanceof Date)
								type = 'date';
							else
								type = typeof(m.value);
						}
						var item = CLONE(m);
						item.name = TRANSLATOR(language, m.name);
						item.value = CONF[m.id];
						item.type = type;
						model.items.push(item);
					}
				}

			}

			$.callback(model);
		}
	});

	schema.action('save', {
		name: 'Save settings',
		input: 'name:String, url:URL, mail_smtp:String, mail_smtp_options:JSON, mail_from:Email, icon:String, allow_tms:Boolean, secret_tms:String, op_reqtoken:String, op_restoken:String, totalapi:String, items:[*id:String, value:Object]',
		permissions: 'settings',
		action: function($, model) {

			for (var key in model) {
				if (key !== 'items')
					PREF.set(key, model[key]);
			}

			for (let m of model.items) {

				if (m.value instanceof Date) {
					m.value = m.value.toISOString();
					m.type = 'date';
				} else {
					if (m.value == null) {
						m.value = '';
						m.type = 'string';
					} else {
						var type = typeof(m.value);
						if (type === 'object') {
							type = 'json';
							m.value = JSON.stringify(m.value);
						} else
							m.value = m.value == null ? '' : m.value.toString();
						m.type = type;
					}
				}

				m.dtupdated = NOW;
				MAIN.db.config[m.id] = m.value;
			}

			FUNC.reconfigure();
			$.success();
		}
	});

	schema.action('test', {
		name: 'Test SMTP settings',
		input: 'mail_smtp:String, mail_smtp_options:JSON, mail_from:Email',
		permissions: 'settings',
		action: async function($, model) {

			var options = (model.mail_smtp_options || '').parseJSON();
			Mail.try(model.mail_smtp, options, $.done(true));
		}
	});

});