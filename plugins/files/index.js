exports.icon = 'ti ti-copy';
exports.name = '@(Files)';
exports.position = 5;
exports.permissions = [{ id: 'files', name: 'Files' }];
exports.visible = user => user.sa || user.permissions.includes('files');

exports.install = function() {

	ROUTE('+POST    ?/upload/          @upload <10MB    --> Files/insert');
	ROUTE('+POST    ?/upload/base64/           <10MB    --> Files/insert');

	ROUTE('FILE     /download/*.*', files);

	ROUTE('+API     ?    -files_list           --> Files/list');
	ROUTE('+API     ?    -files_clear          --> Files/clear');
	ROUTE('+API     ?    -files_remove/{id}    --> Files/remove');

};

function checkmeta(meta) {
	return meta.custom && meta.custom.public ? true : false;
}

function files($) {
	var id = $.split[1];
	id = id.substring(0, id.lastIndexOf('.'));
	$.filefs(MAIN.id, id, $.url.lastIndexOf('download=1') !== -1, null, null, checkmeta);
}