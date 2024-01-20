NEWACTION('Widgets/list', {
	name: 'Widgets list',
	query: 'list:String',
	action: function($) {
		var cms = MAIN.db;
		var arr = [];
		for (var item of cms.widgets) {
			var meta = item.ref;
			if (meta && meta.name) {
				if ($.query.list)
					arr.push({ id: item.id, name: meta.name, preview: meta.preview, author: meta.author, version: meta.version, dtcreated: item.dtcreated, dtupdated: item.dtupdated });
				else
					arr.push({ id: item.id, name: meta.name, preview: meta.preview, author: meta.author, version: meta.version, config: meta.config, css: meta.ui.css, html: meta.ui.html, settings: meta.ui.settings, editor: meta.ui.editor, dtcreated: item.dtcreated, dtupdated: item.dtupdated });
			}
		}
		$.callback(arr);
	}
});

NEWACTION('Widgets/read', {
	name: 'Read widgets',
	params: '*id:String',
	action: function($) {
		var item = MAIN.db.widgets.findItem('id', $.params.id);
		if (item) {
			var data = {};
			data.id = item.id;
			data.html = item.html;
			$.callback(data);
		} else {
			$.invalid(404);
			return;
		}
	}
});

NEWACTION('Widgets/save', {
	name: 'Save widgets',
	input: 'id,*html,singleton:Boolean',
	permissions: 'widgets',
	action: async function($, model) {

		var cms = MAIN.db;
		var item = model.id ? cms.widgets.findItem('id', model.id) : null;
		var done = function() {
			cms.widgets.quicksort('name');
			FUNC.refresh();
			FUNC.save();
			MAIN.views = {};
			$.success(model.id);
		};

		if (item) {

			item.dtupdated = NOW;
			item.html = model.html;

			if (item.ref && item.ref.uninstall) {
				try {
					item.ref.uninstall.call(cms, cms);
				} catch (e) {
					// what next?
					console.log('uninstall', e);
				}
			}

			FUNC.recompile(item);
			item.id = item.ref.id;

			if (item.ref.install) {
				try {
					item.ref.install.call(cms);
				} catch (e) {
					// what next?
					console.log('install', e);
				}
			}

			model.id = item.id;
			downloadpreview(item, done);

		} else {

			model.dtcreated = NOW;
			FUNC.recompile(model);

			if (!model.ref.id) {
				$.invalid('@(Invalid widget identifier)');
				return;
			}

			model.id = model.ref.id;

			item = cms.widgets.findItem('id', model.id);

			// Widget is already imported
			if (item && model.singleton) {
				$.success();
				return;
			}

			if (item) {
				// Recursive call
				save($, model);
				return;
			}

			if (model.ref.install) {
				try {
					model.ref.install.call(cms);
				} catch (e) {
					// what next?
					console.log('install', e);
				}
			}

			cms.widgets.push(model);
			downloadpreview(model, done);
		}
	}
});

NEWACTION('Widgets/remove', {
	name: 'Remove widgets',
	params: '*id:String',
	permissions: 'widgets',
	action: function($) {

		var db = MAIN.db;
		var id = $.params.id;
		var index = db.widgets.findIndex('id', id);
		if (index !== -1) {
			var widget = db.widgets[index];

			if (widget.ref) {

				if (widget.ref.uninstall) {
					try {
						widget.ref.uninstall.call(db, db);
					} catch (e) {
						// what next?
						console.log('uninstall', e);
					}
				}

				if (widget.ref.preview && widget.ref.preview.startsWith('/download/')) {
					var id = widget.ref.preview.substring(10, widget.ref.preview.lastIndexOf('.'));
					id && db.fs.remove(id);
				}
			}

			db.widgets.splice(index, 1);
			$.success();
			FUNC.refresh();
			FUNC.save();
		} else
			$.invalid(404);
	}
});

NEWACTION('Widgets/detail', {
	name: 'Widgets detail',
	params: '*id:String',
	action: function($) {
		var item = MAIN.db.widgets.findItem('id', $.params.id);
		if (item) {
			var meta = item.ref;
			$.callback({ id: item.id, name: meta.name, preview: meta.preview, author: meta.author, version: meta.version, config: meta.config, css: meta.ui.css, html: meta.ui.html, settings: meta.ui.settings });
		} else
			$.invalid(404);
	}
});

function downloadpreview(item, next) {

	// item.html

	if (!item.ref.preview || !item.ref.preview.startsWith('http')) {
		next();
		return;
	}

	var id = UID();
	MAIN.db.fs.save(id, (item.id || item.name) + '.jpg', item.ref.preview, function(err) {
		if (!err) {
			var tmp = '/download/' + id + '.jpg';
			item.html = item.html.replace(item.ref.preview, tmp);
			item.ref.preview = tmp;
		}
		next();
	});
}