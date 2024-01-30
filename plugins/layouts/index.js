exports.icon = 'ti ti-layer-group';
exports.name = '@(Layouts)';
exports.position = 3;
exports.permissions = [{ id: 'layouts', name: 'Layouts' }];
exports.visible = user => user.sa || user.permissions.includes('layouts');
exports.import = 'routes.html';

exports.install = function() {
	ROUTE('+API    ?    -layouts_read/{id}          --> Layouts/read');
	ROUTE('+API    ?    -layouts_clone/{id}         --> Layouts/clone');
	ROUTE('+API    ?    -layouts_html/{id}          --> Layouts/HTML/read');
	ROUTE('+API    ?    -layouts_remove/{id}        --> Layouts/remove');
	ROUTE('+API    ?    -layouts_list               --> Layouts/list');
	ROUTE('+API    ?    +layouts_import             --> Layouts/import');
	ROUTE('+API    ?    +layouts_save_html    <5MB  --> Layouts/HTML/save');
	ROUTE('+API    ?    +layouts_save               --> Layouts/save');
};
