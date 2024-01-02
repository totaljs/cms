exports.icon = 'ti ti-copy';
exports.name = '@(Files)';
exports.position = 5;
exports.permissions = [{ id: 'files', name: 'Files' }];
exports.visible = user => user.sa || user.permissions.includes('files');

exports.install = function() {

	ROUTE('+POST    /admin/upload/          @upload <10MB    --> Files/insert');
	ROUTE('+POST    /admin/upload/base64/           <10MB    --> Files/insert');

	ROUTE('FILE     /download/*.*', files);

	ROUTE('+API     /admin/    -files_list           --> Files/list');
	ROUTE('+API     /admin/    -files_clear          --> Files/clear');
	ROUTE('+API     /admin/    -files_remove/{id}    --> Files/remove');

};

function checkmeta(meta) {
	return meta.custom && (meta.custom.public === true || meta.custom.public === 1);
}

function files($) {
	var id = $.split[1];
	id = id.substring(0, id.lastIndexOf('.'));
	$.filefs(MAIN.id, id, $.url.lastIndexOf('download=1') !== -1, null, null, checkmeta);
}