exports.icon = 'ti ti-book-open';
exports.name = '@(Posts)';
exports.position = 4;
exports.permissions = [{ id: 'posts', name: 'Posts' }];
exports.visible = user => user.sa || user.permissions.includes('posts') || user.permissions.includes('admin');

exports.install = function() {
	ROUTE('+API    ?    -posts                 --> Posts/list');
	ROUTE('+API    ?    +posts_read            --> Posts/read');
	ROUTE('+API    ?    +posts_create          --> Posts/create');
	ROUTE('+API    ?    +posts_update          --> Posts/update');
	ROUTE('+API    ?    +posts_remove          --> Posts/remove');
	ROUTE('+API    ?    -posts_clear           --> Posts/clear');
	ROUTE('+API    ?    -posts_categories      --> Posts/categories');
};

ON('reload', function() {
	// 7973 is a folder indentifier for the meta file
	exports.db = 'nosql/' + PATH.databases('fs-' + MAIN.id + '/7973/posts.nosql');
});