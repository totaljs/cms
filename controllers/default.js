const REG_META = /<\/head>/;
const REG_UI = /@\{ui\}/i;
const REG_YEAR = /@\{year\}/i;
const REG_VARS = /\$[a-z0-9A-Z]+/g;

exports.install = function() {
	ROUTE('+GET ?*', admin);
	ROUTE('GET  /*', render);
	ROUTE('FILE /sitemap.xml', sitemap);
};

function admin($) {

	var plugins = [];

	if ($.user.openplatform && !$.user.iframe && $.query.openplatform) {
		$.cookie(CONF.op_cookie, $.query.openplatform, NOW.add('12 hours'));
		$.redirect($.url);
		return;
	}

	var hostname = $.hostname();

	if (CONF.url !== hostname)
		CONF.url = hostname;

	for (var key in F.plugins) {
		var item = F.plugins[key];
		if (!item.visible || item.visible($.user)) {
			var obj = {};
			obj.id = item.id;
			obj.position = item.position;
			obj.name = TRANSLATE($.user.language || '', item.name);
			obj.icon = item.icon;
			obj.import = item.import;
			obj.routes = item.routes;
			obj.hidden = item.hidden;
			plugins.push(obj);
		}
	}

	$.view('admin', plugins);
}

function variables(text) {
	var val = MAIN.db.vars[text.substring(1)];
	return val == null ? text : val;
}

function navigation(id) {

	var nav = this.nav[id] || { children: EMPTYARRAY };

	nav.current = null;

	if (nav.links) {
		for (var m of nav.links) {
			if (!nav.current && m.url === this.url)
				nav.current = m;
			m.selected = false;
		}
	}

	var parent = nav.current;

	while (parent) {
		parent.selected = true;
		parent = parent.parent;
	}

	nav.url = this.url;
	nav.page = this.page;

	return nav;
}

function compile_page(id, widgets, callback) {
	MAIN.db.fs.readbuffer(id, function(err, buffer) {
		if (err) {
			callback(err);
		} else {

			var html = buffer ? buffer.toString('utf8') : '';
			var value = {};
			value.id = id;
			value.html = html;
			value.widgets = widgets;

			TRANSFORM('page', value, function(err, value) {
				MAIN.views[id] = F.TCMS.compile(value.html.replace(REG_UI, REPO.webui).replace(REG_YEAR, NOW.getFullYear() + ''), widgets);
				callback(null, MAIN.views[id]);
			});

		}
	});
}

function compile_layout(id, widgets, callback) {
	MAIN.db.fs.readbuffer(id, function(err, buffer) {
		if (err) {
			callback(err);
		} else {

			var html = buffer ? buffer.toString('utf8') : '';
			var value = {};

			value.id = id;
			value.html = html;
			value.widgets = widgets;

			TRANSFORM('layout', value, function(err, value) {
				MAIN.views[id] = F.TCMS.compile(value.html.replace(REG_UI, REPO.webui).replace(REG_YEAR, NOW.getFullYear() + ''), widgets).importcss().importjs();
				callback(null, MAIN.views[id]);
			});

		}
	});
}

