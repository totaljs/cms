exports.icon = 'ti ti-selection';
exports.name = '@(Forms)';
exports.position = 5;
exports.permissions = [{ id: 'forms', name: 'Forms' }];
exports.visible = user => user.sa || user.permissions.includes('forms');
exports.config = [
	{ id: 'uibuildereditor', name: 'UI Builder editor', value: 'https://uibuilder.totaljs.com' }
];

exports.install = function() {

	ROUTE('+API    /admin/    -forms                --> Forms/list');
	ROUTE('+API    /admin/    +forms_save           --> Forms/save');
	ROUTE('+API    /admin/    +forms_read/{id}      --> Forms/read');
	ROUTE('+API    /admin/    +forms_publish        --> Forms/publish');
	ROUTE('+API    /admin/    +forms_remove/{id}    --> Forms/remove');

	ROUTE('POST  /render/', '#forms/render');
	ROUTE('GET   /render/{id}/', render);

};

ON('reload', function() {

	if (!MAIN.db.storage.forms)
		MAIN.db.storage.forms = [];

	// IMPORT widgets
	PLUGINS.widgets.create(PATH.plugins(exports.id + '/widget.html'), ERROR('Forms.widget'));

});

ON('componentator', function(meta) {
	if (meta.components.indexOf('uibuilder') === -1)
		meta.components += ',uibuilder';
});

async function render($) {
	var item = MAIN.db.storage.forms.findItem('id', $.params.id);
	if (item)
		$.filefs(MAIN.id, item.id + '_compiled');
	else
		$.jsonstring('{}');
}