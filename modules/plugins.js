// List of all plugins
MAIN.plugins = [];
MAIN.version = 14;

ON('ready', function() {

	MAIN.pluginsgroups = [];
	MAIN.plugins.quicksort('position');

	var tmp = {};

	var keys = Object.keys(F.plugins);
	for (var i = 0; i < keys.length; i++)
		MAIN.plugins.push(F.plugins[keys[i]]);

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
		tmp[key].quicksort('position');
		MAIN.pluginsgroups.push({ name: key === '#' ? null : key, plugins: tmp[key] });
	}

	CONF.version = MAIN.version;
});