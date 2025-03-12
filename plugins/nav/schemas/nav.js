NEWSCHEMA('Nav/Link', 'id,icon:Icon,color:Color,*name,title,*url,arg,target,hidden:Boolean,highlight:Boolean,children:[@Nav/Link]');

NEWACTION('Nav/list', {
	name: 'Nav List',
	permissions: 'navigation,admin',
	action: function($) {

		var arr = [];
		for (var item of MAIN.db.nav)
			arr.push({ id: item.id, name: item.name, title: item.title, icon: item.icon, color: item.color, dtcreated: item.dtcreated, dtupdated: item.dtupdated });

		$.callback(arr);
	}
});

NEWACTION('Nav/read', {
	name: 'Read nav',
	input: '*id:String',
	permissions: 'navigation,admin',
	action: function($, model) {
		var id = model.id;
		var item = MAIN.db.nav.findItem('id', id);
		if (item)
			$.callback(item);
		else
			$.invalid(404);
	}
});

NEWACTION('Nav/save', {
	name: 'Save nav',
	permissions: 'navigation,admin',
	input: 'id,*name,title,icon:Icon,color:Color,children:[@Nav/Link]',
	action: function($, model) {

		var db = MAIN.db;

		if (!model.children)
			model.children = [];

		if (model.id) {

			var item = db.nav.findItem('id', model.id);
			if (!item) {
				$.invalid(404);
				return;
			}

			item.name = model.name;
			item.icon = model.icon;
			item.color = model.color;
			item.highlight = model.highlight;
			item.arg = model.arg;
			item.hidden = model.hidden;
			item.action = model.action;
			item.title = model.title;
			item.children = model.children;
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

NEWACTION('Nav/editor', {
	name: 'Editor nav',
	action: function($) {
		$.callback(MAIN.db.nav);
	}
});

NEWACTION('Nav/remove', {
	name: 'Remove nav',
	input: '*id:String',
	permissions: 'navigation,admin',
	action: function($, model) {
		var id = model.id;
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