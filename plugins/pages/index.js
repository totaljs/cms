exports.icon = 'ti ti-file';
exports.name = '@(Pages)';
exports.position = 2;
exports.permissions = [{ id: 'pages', name: 'Pages' }, { id: 'nav', name: 'Navigation' }, { id: 'layouts', name: 'Layouts' }, { id: 'redirects', name: 'Redirects' }];
exports.visible = user => user.sa || user.permissions.includes('pages');
exports.divider = false;

NEWACTION('Pages', {
	route: '+API ?',
	user: true,
	permissions: 'pages,admin',
	action: function($) {
		$.callback(MAIN.cms.db.pages);
	}
});


NEWACTION('Pages|layouts', {
	route: '+API ?',
	user: true,
	permissions: 'pages,admin',
	action: function($) {

		let arr = [];
		for (let item of MAIN.cms.db.layouts)
			arr.push({ id: item.id, name: item.name, icon: item.icon, color: item.color });

		$.callback(arr);
	}
});

NEWACTION('Pages|read', {
	input: '*id',
	route: '+API ?',
	user: true,
	permissions: 'pages,admin',
	action: function($, model) {
		let item = MAIN.cms.db.pages.findItem('id', model.id);
		if (item)
			$.callback(item);
		else
			$.invalid(404);
	}
});

NEWACTION('Pages|save', {
	input: 'id,layoutid,parentid:String2,*name,*url:Lower,icon,color,language,title,description,keywords,nocache:Boolean,disabled:Boolean,pinned:Boolean,auth:Boolean',
	route: '+API ?',
	user: true,
	permissions: 'pages,admin',
	action: function($, model) {

		let db = MAIN.cms.db;
		let urlchange = false;

		// Generate URL
		if (!model.url) {
			model.url = '/' + model.name.slug() + '/';
			if (model.parentid) {
				let parent = db.pages.findItem('id', model.parentid);
				if (parent) {
					let arr = MAIN.cms.breadcrumb(parent.url);
					model.url = ('/' + arr[arr.length - 1].url + '/' + model.url + '/').toLowerCase().replace(/\/{2,}/g, '/');
				} else
					model.parentid = null;
			}
		}

		if (model.url[0] !== '/')
			model.url = '/' + model.url;

		if (model.id) {

			let item = db.pages.findItem('id', model.id);
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
			item.auth = model.auth;
			delete MAIN.cms.views[item.id];

		} else {
			model.id = UID();
			model.dtcreated = NOW;
			db.fs.save(model.id, model.id + '.html', Buffer.alloc(0), NOOP);
			db.pages.push(model);
		}

		MAIN.cms.save();
		urlchange && MAIN.cms.refresh();

		$.success();

	}
});

NEWACTION('Pages|remove', {
	input: '*id',
	route: '+API ?',
	user: true,
	permissions: 'pages,admin',
	action: async function($, model) {

		let id = model.id;
		let index = MAIN.cms.db.pages.findIndex('id', id);
		if (index !== -1) {

			let item = MAIN.cms.db.pages[index];
			MAIN.cms.db.pages.splice(index, 1);
			MAIN.cms.db.fs.remove(id);
			delete MAIN.cms.views[id];

			while (item) {
				index = MAIN.cms.db.pages.findIndex('parentid', item.id);
				if (index !== -1) {
					item = MAIN.cms.db.pages[index];
					MAIN.cms.db.pages.splice(index, 1);
					MAIN.cms.db.fs.remove(item.id);
					delete MAIN.cms.views[item.id];
				} else
					break;
			}

			$.success();
			MAIN.cms.save();
		} else
			$.invalid(404);

	}
});

