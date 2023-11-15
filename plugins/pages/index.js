exports.icon = 'ti ti-invoice';
exports.name = '@(Pages)';
exports.position = 2;
exports.import = 'routes.html';
exports.permissions = [{ id: 'pages', name: 'Pages' }];
exports.visible = user => user.sa || user.permissions.includes('pages');

exports.install = function() {
	ROUTE('+API    /admin/    -pages_list                --> Pages/list');
	ROUTE('+API    /admin/    -pages_read/{id}           --> Pages/read');
	ROUTE('+API    /admin/    -pages_remove/{id}         --> Pages/remove');
	ROUTE('+API    /admin/    -pages_clone/{id}          --> Pages/clone');
	ROUTE('+API    /admin/    +pages_save                --> Pages/save');
	ROUTE('+API    /admin/    -pages_links               --> Pages/links');
	ROUTE('+API    /admin/    -pages_html/{id}           --> Pages/HTML/read');
	ROUTE('+API    /admin/    -pages_copy/{from}/{to}    --> Pages/HTML/copy');
	ROUTE('+API    /admin/    +pages_save_html           --> Pages/HTML/save');
};
