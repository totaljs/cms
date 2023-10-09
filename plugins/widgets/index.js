exports.icon = 'ti ti-plug';
exports.name = '@(Widgets)';
exports.position = 4;
exports.permissions = [{ id: 'widgets', name: 'Widgets' }];
exports.visible = user => user.permissions.includes('widgets');

exports.install = function() {
	ROUTE('API    /admin/    +widgets_save           *Widgets   --> save');
	ROUTE('API    /admin/    -widgets_list           *Widgets   --> list');
	ROUTE('API    /admin/    -widgets_read/{id}      *Widgets   --> read');
	ROUTE('API    /admin/    -widgets_remove/{id}    *Widgets   --> remove');
	ROUTE('API    /admin/    -widgets_detail/{id}    *Widgets   --> detail');
};

