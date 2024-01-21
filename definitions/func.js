const PARSER = { settings: '<settings>', css: '<style>', total: '<script total>', html: '<body>', js: '<script>', template: '<template>', readme: '<readme>' };
const REG_CLASS = /CLASS/g;

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
				console.log(e + '', metadata.join('\n'));
			} catch (e) {
				console.log(e + '', metadata.join('\n'));
			}
		} else
			console.log(e + '', metadata);
	}

	if (!item.ref.id)
		item.ref.id = item.ref.name;

	var uid = item.ref.id.slug().replace(/\-/g, '');

	meta.cls = uid;

	if (meta.css)
		meta.css = meta.css.replace(REG_CLASS, 'w-' + uid);

	if (meta.settings)
		meta.settings = meta.settings.replace(REG_CLASS, 'w-' + uid);

	if (meta.template)
		meta.template = meta.template.replace(REG_CLASS, 'w-' + uid);

	if (meta.js)
		meta.js = meta.js.replace(REG_CLASS, 'w-' + uid);

	if (meta.html)
		meta.html = meta.html.replace(REG_CLASS, 'w-' + uid);

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

		arr.push({ id: page.id, parentid: page.id, url: page.url, name: page.name, title: page.title, color: page.color, icon: page.icon, language: page.language });
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
			page && arr.unshift({ id: page.id, parentid: page.id, url: page.url, name: page.name, title: page.title, color: page.color, icon: page.icon, language: page.language });
		}

		arr[0].first = true;
		arr[arr.length - 1].last = true;
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

	// Internal cache for rendered navigation & breadcrumb
	cache.pages = {};

	db.widgets.quicksort('dtcreated_desc');
	cache.widgets = [];

	for (var item of db.widgets) {
		if (item.ref)
			cache.widgets.push(item.ref);
	}

	cache.nav = {};

	for (var item of db.nav) {

		item = CLONE(item);
		item.links = [];

		if (!item.children)
			item.children = [];

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

		cache.nav[item.id] = item;
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
	model.storage = site.storage || {};

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
				item.ref.uninstall.call(value, value);
			} catch (e) {
				// what next?
				console.log('uninstall', e);
			}
		}
	}

	FILESTORAGE(MAIN.id).drop(callback);
	EMIT('unload');

};

FUNC.reconfigure = function() {

	var config = {};

	for (var key in MAIN.db.config)
		config[key] = MAIN.db.config[key];

	LOADCONFIG(config);
	EMIT('configure');

};

FUNC.load = function(callback) {
	FILESTORAGE(MAIN.id).readjson('meta', function(err, value) {

		var empty = false;

		if (!value) {
			value = { id: MAIN.id, widgets: [], pages: [], layouts: [], vars: {}, nav: [], config: {}, roles: [], storage: {} };
			empty = true;
		}

		value.config.$tapi = true;
		MAIN.db = value;
		MAIN.views = {};

		if (!value.storage)
			value.storage = {};

		value.ready = true;
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
					item.ref.install.call(value, value);
				} catch (e) {
					// what next?
					console.log('install', e);
				}
			}
		}

		for (var key in F.plugins) {
			var item = F.plugins[key];
			if (item.config) {
				for (let m of item.config) {
					if (MAIN.db.config[m.id] == null)
						MAIN.db.config[m.id] = m.value;
				}
			}
		}

		FUNC.refresh();
		FUNC.reconfigure();
		callback && callback();
		empty && FUNC.save();
		EMIT('reload', MAIN.db);
	});
};