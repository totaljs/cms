exports.icon = 'ti ti-layer-group';
exports.name = '@(Layouts)';
exports.position = 3;
exports.permissions = [{ id: 'layouts', name: 'Layouts' }];
exports.visible = user => user.sa || user.permissions.includes('layouts') || user.permissions.includes('admin');
exports.import = 'routes.html';

exports.install = function() {
	ROUTE('+API    ?    -layouts_list               --> Layouts/list');
	ROUTE('+API    ?    +layouts_read               --> Layouts/read');
	ROUTE('+API    ?    +layouts_clone              --> Layouts/clone');
	ROUTE('+API    ?    +layouts_html               --> Layouts/HTML/read');
	ROUTE('+API    ?    +layouts_remove             --> Layouts/remove');
	ROUTE('+API    ?    +layouts_import             --> Layouts/import');
	ROUTE('+API    ?    +layouts_save_html    <5MB  --> Layouts/HTML/save');
	ROUTE('+API    ?    +layouts_save               --> Layouts/save');
};
