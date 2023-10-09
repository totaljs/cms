NEWSCHEMA('Nav/Link', function(schema) {

	schema.define('id', 'String');
	schema.define('icon', 'String');
	schema.define('color', 'String');
	schema.define('name', 'String', true);
	schema.define('title', 'String');
	schema.define('url', 'String', true);
	schema.define('target', 'String');
	schema.define('istop', 'Boolean');
	schema.define('ishighlight', 'Boolean');
	schema.define('action', 'String');
	schema.define('isexternal', 'Boolean');
	schema.define('children', '[Nav/Link]');

});

NEWSCHEMA('Nav', function(schema) {

	schema.define('id', 'String');
	schema.define('name', 'String', true);
	schema.define('title', 'String');
	schema.define('icon', 'String');
	schema.define('color', 'String');
	schema.define('children', '[Nav/Link]');

	schema.action('list', {
		name: 'Nav List',
		permissions: 'navigation',
		action: function($) {

			var arr = [];
			for (var item of MAIN.db.nav)
				arr.push({ id: item.id, name: item.name, title: item.title, icon: item.icon, color: item.color, dtcreated: item.dtcreated, dtupdated: item.dtupdated });

			$.callback(arr);
		}
	});

	schema.action('read', {
		name: 'Read nav',
		params: '*id:String',
		permissions: 'navigation',
		action: function($) {

			var id = $.params.id;
			var item = MAIN.db.nav.findItem('id', id);
			if (item)
				$.callback(item);
			else
				$.invalid(404);
		}
	});

	schema.action('save', {
		name: 'Save nav',
		permissions: 'navigation',
		action: function($, model) {

			var db = MAIN.db;

			if (model.id) {

				var item = db.nav.findItem('id', model.id);
				if (!item) {
					$.invalid(404);
					return;
				}

				item.name = model.name;
				item.icon = model.icon;
				item.color = model.color;
				item.ishighlight = model.ishighlight;
				item.istop = model.istop;
				item.action = model.action;
				item.title = model.title;
				item.children = model.children;
				item.isexternal =  model.isexternal;
				item.dtupdated = NOW;

			} else {
				model.id = UID();
				model.dtcreated = NOW;
				db.nav.push(model);
			}

			FUNC.save();
			FUNC.refresh();
			$.success();
		}
	});

	schema.action('editor', {
		name: 'Editor nav',
		action: function($) {
			$.callback(MAIN.db.nav);
		}
	});

	schema.action('remove', {
		name: 'Remove nav',
		params: '*id:String',
		permissions: 'navigation',
		action: function($) {

			var id = $.params.id;
			var index = MAIN.db.nav.findIndex('id', id);
			if (index !== -1) {
				MAIN.db.nav.splice(index, 1);
				$.success();
				FUNC.save();
				FUNC.refresh();
			} else
				$.invalid(404);
		}
	});

});