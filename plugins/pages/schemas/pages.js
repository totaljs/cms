NEWACTION('Pages/list', {
	name: 'Pages List',
	permissions: 'pages',
	action: function($) {
		$.callback(MAIN.db.pages);
	}
});

NEWACTION('Pages/links', {
	name: 'Pages Links',
	action: function($) {
		var arr = [];
		for (var item of MAIN.db.pages)
			arr.push({ id: item.id, parentid: item.parentid, name: item.name, url: item.url, language: item.language, disabled: item.disabled });
		$.callback(arr);
	}
});

NEWACTION('Pages/read', {
	name: 'Read pages',
	params: '*id:String',
	permissions: 'pages',
	action: function($) {

		var item = MAIN.db.pages.findItem('id', $.params.id);
		if (item)
			$.callback(item);
		else
			$.invalid(404);
	}
});

NEWACTION('Pages/save', {
	name: 'Save pages',
	permissions: 'pages',
	input: 'id,parentid,*layoutid,language,title,description,keywords,color,icon,url,*name,nocache:Boolean,disabled:Boolean,pinned:Boolean,permissions:[string]',
	action: function($, model) {

		var db = MAIN.db;
		var template = db.layouts.findItem('id', model.layoutid);
		var urlchange = false;

		if (!template) {
			$.invalid('@(Layout not found)');
			return;
		}

		// Generate URL
		if (!model.url) {
			model.url = '/' + model.name.slug() + '/';
			if (model.parentid) {
				var parent = db.pages.findItem('id', model.parentid);
				if (parent) {
					var arr = FUNC.breadcrumb(parent.url);
					model.url = ('/' + arr[arr.length - 1].url + '/' + model.url + '/').toLowerCase().replace(/\/{2,}/g, '/');
				} else
					model.parentid = null;
			}
		}

		if (model.id) {

			var item = db.pages.findItem('id', model.id);
			if (!item) {
				$.invalid(404);
				return;
			}

			urlchange = item.url !== model.url;

			// Refresh existing navigations with this page
			if (urlchange) {
				browse(null, function(nav) {
					if (nav.url && nav.url.indexOf(item.url) !== -1)
						nav.url = nav.url.replace(item.url, model.url);
				});
			}

			item.dtupdated = NOW;
			item.name = model.name;
			item.url = model.url;
			item.parentid = model.parentid;
			item.layoutid = model.layoutid;
			item.language = model.language;
			item.title = model.title;
			item.disabled = model.disabled;
			item.pinned = model.pinned;
			item.nocache = model.nocache;
			item.description = model.description;
			item.keywords = model.keywords;
			item.icon = model.icon;
			item.color = model.color;
			delete MAIN.views[item.id];

		} else {
			model.id = UID();
			model.dtcreated = NOW;
			db.fs.save(model.id, model.id + '.html', Buffer.alloc(0), NOOP);
			db.pages.push(model);
		}

		FUNC.save();
		urlchange && FUNC.refresh();

		$.success();
	}
});

NEWACTION('Pages/remove', {
	name: 'Remove pages',
	params: '*id:String',
	permissions: 'pages',
	action: function($) {

		var id = $.params.id;
		var index = MAIN.db.pages.findIndex('id', id);
		if (index !== -1) {

			var item = MAIN.db.pages[index];
			MAIN.db.pages.splice(index, 1);
			MAIN.db.fs.remove(id);
			delete MAIN.views[id];

			while (item) {
				index = MAIN.db.pages.findIndex('parentid', item.id);
				if (index !== -1) {
					item = MAIN.db.pages[index];
					MAIN.db.pages.splice(index, 1);
					MAIN.db.fs.remove(item.id);
					delete MAIN.views[item.id];
				} else
					break;
			}

			$.success();
			FUNC.save();
		} else
			$.invalid(404);
	}
});

NEWACTION('Pages/clone', {
	name: 'Clone pages',
	params: '*id:String',
	permissions: 'pages',
	action: function($) {

		var id = $.id;
		var db = MAIN.db;
		var model = db.pages.findItem('id', id);
		if (model) {

			model = CLONE(model);
			model.id = UID();
			model.dtcreated = NOW;
			delete model.dtupdated;
			model.disabled = true;
			db.pages.push(model);

			db.fs.readbuffer(id, function(err, buffer) {
				buffer && db.fs.save(model.id, model.id + '.html', buffer, NOOP);
				$.success(model.id);
				FUNC.save();
			});

		} else
			$.invalid(404);
	}
});

NEWACTION('Pages/HTML/read', {
	name: 'Read Pages/HTML',
	params: '*id:String',
	action: function($) {
		var db = MAIN.db;
		var item = db.pages.findItem('id', $.params.id);
		if (item) {
			db.fs.readbuffer(item.id, function(err, buffer) {
				var obj = {};
				obj.name = item.name;
				obj.html = buffer ? buffer.toString('utf8') : '';
				if (item.layoutid) {
					db.fs.readbuffer(item.layoutid, function(err, buffer) {
						obj.layout = buffer ? buffer.toString('utf8') : '';
						$.callback(obj);
					});
				} else
					$.callback(obj);
			});
		} else
			$.invalid(404);
	}
});

NEWACTION('Pages/HTML/save', {
	name: 'Save Pages/HTML',
	permissions: 'pages',
	input: '*id,html',
	action: function($, model) {

		var db = MAIN.db;
		if (db.pages.findItem('id', model.id)) {
			db.fs.save(model.id, model.id + '.html', Buffer.from(model.html, 'utf8'), $.done());
			MAIN.cache.pages = {};
			delete MAIN.views[model.id];
		} else
			$.invalid(404);
	}
});

NEWACTION('Pages/HTML/copy', {
	name: 'Copy Pages/HTML',
	params: 'from:String,to:String',
	permissions: 'pages',
	action: function($) {

		var fromid = $.params.from;
		var toid = $.params.to;
		var db = MAIN.db;

		db.fs.readbuffer(fromid, function(err, buffer) {
			buffer && db.fs.save(toid, toid + '.html', buffer, NOOP);
			$.success();
			FUNC.save();
		});
	}
});

function browse(parent, callback) {
	var items = parent == null ? MAIN.db.nav : parent.children;
	for (var item of items) {
		callback(item);
		if (item.children.length)
			browse(item, callback);
	}
}