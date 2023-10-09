NEWSCHEMA('Settings', function(schema) {

	schema.action('read', {
		name: 'Read settings',
		permissions: 'settings',
		action: async function($) {

			var model = {};

			for (var key in PREF) {
				var val = PREF[key];
				if (key !== 'user' && typeof(val) !== 'function')
					model[key] = val;
			}

			$.callback(model);
		}
	});

	schema.action('save', {
		name: 'Save settings',
		input: 'name:String, url:URL, mail_smtp:String, mail_smtp_options:JSON, mail_from:Email, icon:String, allow_tms:Boolean, enterprise:Boolean, secret_tms:String, op_reqtoken:String, op_restoken:String, totalapi:String',
		permissions: 'settings',
		action: function($, model) {

			for (var key in model)
				PREF.set(key, model[key]);

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