function render($) {

	var db = MAIN.db;
	var url = $.url;
	var page = null;

	if (!db.ready) {
		$.fallback(404);
		return;
	}

	for (let item of db.redirects) {
		if (!item.disabled && item.url === url) {
			$.redirect(item.target, item.permanent == true);
			return;
		}
	}

	// Try to find pages for authorized users
	if ($.user) {
		for (let item of db.pages) {
			if (!item.disabled && item.auth && item.url === url) {
				page = item;
				break;
			}
		}
	}

	if (!page) {
		for (let item of db.pages) {
			if (!item.disabled && !item.auth && item.url === url) {
				page = item;
				break;
			}
		}
	}

	if (!page) {
		if (url === '/' && MAIN.admin.user.raw)
			$.redirect('/admin/');
		else
			$.fallback(404);
		return;
	}

	if (!db.refs)
		db.refs = {};

	if (!db.vars)
		db.vars = {};

	var opt = {};
	var cache = MAIN.cache.pages;
	var key = page.id;

	if (!cache[key])
		cache[key] = {};

	opt.inlinecache = cache[key];
	opt.controller = $;
	opt.vars = db.vars;
	opt.refs = db.refs;
	opt.widgets = MAIN.cache.widgets || EMPTYARRAY;
	opt.nav = MAIN.cache.nav;
	opt.url = url;
	opt.user = $.user;
	opt.ua = $.req.headers['user-agent'];

	if (opt.ua)
		opt.ua = opt.ua.parseUA(true);
	else
		opt.ua = EMPTYOBJECT;

	opt.mobile = $.mobile;
	opt.robot = $.robot;
	opt.breadcrumb = FUNC.breadcrumb(url);
	opt.page = page;
	opt.navigation = navigation;

	opt.callback = function(err, response) {
		TRANSFORM('render', response, function(err, response) {
			if (response.css && response.css.length)
				response.html = response.html.replace(/<\/style>/, '\n' + U.minify_css(response.css.join('')) + '</style>');
			$.html(response.html);
		}, $);
	};

	var title = page.title || page.name;
	var meta = '';

	if (title)
		meta += '<title>' + title.safehtml() + (opt.url !== '/' ? (' - ' + CONF.name) : '') + '</title>';

	if (page.description)
		meta += '<meta name="description" content="' + page.description.safehtml() + '" />';

	if (page.keywords)
		meta += '<meta name="keywords" content="' + page.keywords.safehtml() + '" />';

	meta += '<scri' + 'pt src="/visitors.js"></scr' + 'ipt>';

	var cmspage = MAIN.views[page.id];
	var cmslayout = page.layoutid ? MAIN.views[page.layoutid] : 1;

	if (cmslayout && cmslayout.scripts && cmslayout.scripts.length) {
		for (var m of cmslayout.scripts)
			meta += '<scri' + 'pt src="' + m + '"></scr' + 'ipt>';
	}

	if (cmspage && cmslayout) {
		opt.cache = cmspage.cache;
		cmspage.render(opt, cmslayout === 1 ? null : cmslayout, function(err, response) {
			if (err) {
				$.fallback(404);
			} else {
				$.response.minify = false;
				$.html(response.replace(REG_META, meta).replace(REG_VARS, variables));
			}
		});
	} else if (cmspage && !cmslayout) {
		compile_layout(page.layoutid, opt.widgets, function(err, cmslayout) {

			if (err) {
				$.fallback(404);
				return;
			}

			cmspage.render(opt, cmslayout === 1 ? null : cmslayout, function(err, response) {
				if (err) {
					$.fallback(404);
				} else {
					$.response.minify = false;
					$.html(response.replace(REG_META, meta).replace(REG_VARS, variables));
				}
			});
		});
	} else if (!cmspage && cmslayout) {
		compile_page(page.id, opt.widgets, function(err, cmspage) {

			if (err) {
				$.fallback(404);
				return;
			}

			opt.cache = cmspage.cache;
			cmspage.render(opt, cmslayout === 1 ? null : cmslayout, function(err, response) {
				if (err) {
					$.fallback(404);
				} else {
					$.response.minify = false;
					$.html(response.replace(REG_META, meta).replace(REG_VARS, variables));
				}
			});
		});
	} else {
		compile_page(page.id, opt.widgets, function(err, cmspage) {

			if (err) {
				$.fallback(404);
				return;
			}

			compile_layout(page.layoutid, opt.widgets, function(err, cmslayout) {

				if (err) {
					$.fallback(404);
					return;
				}

				opt.cache = cmspage.cache;
				cmspage.render(opt, cmslayout === 1 ? null : cmslayout, function(err, response) {
					if (err) {
						$.fallback(404);
					} else {
						$.response.minify = false;
						$.html(response.replace(REG_META, meta).replace(REG_VARS, variables));
					}
				});
			});
		});
	}
}

function sitemap($) {

	let builder = [];
	let hostname = $.hostname();

	if (MAIN.db.pages) {
		for (let item of MAIN.db.pages) {
			if (!item.disabled || item.url[0] !== '/')
				builder.push('<url><loc>{0}{1}</loc><lastmod>{2}</lastmod></url>'.format(hostname, item.url, (item.dtcreated || item.dtupdated).format('yyyy-MM-dd')));
		}
	}

	$.xml('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{0}</urlset>'.format(builder.join('')));
}