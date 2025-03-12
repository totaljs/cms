exports.icon = 'ti ti-align-justify';
exports.name = '@(Navigation)';
exports.position = 3;
exports.permissions = [{ id: 'navigation', name: 'Navigation' }];
exports.visible = user => user.sa || user.permissions.includes('navigation') || user.permissions.includes('admin');

exports.install = function() {
	ROUTE('+API    ?    -nav_list          --> Nav/list');
	ROUTE('+API    ?    +nav_save          --> Nav/save');
	ROUTE('+API    ?    +nav_read          --> Nav/read');
	ROUTE('+API    ?    +nav_remove        --> Nav/remove');
	ROUTE('+API    ?    -nav_editor        --> Nav/editor');
};