exports.icon = 'ti ti-book-open';
exports.name = '@(Posts)';
exports.position = 4;
exports.permissions = [{ id: 'posts', name: 'Posts' }];
exports.visible = user => user.sa || user.permissions.includes('posts');

exports.install = function() {
	ROUTE('+API    /admin/    -posts                --> Posts/list');
	ROUTE('+API    /admin/    -posts_read/{id}      --> Posts/read');
	ROUTE('+API    /admin/    +posts_create         --> Posts/create');
	ROUTE('+API    /admin/    +posts_update/{id}    --> Posts/update');
	ROUTE('+API    /admin/    -posts_remove/{id}    --> Posts/remove');
	ROUTE('+API    /admin/    -posts_clear          --> Posts/clear');
	ROUTE('+API    /admin/    -posts_categories     --> Posts/categories');
};

ON('reload', function() {
	// 7973 is a folder indentifier for the meta file
	exports.db = 'nosql/' + PATH.databases('fs-' + MAIN.id + '/7973/posts.nosql');
});