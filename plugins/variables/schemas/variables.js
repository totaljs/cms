NEWSCHEMA('Variables', function(schema) {

	schema.define('vars', Object);

	schema.action('read', {
		name: 'Read variables',
		permissions: 'variables',
		action: function($) {
			$.callback(MAIN.db.vars);
		}
	});

	schema.action('save', {
		name: 'Save variables',
		permissions: 'variables',
		action: function($, model) {

			MAIN.db.vars = model.vars;
			FUNC.save();
			$.success();
		}
	});

});