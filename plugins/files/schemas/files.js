NEWACTION('Files/list', {
	name: 'Files list',
	action: function($) {
		MAIN.db.fs.browse2(function(err, response) {
			var arr = [];
			for (var file of response) {
				if (file.custom && file.custom.public)
					arr.push(file);
			}
			$.callback(arr);
		});
	}
});

NEWACTION('Files/insert', {
	name: 'Insert files',
	query: 'name:String',
	input: 'data:DataURI',
	action: function($, model) {
		var response = [];

		// Base64
		if (model.data) {

			var data = model.data;
			var ext;

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
			MAIN.db.fs.save(meta.id, meta.name, data.buffer, { public: 1 }, () => $.callback(response));

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
				file.fs(MAIN.id, meta.id, { public: 1 }, next);
			}, () => $.callback(response));
		}
	}
});

NEWACTION('Files/clear', {
	name: 'Clear files',
	permissions: 'files',
	action: function($) {
		MAIN.db.fs.clear($.done());
	}
});

NEWACTION('Files/remove', {
	name: 'Remove files',
	params: '*id:String',
	permissions: 'files',
	action: function($) {
		MAIN.db.fs.remove($.params.id, $.done());
	}
});