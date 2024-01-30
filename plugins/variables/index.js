exports.icon = 'ti ti-variables';
exports.name = '@(Variables)';
exports.position = 6;
exports.permissions = [{ id: 'variables', name: 'Variables' }];
exports.visible = user => user.sa || user.permissions.includes('variables');

exports.install = function() {
	ROUTE('+API    ?    -variables_read    --> Variables/read');
	ROUTE('+API    ?    +variables_save    --> Variables/save');
};
