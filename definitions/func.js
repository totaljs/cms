const PARSER = { settings: '<settings>', css: '<style>', total: '<script total>', html: '<body>', js: '<script>', template: '<template>', readme: '<readme>' };

FUNC.recompile = function(item) {
	var meta = item.html.parseComponent(PARSER);
	item.ref = {};
	try {
		(new Function('exports', meta.total))(item.ref);
	} catch(e) {
		// tries to compile only meta data
		var metadata = meta.total.match(/exports\..*?;/g);
		if (metadata.length) {
			try {
				(new Function('exports', metadata.join('\n')))(item.ref);
			} catch (e) {
				console.log(e + '', metadata.join('\n'));
			}
		} else
			console.log(e + '', metadata);
	}

	item.ref.ui = meta;

	var index = (meta.html || '').indexOf('<scr' + 'ipt>');

	if (index !== -1)
		meta.editor = meta.html.substring(index + 8, meta.html.indexOf('</scr' + 'ipt>', index + 8));

	delete item.ref.total;
};

FUNC.breadcrumb = function(url) {
	var page = MAIN.db.pages.findItem('url', url);
	var arr = [];
	var processed = {};
	if (page) {

		arr.push(page);
		processed[page.id] = 1;

		while (page) {

			var tmp = page.parentid ? MAIN.db.pages.findItem('id', page.parentid) : null;
			if (tmp) {
				if (tmp === page)
					break;
				if (processed[tmp.id])
					break;
				else
					processed[tmp.id] = 1;
			}

			page = tmp;
			page && arr.unshift(page);
		}
	}

	return arr;
};

function children(links, parent) {
	for (var item of parent.children) {
		item.parent = parent;
		links.push(item);
		if (item.children.length)
			children(links, item);
	}
}

FUNC.refresh = function() {

	MAIN.cache = {};

	var db = MAIN.db;
	var cache = MAIN.cache;

	db.widgets.quicksort('dtcreated_desc');
	cache.widgets = [];

	for (var item of db.widgets) {
		if (item.ref)
			cache.widgets.push(item.ref);
	}

	cache.nav = [];

	for (var item of db.nav) {

		item = CLONE(item);
		item.links = [];

		for (var m of item.children) {
			item.links.push(m);
			if (m.children.length)
				children(item.links, m);
		}

		for (var m of item.links) {

			var level = 0;
			var parent = m.parent;

			while (parent) {
				level++;
				parent = parent.parent;
			}

			m.level = level;
		}

		cache.nav.push(item);
	}
};

FUNC.save = function() {
	var site = MAIN.db;
	var model = {};
	model.id = site.id;
	model.dtcreated = site.dtcreated;
	model.dtupdated = NOW;
	model.name = site.name;
	model.pages = site.pages;
	model.layouts = site.layouts || [];
	model.vars = site.vars;
	model.config = site.config;
	model.roles = site.roles;
	model.widgets = [];
	model.nav = site.nav;
	for (var item of site.widgets) {
		var obj = {};
		for (var key in item) {
			if (key !== 'ref')
				obj[key] = item[key];
		}
		model.widgets.push(obj);
	}
	FILESTORAGE(MAIN.id).savejson('meta', model);
};

FUNC.unload = function(callback) {

	var value = MAIN.db;

	for (var item of value.widgets) {
		if (item.ref.uninstall) {
			try {
				item.ref.uninstall.call(value);
			} catch (e) {
				// what next?
				console.log('uninstall', e);
			}
		}
	}

	FILESTORAGE(MAIN.id).drop(callback);
};

FUNC.reconfigure = function() {
	var config = {};

	for (var key in PREF) {
		var val = PREF[key];
		if (key !== 'user' && typeof(val) !== 'function')
			config[key] = val;
	}

	LOADCONFIG(config);
};

FUNC.load = function(callback) {
	FILESTORAGE(MAIN.id).readjson('meta', function(err, value) {

		var empty = false;

		if (!value) {
			value = { id: MAIN.id, widgets: [], pages: [], layouts: [], vars: {}, nav: [], config: {}, roles: [] };
			empty = true;
		}

		MAIN.db = value;

		// 7973 is a folder indentifier for the meta file
		MAIN.db_posts = 'nosql/~' + PATH.databases('fs-' + MAIN.id + '/7973/posts.nosql');
		MAIN.views = {};

		value.ready = true;

		if (!empty && value.config)
			LOADCONFIG(value.config);

		if (!value.config)
			value.config = {};

		if (!value.nav)
			value.nav = [];

		value.fs = FILESTORAGE(MAIN.id);

		var rem = [];

		for (var item of value.widgets) {
			if (item.html)
				FUNC.recompile(item);

			if (!item.ref.name)
				rem.push(item);

			if (!item.id)
				item.id = item.ref.id;
		}

		if (rem.length) {
			for (var m of rem)
				value.widgets.splice(value.widgets.indexOf(m), 1);
		}

		for (var item of value.widgets) {
			if (item.ref.install) {
				try {
					item.ref.install.call(value);
				} catch (e) {
					// what next?
					console.log('install', e);
				}
			}
		}

		FUNC.refresh();
		callback && callback();
		empty && FUNC.save();
	});
};