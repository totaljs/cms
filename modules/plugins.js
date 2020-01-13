const Fs = require('fs');

// List of all plugins
MAIN.plugins = [];
MAIN.version = 13;

FUNC.refreshplugins = function(callback) {
	Fs.readdir(PATH.root('plugins'), function(err, response) {

		if (response == null) {
			callback && callback();
			return;
		}

		response.wait(function(plugin, next) {

			var obj = REQUIRE('plugins/{0}/index.js'.format(plugin));
			obj.id = plugin;
			obj.install && obj.install();

			// load definitions, operations and schemas
			MAIN.plugins.push(obj);

			var path = PATH.root('plugins/{0}/definitions/'.format(plugin));
			U.ls(path, function(files) {

				for (var i = 0; i < files.length; i++) {
					if (files[i].substring(files[i].length - 3) === '.js')
						REQUIRE('plugins/{0}/definitions/{1}'.format(plugin, files[i].substring(path.length)));
				}

				path = PATH.root('plugins/{0}/operations/'.format(plugin));
				U.ls(path, function(files) {

					for (var i = 0; i < files.length; i++) {
						if (files[i].substring(files[i].length - 3) === '.js')
							REQUIRE('plugins/{0}/operations/{1}'.format(plugin, files[i].substring(path.length)));
					}

					path = PATH.root('plugins/{0}/schemas/'.format(plugin));
					U.ls(path, function(files) {
						for (var i = 0; i < files.length; i++) {
							if (files[i].substring(files[i].length - 3) === '.js')
								REQUIRE('plugins/{0}/schemas/{1}'.format(plugin, files[i].substring(path.length)));
						}
						next();
					});
				});
			});

		}, callback);

	});
};

ON('ready', function() {
	FUNC.refreshplugins();
});