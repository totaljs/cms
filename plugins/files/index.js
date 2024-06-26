exports.icon = 'ti ti-copy';
exports.name = '@(Files)';
exports.position = 5;
exports.permissions = [{ id: 'files', name: 'Files' }];
exports.visible = user => user.sa || user.permissions.includes('files');
exports.import = 'extensions.html';

exports.install = function() {

	// Uploading
	ROUTE('+POST    ?/upload/          @upload <10MB    --> Files/insert');
	ROUTE('+POST    ?/upload/base64/           <10MB    --> Files/insert');

	// API
	ROUTE('+API     ?    -files_list           --> Files/list');
	ROUTE('+API     ?    -files_rename         --> Files/rename');
	ROUTE('+API     ?    -files_clear          --> Files/clear');
	ROUTE('+API     ?    +files_remove         --> Files/remove');

	// Public
	ROUTE('FILE     /download/*.*', files);
};

function checkmeta(meta) {
	return meta.custom && meta.custom.public ? true : false;
}

function files($) {

	var id = $.split[1];
	var opt = {};

	id = id.substring(0, id.lastIndexOf('.'));

	opt.id = id;
	opt.download = $.url.lastIndexOf('download=1') !== -1;
	opt.check = checkmeta;

	if ($.query.s) {
		var size = +$.query.s;
		if (size > 0 && size > 10 && size < 80) {
			opt.cache = id + 'X' + size;
			opt.image = function(img) {
				img.resize(size + '%');
				img.quality(80);
				img.background('white');
				img.filter('Hamming');
				img.output('jpg');
			};
		}
	}

	Total.filestorage(MAIN.id).http($, opt);
}