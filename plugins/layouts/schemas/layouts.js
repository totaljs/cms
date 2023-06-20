NEWSCHEMA('Layouts', function(schema) {

	schema.define('id', String);
	schema.define('name', String, true);
	schema.define('icon', 'Icon');
	schema.define('color', 'Color');
	schema.define('html', String);
	schema.define('scripts', '[String]');

	schema.action('list', {
		name: 'Layouts List',
		permissions: 'layouts',
		action: function($) {

			var arr = [];
			for (var item of MAIN.db.layouts)
				arr.push({ id: item.id, name: item.name, icon: item.icon, color: item.color, dtcreated: item.dtcreated, dtupdated: item.dtupdated });
			$.callback(arr);
		}
	});

	schema.action('read', {
		name: 'Read layouts',
		params: '*id:String',
		permissions: 'layouts',
		action: function($) {

			var item = MAIN.db.layouts.findItem('id', $.params.id);
			if (item)
				$.callback(item);
			else
				$.invalid('@(Layout not found)');
		}
	});

	schema.action('save', {
		name: 'Save layouts',
		permissions: 'layouts',
		action: function($, model) {

			importwidgets(model, function() {
				var db = MAIN.db;

				if (model.id) {

					var item = db.layouts.findItem('id', model.id);
					if (!item) {
						$.invalid('@(Layout not found)');
						return;
					}

					item.dtupdated = NOW;
					item.name = model.name;
					item.color = model.color;
					item.icon = model.icon;

					model.html && db.fs.save(model.id, model.id + '.html', model.html ? Buffer.from(model.html, 'utf8') : Buffer.alloc(0), NOOP);
					delete model.html;
					delete TEMP[item.id];

				} else {
					model.id = UID();
					model.dtcreated = NOW;
					db.fs.save(model.id, model.id + '.html', model.html ? Buffer.from(model.html, 'utf8') : Buffer.alloc(0), NOOP);
					delete model.html;
					db.layouts.push(model);
				}

				FUNC.save();
				FUNC.refresh();
				$.success();

			});
		}
	});

	schema.action('import', {
		name: 'Import layouts',
		permissions: 'layouts',
		action: function($, model) {

			var db = MAIN.db;
			var widgets = [];
			var arr = model.html.match(/<widget.*?>/g);
			if (arr) {
				for (var i = 0; i < arr.length; i++) {
					var item = arr[i];
					var index = item.indexOf(' data="');
					if (index !== -1) {
						try {
							var widget = decodeURIComponent(Buffer.from(item.substring(index + 7, item.indexOf('"', index + 8)), 'base64')).toString('utf8');
							widget && widgets.push(widget);
						} catch (e) {}
					}
				}
			}

			model.html = model.html.replace(/<widget.*?>/g, '').trim();
			model.id = UID();
			model.dtcreated = NOW;
			db.fs.save(model.id, model.id + '.html', model.html ? Buffer.from(model.html, 'utf8') : Buffer.alloc(0), $.done());
			delete model.html;
			db.layouts.push(model);

			widgets.wait(function(item, next) {
				EXEC('+Widgets --> save', { html: item }, function(err) {
					err && console.log(err);
					next();
				});
			}, function() {
				FUNC.save();
				$.success();
			});
		}
	});

	schema.action('remove', {
		name: 'Remove layouts',
		params: '*id:String',
		permissions: 'layouts',
		action: function($) {

			var id = $.params.id;
			var index = MAIN.db.layouts.findIndex('id', id);
			if (index !== -1) {
				MAIN.db.layouts.splice(index, 1);
				MAIN.db.fs.remove(id);
				$.success();
				FUNC.save();
				delete MAIN.views[id];
			} else
				$.invalid('@(Layout not found)');
		}
	});

	schema.action('clone', {
		name: 'Clone layouts',
		params: '*id:String',
		permissions: 'layouts',
		action: function($) {

			var id = $.params.id;
			var db = MAIN.db;
			var model = db.layouts.findItem('id', id);
			if (model) {

				model = CLONE(model);
				model.id = UID();
				model.dtcreated = NOW;
				delete model.dtupdated;
				db.layouts.push(model);

				db.fs.readbuffer(id, function(err, buffer) {
					buffer && db.fs.save(model.id, model.id + '.html', buffer, NOOP);
					$.success(model.id);
					FUNC.save();
				});

			} else
				$.invalid('@(Page not found)');
		}
	});

});

NEWSCHEMA('Layouts/HTML', function(schema) {

	schema.define('id', String, true);
	schema.define('html', String);

	schema.action('read', {
		name: 'Read layouts/HTML',
		params: '*id:String',
		action: function($) {
			var db = MAIN.db;
			var item = db.layouts.findItem('id', $.params.id);
			if (item) {
				db.fs.readbuffer(item.id, function(err, buffer) {
					var obj = {};
					obj.name = item.name;
					obj.html = buffer ? buffer.toString('utf8') : '';
					/*
					obj.html = obj.html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, function(text) {
						return '<!--\n' + text.replace(/script/g, 'SCR') + '\n-->';
					});*/
					$.callback(obj);
				});
			} else
				$.invalid('@(Page not found)');
		}
	});

	schema.action('save', {
		name: 'Save layouts/HTML',
		permissions: 'layouts',
		action: function($, model) {

			var db = MAIN.db;
			if (db.layouts.findItem('id', model.id)) {
				importwidgets(model, function() {
					db.fs.save(model.id, model.id + '.html', Buffer.from(model.html, 'utf8'), $.done());
					delete MAIN.views[model.id];
				});
			} else
				$.invalid('@(Layout not found)');
		}
	});

});

function importwidgets(model, callback) {

	var widgets = [];
	var arr = model.html.match(/<widget.*?>/g);
	if (arr) {
		for (var i = 0; i < arr.length; i++) {
			var item = arr[i];
			var index = item.indexOf(' data="');
			if (index !== -1) {
				try {
					var widget = decodeURIComponent(Buffer.from(item.substring(index + 7, item.indexOf('"', index + 8)), 'base64')).toString('utf8');
					widget && widgets.push(widget);
				} catch (e) {}
			}
		}
	}

	model.html = model.html.replace(/<widget.*?>/g, '').trim();

	widgets.wait(function(item, next) {
		EXEC('+Widgets --> save', { html: item, upsert: true }, function(err) {
			err && console.log(err);
			next();
		});
	}, callback);
}