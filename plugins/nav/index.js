exports.icon = 'ti ti-align-justify';
exports.name = '@(Navigation)';
exports.position = 3;
exports.permissions = [{ id: 'navigation', name: 'Navigation' }];
exports.visible = user => user.permissions.includes('navigation');

exports.install = function() {
	ROUTE('API    /admin/    +nav_save           *Nav   --> save');
	ROUTE('API    /admin/    -nav_list           *Nav   --> list');
	ROUTE('API    /admin/    -nav_read/{id}      *Nav   --> read');
	ROUTE('API    /admin/    -nav_remove/{id}    *Nav   --> remove');
	ROUTE('API    /admin/    -nav_editor         *Nav   --> editor');
};