exports.icon = 'ti ti-exchange';
exports.name = '@(Redirects)';
exports.position = 3;
exports.permissions = [{ id: 'redirects', name: 'Redirects' }];
exports.visible = user => user.sa || user.permissions.includes('redirects') || user.permissions.includes('admin');

exports.install = function() {
	ROUTE('+API    ?    -redirects_read               --> Redirects/read');
	ROUTE('+API    ?    -redirects_remove             --> Redirects/remove');
	ROUTE('+API    ?    -redirects_list               --> Redirects/list');
	ROUTE('+API    ?    +redirects_save               --> Redirects/save');
};
