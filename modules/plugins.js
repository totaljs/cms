const Fs = require('fs');

// List of all plugins
MAIN.plugins = [];
MAIN.version = 14;

FUNC.refresh_plugins = function(callback) {
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

		}, function() {

			MAIN.pluginsgroups = [];
			MAIN.plugins.quicksort('position');

			var tmp = {};

			for (var i = 0; i < MAIN.plugins.length; i++) {
				var item = MAIN.plugins[i];
				var g = item.group || '#';
				if (tmp[g])
					tmp[g].push(item);
				else
					tmp[g] = [item];
			}

			var keys = Object.keys(tmp);
			for (var i = 0; i < keys.length; i++) {
				var key = keys[i];
				MAIN.pluginsgroups.push({ name: key === '#' ? null : key, plugins: tmp[key] });
			}
		});

	});
};

ON('ready', function() {
	FUNC.refresh_plugins();
});