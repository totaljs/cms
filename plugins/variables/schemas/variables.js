NEWACTION('Variables/read', {
	name: 'Read variables',
	permissions: 'variables',
	action: function($) {
		$.callback(MAIN.db.vars);
	}
});

NEWACTION('Variables/save', {
	name: 'Save variables',
	input: 'vars:Object',
	permissions: 'variables',
	action: function($, model) {
		MAIN.db.vars = model.vars;
		FUNC.save();
		$.success();
	}
});