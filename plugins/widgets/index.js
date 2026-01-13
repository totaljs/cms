exports.icon = 'ti ti-plug';
exports.name = '@(Widgets)';
exports.position = 25;
exports.permissions = [{ id: 'widgets', name: 'Widgets' }];
exports.visible = user => user.sa || user.permissions.includes('widgets');
exports.import = 'extensions.html';
exports.instances = [];

ON('reload', function() {

	let cms = MAIN.cms;

	for (let m of exports.instances) {
		if (m.uninstall) {
			try {
				m.uninstall && m.uninstall.call(cms.db, cms.db);
			} catch (e) {
				Total.error(e, 'Uninstalling CMS widget: ' + m.id);
			}
		}
	}

	// PLUGINS.widgets.instances
	exports.instances = [];

	for (let item of cms.db.widgets) {
		let instance = Total.TCMS.run(item.html);
		exports.instances.push(instance);
		instance.dtcreated = item.dtcreated;
		instance.dtupdated = item.dtupdated;
		try {
			instance.install && instance.install.call(cms.db, cms.db);
		} catch (e) {
			Total.error(e, 'Installing CMS widget: ' + instance.id);
		}
	}
});

NEWACTION('Widgets', {
	name: 'Widgets list',
	route: '+API ?',
	query: 'list',
	user: true,
	permissions: 'widgets',
	action: function($) {
		let arr = [];
		for (let meta of exports.instances) {
			if (meta.name) {
				if ($.query.list)
					arr.push({ id: meta.id, name: meta.name, preview: meta.preview, author: meta.author, version: meta.version, dtcreated: meta.dtcreated, dtupdated: meta.dtupdated });
				else
					arr.push({ id: meta.id, name: meta.name, preview: meta.preview, author: meta.author, version: meta.version, config: meta.config, css: meta.ui.css, html: meta.ui.html, settings: meta.ui.settings, editor: meta.ui.editor, dtcreated: meta.dtcreated, dtupdated: meta.dtupdated });
			}
		}
		$.callback(arr);
	}
});

NEWACTION('Widgets|read', {
	name: 'Read a widget',
	input: '*id',
	route: '+API ?',
	user: true,
	permissions: 'widgets',
	action: function($, model) {
		let item = MAIN.cms.db.widgets.findItem('id', model.id);
		if (item) {
			let data = {};
			data.id = item.id;
			data.html = item.html;
			$.callback(data);
		} else {
			$.invalid(404);
			return;
		}
	}
});

NEWACTION('Widgets|save', {
	name: 'Create or Update widget',
	input: '*html,singleton:Boolean',
	route: '+API ?',
	user: true,
	permissions: 'widgets',
	action: async function($, model) {

		let cms = MAIN.cms;
		let widget = Total.TCMS.run(model.html);
		let index = exports.instances.findIndex('id', widget.id);
		let prev = index === -1 ? null : exports.instances[index];

		if (prev) {
			try {
				prev.uninstall && prev.uninstall.call(cms.db, cms.db);
			} catch (e) {
				Total.error(e, 'Uninstalling CMS widget: ' + prev.id);
			}
		}

		if (index === -1)
			exports.instances.push(widget);
		else
			exports.instances[index] = widget;

		let item = widget.id ? cms.db.widgets.findItem('id', widget.id) : null;

		if (item) {
			item.dtupdated = NOW;
			item.html = model.html;
			item.name = widget.name;
		} else {
			model.id = widget.id;
			model.name = widget.name;
			model.dtcreated = NOW;
			cms.db.widgets.push(model);
		}

		cms.db.widgets.quicksort('name');
		cms.refresh();
		cms.save();
		cms.views = {};

		if (widget) {
			try {
				widget.install && widget.install.call(cms.db, cms.db);
			} catch (e) {
				Total.error(e, 'Installing CMS widget: ' + widget.id);
			}
		}

		$.success(model.id);
		$.notify(model.id);
	}
});

NEWACTION('Widgets|remove', {
	name: 'Remove widget',
	input: '*id',
	route: '+API ?',
	user: true,
	permissions: 'widgets',
	action: function($, model) {

		let cms = MAIN.cms;
		let id = model.id;
		let index = exports.instances.findIndex('id', id);

		if (index !== -1) {

			let widget = exports.instances[index];
			exports.instances.splice(index, 1);

			index = cms.db.widgets.findIndex('id', id);
			cms.db.widgets.splice(index, 1);

			cms.save();
			cms.views = {};

			$.notify(model.id);
			$.success();

			if (widget) {
				try {
					widget.uninstall && widget.uninstall.call(cms.db, cms.db);
				} catch (e) {
					Total.error(e, 'Uninstalling CMS widget: ' + widget.id);
				}
			}

		} else
			$.invalid(404);
	}
});

NEWACTION('Widgets|detail', {
	name: 'Widgets detail',
	input: '*id',
	route: '+API ?',
	user: true,
	permissions: 'widgets',
	action: function($, model) {
		var meta = exports.instances.findItem('id', model.id);
		if (meta)
			$.callback({ id: meta.id, name: meta.name, preview: meta.preview, author: meta.author, version: meta.version, config: meta.config, css: meta.ui.css, html: meta.ui.html, settings: meta.ui.settings });
		else
			$.invalid(404);
	}
});
