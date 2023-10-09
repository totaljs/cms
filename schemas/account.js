NEWSCHEMA('Account', function(schema) {

	schema.action('read', {
		name: 'Read account',
		action: function($) {
			var user = $.user;
			var obj = {};
			obj.id = user.id;
			obj.name = user.name;
			obj.sa = user.sa;
			obj.permissions = user.permissions;
			$.callback(obj);
		}
	});

});