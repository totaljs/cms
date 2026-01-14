exports.icon = 'ti ti-cog';
exports.name = '@(Settings)';
exports.position = 100;
exports.permissions = [{ id: 'settings', name: 'Settings' }];
exports.visible = user => user.sa || user.permissions.includes('settings');
exports.divider = true;

NEWACTION('Settings|read', {
	name: 'Read settings',
	route: '+API ?',
	user: true,
	permissions: 'settings',
	action: function($) {

		var model = {};
		var language = $.user.language;

		for (let key in MAIN.db.config) {
			var val = MAIN.db.config[key];
			if (key !== 'user' && typeof(val) !== 'function')
				model[key] = val;
		}

		model.items = [];
		model.version = CONF.version;

		for (let key in Total.plugins) {

			let plugin = Total.plugins[key];
			let cfg = plugin.config;

			if (cfg) {
				var name = TRANSLATE(language, plugin.name);
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
					item.name = TRANSLATE(language, m.name);
					item.value = CONF[m.id];
					item.type = type;
					model.items.push(item);
				}
			}
		}

		$.callback(model);
	}
});

NEWACTION('Settings|save', {
	name: 'Save settings',
	route: '+API ?',
	user: true,
	input: 'name:String, url:URL, op:Boolean, op_reqtoken:String, op_restoken:String, totalapi:String, items:[*id:String, value:Object]',
	permissions: 'settings',
	action: function($, model) {

		for (var key in model) {
			if (key !== 'items')
				MAIN.db.config[key] = model[key];
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
		MAIN.db.save();

		$.success();
	}
});
