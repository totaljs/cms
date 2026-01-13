exports.icon = 'ti ti-variables';
exports.name = '@(Variables)';
exports.position = 6;
exports.permissions = [{ id: 'variables', name: 'Variables' }];
exports.visible = user => user.sa || user.permissions.includes('variables') || user.permissions.includes('admin');

NEWACTION('Variables|read', {
	name: 'Read variables',
	route: '+API ?',
	permissions: 'variables,admin',
	user: true,
	action: function($) {
		$.callback(MAIN.cms.db.vars);
	}
});

NEWACTION('Variables|save', {
	name: 'Save variables',
	route: '+API ?',
	input: 'vars:Object',
	permissions: 'variables,admin',
	user: true,
	action: function($, model) {
		let cms = MAIN.cms;
		cms.db.vars = model.vars;
		cms.save();
		$.success();
	}
});
