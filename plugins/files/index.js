exports.icon = 'ti ti-copy';
exports.name = '@(Files)';
exports.position = 5;
exports.permissions = [{ id: 'files', name: 'Files' }];
exports.visible = user => user.sa || user.permissions.includes('files') || user.permissions.includes('admin');
exports.import = 'extensions.html';

exports.install = function() {

	// Uploading
	ROUTE('+POST    ?/upload/          @upload <10MB    --> Files|insert');
	ROUTE('+POST    ?/upload/base64/           <10MB    --> Files|insert');

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
	opt.download = $.query.download == '1';
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

	Total.filestorage(MAIN.cms.id).http($, opt);
}

NEWACTION('Files', {
	route: '+API ?',
	user: true,
	action: function($) {
		MAIN.cms.db.fs.browse2(function(err, response) {
			var arr = [];
			for (var file of response) {
				if (file.custom && file.custom.public)
					arr.push(file);
			}
			$.callback(arr);
		});
	}
});

NEWACTION('Files|insert', {
	name: 'Insert files',
	route: '+API ?',
	query: 'name:String',
	input: 'data:DataURI',
	user: true,
	action: function($, model) {

		let response = [];

		// Base64
		if (model.data) {

			let data = model.data;
			let ext;

			switch (data.type) {
				case 'image/png':
					ext = 'png';
					break;
				case 'image/jpeg':
					ext = 'jpg';
					break;
				case 'image/gif':
					ext = 'gif';
					break;
				default:
					$.callback(response);
					return;
			}

			let meta = {};
			meta.id = UID();
			meta.size = data.buffer.length;
			meta.type = data.type;
			meta.ext = ext;
			meta.name = ($.query.name || (U.random_string(10) + '_base64')).replace(/\.[0-9a-z]+$/i, '').max(40) + '.' + ext;
			meta.url = '/download/' + meta.id + '.' + meta.ext;
			response.push(meta);
			MAIN.cms.db.fs.save(meta.id, meta.name, data.buffer, { public: 1 }, () => $.callback(response));

		} else {
			$.files.wait(function(file, next) {
				let meta = {};
				meta.id = UID();
				meta.name = file.filename;
				meta.type = file.type;
				meta.ext = file.ext;
				meta.size = file.size;
				meta.url = '/download/' + meta.id + '.' + meta.ext;
				response.push(meta);
				file.fs(MAIN.cms.id, meta.id, { public: 1 }, next);
			}, () => $.callback(response));
		}
	}
});

NEWACTION('Files|rename', {
	name: 'Rename file',
	route: '+API ?',
	input: '*id,*name',
	permissions: 'files,admin',
	user: true,
	action: function($, model) {
		MAIN.cms.db.fs.rename(model.id, model.name, $.done(model.id));
	}
});

NEWACTION('Files|clear', {
	name: 'Clear files',
	route: '+API ?',
	permissions: 'files,admin',
	user: true,
	action: function($) {
		MAIN.cms.db.fs.clear($.done());
	}
});

NEWACTION('Files|remove', {
	name: 'Remove files',
	route: '+API ?',
	input: '*id:String',
	permissions: 'files,admin',
	user: true,
	action: function($, model) {
		MAIN.cms.db.fs.remove(model.id, $.done());
	}
});