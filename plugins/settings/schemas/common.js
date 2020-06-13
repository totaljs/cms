const Fs = require('fs');

NEWSCHEMA('Common', function(schema) {

	// Reads backuped items
	schema.addWorkflow('backup', function($) {
		var req = $.controller.req;
		var name = req.split[req.split.length - 3];

		NOSQL(name).backups(n => n.data.id === $.id, function(err, response) {

			if (name === 'widgets') {
				$.callback(response);
				return;
			}

			response.wait(function(item, next) {
				FUNC.read(name, item.data.id + '_' + item.data.stamp, function(err, body) {
					item.data.body = body;
					next();
				});
			}, () => $.callback(response));
		});
	});

	schema.addWorkflow('backup_clear', function($) {

		var clean = function(name) {
			return function(next) {
				TABLE(name).remove().search('id', '_').callback(function() {
					TABLE(name).clean();
					next();
				});
			};
		};

		var remove = function(name) {
			return function(next) {
				Fs.unlink(PATH.databases(name + '.nosql-backup'), next);
			};
		};

		var arr = [];
		arr.push(clean('pagesdata'));
		arr.push(clean('postsdata'));
		arr.push(clean('partsdata'));
		arr.push(clean('newslettersdata'));
		arr.push(remove('notices'));
		arr.push(remove('pages'));
		arr.push(remove('posts'));
		arr.push(remove('widgets'));
		arr.push(remove('newsletters'));
		arr.async();

		$.success();
	});

	schema.addWorkflow('backup_read', function($) {
		FUNC.read($.params.type, $.params.id, $.callback);
	});

});