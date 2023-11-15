exports.icon = 'ti ti-layer-group';
exports.name = '@(Layouts)';
exports.position = 3;
exports.permissions = [{ id: 'layouts', name: 'Layouts' }];
exports.visible = user => user.sa || user.permissions.includes('layouts');
exports.import = 'routes.html';

exports.install = function() {
	ROUTE('+API    /admin/    -layouts_read/{id}          --> Layouts/read');
	ROUTE('+API    /admin/    -layouts_clone/{id}         --> Layouts/clone');
	ROUTE('+API    /admin/    -layouts_html/{id}          --> Layouts/HTML/read');
	ROUTE('+API    /admin/    -layouts_remove/{id}        --> Layouts/remove');
	ROUTE('+API    /admin/    -layouts_list               --> Layouts/list');
	ROUTE('+API    /admin/    +layouts_import             --> Layouts/import');
	ROUTE('+API    /admin/    +layouts_save_html          --> Layouts/HTML/save');
	ROUTE('+API    /admin/    +layouts_save               --> Layouts/save');
};
