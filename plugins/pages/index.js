exports.icon = 'ti ti-invoice';
exports.name = '@(Pages)';
exports.position = 2;
exports.import = 'routes.html';
exports.permissions = [{ id: 'pages', name: 'Pages' }];
exports.visible = user => user.sa || user.permissions.includes('pages') || user.permissions.includes('admin');

exports.install = function() {
	ROUTE('+API    ?    -pages_list                --> Pages/list');
	ROUTE('+API    ?    +pages_read                --> Pages/read');
	ROUTE('+API    ?    +pages_remove              --> Pages/remove');
	ROUTE('+API    ?    +pages_clone               --> Pages/clone');
	ROUTE('+API    ?    +pages_save                --> Pages/save');
	ROUTE('+API    ?    +pages_links               --> Pages/links');
	ROUTE('+API    ?    +pages_html                --> Pages/HTML/read');
	ROUTE('+API    ?    +pages_copy                --> Pages/HTML/copy');
	ROUTE('+API    ?    +pages_save_html    <5MB   --> Pages/HTML/save');
};
