exports.icon = 'ti ti-cog';
exports.name = '@(Settings)';
exports.position = 100;
exports.permissions = [{ id: 'settings', name: 'Settings' }];
exports.visible = user => user.sa || user.permissions.includes('settings');

exports.install = function() {
	ROUTE('+API    ?    -settings_read    --> Settings/read');
	ROUTE('+API    ?    +settings_test    --> Settings/test');
	ROUTE('+API    ?    +settings_save    --> Settings/save');
};
