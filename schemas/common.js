NEWSCHEMA('Common', function(schema) {

	// Reads backuped items
	schema.addWorkflow('backup', function($) {
		var req = $.controller.req;
		var name = req.split[req.split.length - 3];
		NOSQL(name).backups(n => n.data.id === $.id, function(err, response) {
			response.wait(function(item, next) {
				F.functions.read(name, item.data.id + '_' + item.data.stamp, function(err, body) {
					item.data.body = body;
					next();
				});
			}, () => $.callback(response));
		});
	});

	schema.addWorkflow('backup_clear', function($) {

		var clean = function(name) {
			return function(next) {
				TABLE(name).remove().like('id', '_').callback(function() {
					TABLE(name).clean();
					next();
				});
			};
		};

		var arr = [];
		arr.push(clean('pagesdata'));
		arr.push(clean('postsdata'));
		arr.push(clean('partsdata'));
		arr.push(clean('newslettersdata'));
		arr.async();

		$.success();
	});

	schema.addWorkflow('backup_read', function($) {
		F.functions.read($.params.type, $.params.id, $.callback);
	});

});