NEWACTION('Pages|read|html', {
	input: '*id',
	route: '+API ?',
	user: true,
	permissions: 'pages,admin',
	action: function($, model) {
		let db = MAIN.cms.db;
		let item = db.pages.findItem('id', model.id);
		if (item) {
			db.fs.readbuffer(item.id, function(err, buffer) {
				let obj = {};
				obj.id = item.id;
				obj.layoutid = item.layoutid;
				obj.name = item.name;
				obj.html = buffer ? buffer.toString('utf8') : '';
				obj.url = item.url;
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

NEWACTION('Pages|save|html', {
	route: '+API ?',
	input: '*id,html',
	user: true,
	permissions: 'pages,admin',
	action: async function($, model) {
		let cms = MAIN.cms;
		let db = cms.db;
		let page = db.pages.findItem('id', model.id);
		if (page) {
			page.dtupdated = NOW;
			db.fs.save(model.id, model.id + '.html', Buffer.from(model.html, 'utf8'), $.done());
			cms.cache.pages = {};
			delete cms.views[model.id];
			cms.save();
		} else
			$.invalid(404);
	}
});

NEWACTION('Pages|copy', {
	route: '+API ?',
	input: '*from,*to',
	permissions: 'pages,admin',
	action: async function($, model) {

		let cms = MAIN.cms;
		let fromid = model.from;
		let toid = model.to;
		let db = cms.db;

		db.fs.readbuffer(fromid, function(err, buffer) {

			if (buffer) {
				let page = db.pages.findItem('id', toid);
				if (page) {
					db.fs.save(toid, toid + '.html', buffer, NOOP);
					page.dtupdated = NOW;
					cms.cache.pages = {};
					delete cms.views[toid];
					cms.save();
				}
			}

			$.success();
		});
	}
});

NEWACTION('Pages|clone', {
	route: '+API ?',
	input: '*id',
	permissions: 'pages,admin',
	action: async function($, model) {

		let id = model.id;
		let db = MAIN.cms.db;
		let item = db.pages.findItem('id', id);
		if (item) {

			item = CLONE(item);
			item.id = UID();
			item.dtcreated = NOW;
			item.dtupdated = NOW;
			item.name += ' (CLONED)';
			item.url = item.url.replace(/\/$/g, '-cloned/');

			delete item.dtupdated;
			db.pages.push(item);

			db.fs.readbuffer(id, function(err, buffer) {
				buffer && db.fs.save(item.id, item.id + '.html', buffer, NOOP);
				$.success(item.id);
				MAIN.cms.save();
			});

		} else
			$.invalid(404);

	}
});

NEWACTION('Layouts', {
	route: '+API ?',
	permissions: 'layouts,admin',
	action: function($) {
		let arr = [];
		for (let item of MAIN.cms.db.layouts)
			arr.push({ id: item.id, name: item.name, icon: item.icon, color: item.color, dtcreated: item.dtcreated, dtupdated: item.dtupdated });
		$.callback(arr);
	}
});

NEWACTION('Layouts|read', {
	route: '+API ?',
	input: '*id',
	permissions: 'layouts,admin',
	action: function($, model) {
		let db = MAIN.cms.db;
		let item = db.layouts.findItem('id', model.id);
		if (item) {
			db.fs.readbuffer(item.id, function(err, buffer) {
				item.html = buffer ? buffer.toString('utf8') : '';
				$.callback(item);
			});
		} else
			$.invalid(404);
	}
});

NEWACTION('Layouts|save', {
	route: '+API ? <5MB',
	input: 'id,*name,icon:Icon,color:Color,html',
	permissions: 'layouts,admin',
	action: function($, model) {
		importwidgets(model, function() {

			let cms = MAIN.cms;
			let db = cms.db;
			let html = model.html;

			delete model.html;

			if (model.id) {

				let item = db.layouts.findItem('id', model.id);
				if (!item) {
					$.invalid(404);
					return;
				}

				item.dtupdated = NOW;
				item.name = model.name;
				item.color = model.color;
				item.icon = model.icon;
				html && db.fs.save(model.id, model.id + '.html', html ? Buffer.from(html, 'utf8') : Buffer.alloc(0), NOOP);
				delete TEMP[item.id];

			} else {
				model.id = UID();
				model.dtcreated = NOW;
				html && db.fs.save(model.id, model.id + '.html', html ? Buffer.from(html, 'utf8') : Buffer.alloc(0), NOOP);
				db.layouts.push(model);
			}

			importnavigation(model, html, function() {
				cms.save();
				cms.refresh();
				$.success(model.id);
				delete cms.views[model.id];
			});
		});
	}
});

NEWACTION('Layouts|import', {
	route: '+API ?',
	input: '*name,*html',
	permissions: 'layouts,admin',
	action: async function($, model) {

		let db = MAIN.cms.db;
		let widgets = [];
		let arr = model.html.match(/<widget.*?>/g);
		if (arr) {
			for (let i = 0; i < arr.length; i++) {
				let item = arr[i];
				let index = item.indexOf(' data="');
				if (index !== -1) {
					try {
						let widget = decodeURIComponent(Buffer.from(item.substring(index + 7, item.indexOf('"', index + 8)), 'base64')).toString('utf8');
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
			ACTION('Widgets|save', { html: item }, function(err) {
				err && console.log(err);
				next();
			});
		}, function() {
			MAIN.cms.save();
			$.success();
		});

	}
});

NEWACTION('Layouts|remove', {
	route: '+API ?',
	input: '*id',
	permissions: 'layouts,admin',
	action: async function($, model) {
		let cms = MAIN.cms;
		let id = model.id;
		let index = cms.db.layouts.findIndex('id', id);
		if (index !== -1) {
			cms.db.layouts.splice(index, 1);
			cms.db.fs.remove(id);
			cms.refresh();
			cms.save();
			delete cms.views[id];
			$.success();
		} else
			$.invalid(404);
	}
});

NEWACTION('Layouts|clone', {
	route: '+API ?',
	input: '*id',
	permissions: 'layouts,admin',
	action: async function($, model) {
		let id = model.id;
		let db = MAIN.cms.db;
		let item = db.layouts.findItem('id', id);
		if (item) {

			item = CLONE(item);
			item.id = UID();
			item.dtcreated = NOW;
			item.name += ' (CLONED)';
			delete item.dtupdated;
			db.layouts.push(item);

			db.fs.readbuffer(id, function(err, buffer) {
				buffer && db.fs.save(item.id, item.id + '.html', buffer, NOOP);
				MAIN.cms.save();
				$.success(item.id);
			});

		} else
			$.invalid(404);
	}
});

NEWACTION('Layouts|read|html', {
	route: '+API ?',
	input: '*id',
	action: function($, model) {
		let db = MAIN.cms.db;
		let item = db.layouts.findItem('id', model.id);
		if (item) {
			db.fs.readbuffer(item.id, function(err, buffer) {
				let obj = {};
				obj.name = item.name;
				obj.html = buffer ? buffer.toString('utf8') : '';
				$.callback(obj);
			});
		} else
			$.invalid(404);
	}
});

NEWACTION('Layouts|preview|html', {
	route: '+GET ?layouts/preview/',
	query: '*id:String',
	user: true,
	action: function($) {
		MAIN.cms.render_layout($, $.query.id, function(err, response) {
			$.controller.response.minify = false;
			$.controller.html(response || '');
			$.cancel();
		});
	}
});

NEWACTION('Layouts|save|html', {
	route: '+API ? <5MB',
	input: '*id,html',
	permissions: 'layouts,admin',
	action: async function($, model) {

		let db = MAIN.cms.db;
		if (db.layouts.findItem('id', model.id)) {
			importnavigation(model, null, function(err, resave) {

				if (resave) {
					MAIN.cms.save();
					MAIN.cms.refresh();
				}

				importwidgets(model, function() {
					db.fs.save(model.id, model.id + '.html', Buffer.from(model.html, 'utf8'), $.done());
					MAIN.cms.cache.pages = {};
					delete MAIN.cms.views[model.id];
				});

			});
		} else
			$.invalid(404);
	}

});

NEWSCHEMA('@Nav/Link', 'id,icon:Icon,color:Color,*name,title,*url,arg,target,hidden:Boolean,highlight:Boolean,children:[@Nav/Link]');

NEWACTION('Nav', {
	name: 'List of all navigation',
	route: '+API ?',
	user: true,
	permissions: 'navigation',
	action: function($) {
		let arr = [];
		for (let item of MAIN.cms.db.nav)
			arr.push({ id: item.id, name: item.name, title: item.title, icon: item.icon, color: item.color, dtcreated: item.dtcreated, dtupdated: item.dtupdated });
		$.callback(arr);
	}
});

NEWACTION('Nav|read', {
	name: 'Read nav',
	input: '*id',
	route: '+API ?',
	user: true,
	permissions: 'navigation',
	action: function($, model) {
		let id = model.id;
		let item = MAIN.cms.db.nav.findItem('id', id);
		if (item)
			$.callback(item);
		else
			$.invalid(404);
	}
});

NEWACTION('Nav|save', {
	name: 'Save nav',
	input: 'id,uid:Lower,*name,title,icon:Icon,color:Color,children:[@Nav/Link]',
	route: '+API ?',
	user: true,
	permissions: 'navigation',
	action: function($, model) {

		let cms = MAIN.cms;
		let db = cms.db;

		if (!model.children)
			model.children = [];

		if (model.id) {

			let item = db.nav.findItem('id', model.id);
			if (!item) {
				$.invalid(404);
				return;
			}

			item.uid = model.uid;
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

		cms.save();
		cms.refresh();
		$.success();
	}
});

NEWACTION('Nav|remove', {
	input: '*id',
	route: '+API ?',
	user: true,
	permissions: 'navigation',
	action: function($, model) {
		let cms = MAIN.cms;
		let id = model.id;
		let index = cms.db.nav.findIndex('id', id);
		if (index !== -1) {
			cms.db.nav.splice(index, 1);
			$.success();
			cms.save();
			cms.refresh();
		} else
			$.invalid(404);
	}
});

NEWACTION('Redirects', {
	route: '+API ?',
	permissions: 'redirects,admin',
	action: function($) {
		let arr = [];
		for (let item of MAIN.cms.db.redirects)
			arr.push({ id: item.id, url: item.url, permanent: item.permanent, target: item.target, dtcreated: item.dtcreated, dtupdated: item.dtupdated });
		$.callback(arr);
	}
});

NEWACTION('Redirects|read', {
	route: '+API ?',
	input: '*id',
	permissions: 'redirects,admin',
	action: function($, model) {
		let item = MAIN.cms.db.redirects.findItem('id', model.id);
		if (item)
			$.callback(item);
		else
			$.invalid(404);
	}
});

NEWACTION('Redirects|save', {
	route: '+API ?',
	input: 'id,*url,*target,ispermanent:Boolean',
	permissions: 'redirects,admin',
	action: function($, model) {

		let db = MAIN.cms.db;

		model.url = U.normalize(model.url).toLowerCase();

		if (!(/^http(s)\:\/\//).test(model.target)) {
			if (!(/[#?]/).test(model.target))
				model.target = U.normalize(model.target);
		}

		if (model.id) {

			let item = db.redirects.findItem('id', model.id);
			if (!item) {
				$.invalid(404);
				return;
			}

			item.dtupdated = NOW;
			item.url = model.url;
			item.target = model.target;
			item.permanent = model.permanent;
		} else {
			model.id = UID();
			model.dtcreated = NOW;
			db.redirects.push(model);
		}

		MAIN.cms.save();
		$.success();
	}
});

NEWACTION('Redirects|remove', {
	route: '+API ?',
	input: '*id',
	permissions: 'redirects,admin',
	action: function($, model) {
		let id = model.id;
		let index = MAIN.cms.db.redirects.findIndex('id', id);
		if (index !== -1) {
			MAIN.cms.db.redirects.splice(index, 1);
			MAIN.cms.save();
			$.success();
		} else
			$.invalid(404);
	}
});


function importnavigation(model, html, callback) {

	if (!html && !model.html) {
		callback(null, false);
		return;
	}

	let index = -1;
	let nav = MAIN.cms.db.nav;
	let refresh = false;

	if (model.html)
		html = model.html;

	while (true) {

		index = html.indexOf(' type="text/navigation"', index);

		if (index === -1)
			break;

		let beg = html.lastIndexOf('<script', index);
		let end = html.indexOf('</script>', index);

		let scr = html.substring(beg, html.indexOf('>', index));
		let reg = scr.match(/id=".*?"/i);
		let uid = '';
		let name = '';

		if (reg) {
			uid = reg[0];
			uid = uid.substring(4, uid.length - 1);
			name = uid;
		} else {
			reg = scr.match(/name=".*?"/i)[0];
			uid = reg[0];
			uid = uid.substring(6, uid.length - 1);
			name = uid;
			uid = HASH(uid).toString(36); // Backward compatibility with old CMS
		}

		uid = uid.toLowerCase();
		let item = nav.findItem('uid', uid);

		if (!item) {
			nav.push({ id: UID(), uid: id, name: name.capitalize(), dtcreated: NOW, children: [] });
			refresh = true;
		}

		index = end;
	}

	callback(null, refresh);

}

function importwidgets(model, callback) {

	let widgets = [];
	let arr = model.html.match(/<widget.*?>/g);

	if (arr) {
		for (let item of arr) {
			let index = item.indexOf(' data="');
			if (index !== -1) {
				try {
					let widget = decodeURIComponent(Buffer.from(item.substring(index + 7, item.indexOf('"', index + 8)), 'base64')).toString('utf8');
					widget && widgets.push(widget);
				} catch (e) {}
			}
		}
	}

	model.html = model.html.replace(/<widget.*?>/g, '').trim();

	widgets.wait(function(item, next) {
		ACTION('Widgets|save', { html: item, singleton: true }).user({ sa: true }).callback(function(err) {
			err && console.log(err);
			next();
		});
	}, callback);

}

function browse(parent, callback) {
	let items = parent == null ? MAIN.cms.db.nav : parent.children;
	for (let item of items) {
		callback(item);
		if (item.children.length)
			browse(item, callback);
	}
}