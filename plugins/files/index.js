exports.icon = 'ti ti-copy';
exports.name = '@(Files)';
exports.position = 5;
exports.permissions = [{ id: 'files', name: 'Files' }];
exports.visible = user => user.permissions.includes('files');

exports.install = function() {

	ROUTE('+POST    /upload/           +files_upload   *Files          --> insert', ['upload'], 1024 * 5);
	ROUTE('+POST    /upload/base64/    +files_base64   *Files          --> insert', 1024 * 5);
	ROUTE('FILE     /download/*.*',   files);

	ROUTE('API    /admin/    -files_list           *Files   --> list');
	ROUTE('API    /admin/    -files_clear          *Files   --> clear');
	ROUTE('API    /admin/    -files_remove/{id}    *Files   --> remove');

};

function checkmeta(meta) {
	return meta.custom && (meta.custom.public === true || meta.custom.public === 1);
}

function files(req, res) {
	var id = req.split[1];
	id = id.substring(0, id.lastIndexOf('.'));
	res.filefs(MAIN.id, id, req.url.lastIndexOf('download=1') !== -1, null, null, checkmeta);
}