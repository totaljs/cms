NEWSCHEMA('Files', function(schema) {

	schema.define('data', 'Base64');

	schema.action('list', {
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

	schema.action('insert', {
		name: 'Insert files',
		query: 'name:String',
		action: function($, model) {
			var response = [];

			// Base64
			if (model.data) {

				var type = model.data.base64ContentType();
				var ext;

				switch (type) {
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

				var data = model.data.base64ToBuffer();
				var meta = {};
				meta.id = UID();
				meta.size = data.length;
				meta.type = type;
				meta.ext = ext;
				meta.name = ($.query.name || (U.random_string(10) + '_base64')).replace(/\.[0-9a-z]+$/i, '').max(40) + '.' + ext;
				response.push(meta);
				MAIN.db.fs.save(meta.id, meta.name, data, () => $.callback(response), { public: 1 });
				return;
			}

			$.files.wait(function(file, next) {
				var meta = {};
				meta.id = UID();
				meta.name = file.filename;
				meta.type = file.type;
				meta.ext = file.extension;
				meta.size = file.size;
				response.push(meta);
				file.fs(MAIN.id, meta.id, { public: 1 }, function() {
					next();
				});
			}, function() {
				$.callback(response);
			});
		}
	});

	schema.action('clear', {
		name: 'Clear files',
		permissions: 'files',
		action: function($) {
			MAIN.db.fs.clear($.done());
		}
	});

	schema.action('remove', {
		name: 'Remove files',
		params: '*id:String',
		permissions: 'files',
		action: function($) {
			MAIN.db.fs.remove($.params.id, $.done());
		}
	});

});