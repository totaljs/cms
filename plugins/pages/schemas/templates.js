const Fs = require('fs');

NEWSCHEMA('Templates', function(schema) {

	schema.define('id', UID);
	schema.define('type', ['page', 'post', 'newsletter'], true);
	schema.define('name', 'String(50)', true);
	schema.define('body', String, true);

	schema.setGet(function($) {
		NOSQL('templates').one().where('id', $.id).callback($.callback, 'error-templates-404');
	});

	schema.setSave(function($) {

		var db = NOSQL('templates');
		var model = $.clean();

		var done = function() {
			refresh($.done($.model.id));
		};

		if (model.id) {
			model.id = undefined;
			model.dtupdated = NOW;
			db.modify(model).where('id', $.model.id).callback(done);
		} else {
			$.model.id = model.id = UID();
			model.dtcreated = NOW;
			model.dtupdated = NOW;
			db.insert(model).callback(done);
		}
	});
});

function refresh(callback) {

	var pages = [];
	var newsletters = [];
	var posts = [];

	NOSQL('templates').find().callback(function(err, response) {
		var hash = Date.now();
		response.wait(function(item, next) {
			var compiled = compile(item.body);
			item.file = 'cms' + item.id;

			compiled.html = '@{notranslate}@{nocompress html}' + compiled.html.replace('</body>', item.type === 'newsletter' ? '@{if repository.preview}<script src="//cdn.componentator.com/jquery.min@341.js"></script><script src="@{MAIN.jseditor}"></script>@{fi}' : '@{if repository.preview}<script src="//cdn.componentator.com/jquery.min@341.js"></script><script src="@{MAIN.jseditor}"></script>@{else}<script src="/js/cms.js"></script><script src="@{MAIN.js}"></script><script src="/' + item.file + '.js?ts=' + hash + '"></script>@{fi}</body>');

			if (item.type !== 'newsletter')
				compiled.html = compiled.html.replace('</head>', '<link rel="stylesheet" href="//cdn.componentator.com/spa.min@18.css" /><link rel="stylesheet" href="@{MAIN.css}" /><link rel="stylesheet" href="/' + item.file + '.css?ts=' + hash + '" />@{if repository.preview}<link rel="stylesheet" href="/css/admin-editor.css" />@{else}<script src="//cdn.componentator.com/spa.min@18.js"></script>@{fi}@{import(\'meta\', \'favicon.ico\', \'head\')}</head>');

			Fs.writeFile(PATH.views(item.file + '.html'), U.minifyHTML(compiled.html), function() {
				Fs.writeFile(PATH.public(item.file + '.js'), compiled.js ? U.minifyScript(compiled.js) : '', function() {
					Fs.writeFile(PATH.public(item.file + '.css'), compiled.css ? U.minifyStyle('/*auto*/\n' + compiled.css) : '', function() {
						item.body = undefined;
						switch (item.type) {
							case 'page':
								pages.push(item);
								break;
							case 'post':
								posts.push(item);
								break;
							case 'newsletter':
								newsletters.push(item);
								break;
						}

						var navigations = PREF.navigations.remove('templateid', item.id);

						for (var i = 0; i < compiled.navigations.length; i++) {
							var nav = compiled.navigations[i];
							nav.templateid = item.id;
							navigations.push(nav);
						}

						PREF.set('navigations', navigations);

						// HACK: clears Total.js ViewEngine cache
						delete F.temporary.views['view#' + item.file + '.html'];
						F.touch('/' + item.file + '.js');
						F.touch('/' + item.file + '.css');
						next();
					});
				});
			});
		}, function() {
			PREF.templates = pages;
			PREF.templatesposts = posts;
			PREF.templatesnewsletters = newsletters;
			F.cache.removeAll('cachecms');
			callback && callback();
		});
	});
}

function compile(html) {

	var beg = -1;
	var end = -1;
	var body_script = '';
	var body_style = '';
	var body_html = '';
	var navigations = [];

	html = html.replace(/@\{navigation.*?\}/g, function(text) {
		var str = text.substring(13, text.length - 1).trim();
		var beg = str.indexOf(':');
		navigations.push({ id: str.substring(0, beg).trim(), name: str.substring(beg + 1).trim() });
		return '';
	});

	var raw = html;

	while (true) {

		beg = html.indexOf('<script', end);
		if (beg === -1)
			break;

		end = html.indexOf('</script>', beg);
		if (end === -1)
			break;

		var body = html.substring(beg, end);
		var beg = body.indexOf('>') + 1;
		var type = body.substring(0, beg);

		if (!(/html|plain/i).test(type)) {
			body = body.substring(beg);
			raw = raw.replace(type + body + '</script>', '');
			body = body.trim();
			body_script = body;
		}

		end += 9;
	}

	beg = raw.indexOf('<style');
	if (beg !== -1) {
		end = raw.indexOf('</style>');
		var tmp = raw.substring(raw.indexOf('>', beg) + 1, end);
		raw = raw.replace(raw.substring(beg, end + 8), '');
		body_style = tmp.trim();
	}

	if (!body_html) {
		raw = raw.trim();
		raw && (body_html = raw);
	}

	var obj = {};
	obj.js = body_script;
	obj.css = body_style;
	obj.html = body_html;
	obj.navigations = navigations;
	return obj;
}

ON('settings', function() {
	refresh();
});