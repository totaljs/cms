NEWSCHEMA('Notice').make(function(schema) {

	schema.define('id', 'UID');
	schema.define('idcategory', 'String(50)', true);
	schema.define('name', 'String(200)', true);
	schema.define('author', 'String(30)', true);
	schema.define('body', String, true);
	schema.define('date', Date);
	schema.define('event', Date);
	schema.define('icon', 'Lower(40)');
	schema.define('ispinned', Boolean);
	schema.define('url', 'String(500)');

	// Gets listing
	schema.setQuery(function($) {

		var opt = $.options === EMPTYOBJECT ? $.query : $.options;
		var isAdmin = $.controller ? $.controller.name === 'admin' : false;
		var filter = NOSQL('notices').find();

		filter.paginate(opt.page, opt.limit, 70);

		if (isAdmin) {
			opt.author && filter.adminFilter('author', opt, String);
			opt.name && filter.adminFilter('name', opt, String);
			opt.category && filter.adminFilter('category', opt, String);
		} else {
			opt.author && filter.where('author', opt.author);
			opt.category && filter.where('idcategory', opt.category);
			opt.published && filter.where('date', '<=', F.datetime);
			opt.search && filter.like('search', opt.search.keywords(true, true));
			opt.ispinned != null && filter.where('ispinned', opt.ispinned);
			opt.event && filter.where('event', '>', F.datetime.add('-1 day'));
			filter.fields('body');
		}

		filter.fields('id', 'idcategory', 'category', 'date', 'name', 'author', 'icon', 'datecreated', 'ispinned', 'event', 'url');

		if (opt.sort)
			filter.adminSort(opt.sort);
		else
			filter.sort('datecreated', true);

		filter.callback(function(err, docs, count) {
			!isAdmin && prepare_body(docs);
			$.callback(filter.adminOutput(docs, count));
		});
	});

	// Gets a specific post
	schema.setGet(function($) {

		var options = $.options;
		var filter = NOSQL('notices').one();
		var id = options.id || $.id;
		filter.where('id', id);
		filter.callback($.callback, 'error-notices-404');
		ADMIN.alert($.user, 'notices/edit', id);
	});

	// Removes a specific post
	schema.setRemove(function($) {
		var id = $.body.id;
		var user = $.user.name;
		NOSQL('notices').remove().backup(user).log('Remove: ' + id, user).where('id', id).callback(function() {
			F.cache.removeAll('cachecms');
			$.success();
		});
	});

	schema.addWorkflow('preview', function($) {
		$.callback(markdown($.options));
	});

	// Saves the post into the database
	schema.setSave(function($) {

		var model = $.model.$clean();
		var user = $.user.name;
		var isUpdate = !!model.id;
		var nosql = NOSQL('notices');

		if (isUpdate) {
			model.dateupdated = F.datetime;
			model.adminupdated = user;
		} else {
			model.id = UID();
			model.admincreated = user;
			model.datecreated = F.datetime;
		}

		!model.date && (model.date = F.datetime);

		var category = F.global.config.notices.findItem('id', model.idcategory);

		model.category = category ? category.name : '';
		model.search = ((model.name || '') + ' ' + (model.body || '')).keywords(true, true).join(' ').max(1000);

		var db = isUpdate ? nosql.modify(model).where('id', model.id).backup(user).log('Update: ' + model.id, user) : nosql.insert(model).log('Create: ' + model.id, user);

		db.callback(function() {
			$SAVE('Event', { type: 'notices/save', id: model.id, user: user, body: model.name, admin: true }, NOOP, $);
			EMIT('notices.save', model);
			F.cache.removeAll('cachecms');
			$.success();
		});

	});

	// Clears database
	schema.addWorkflow('clear', function($) {
		var user = $.user.name;
		NOSQL('notices').remove().backup(user).log('Clear all notices', user).callback(() => $.success());
	});
});

function prepare_body(items) {
	for (var i = 0, length = items.length; i < length; i++) {
		var item = items[i];
		item.body = markdown(item.body).CMSglobals();
	}
}

String.prototype.markdown = function() {
	return markdown(this);
};

function markdown(md) {

	var links = /(!)?\[.*?\]\(.*?\)/g;
	var imagelinks = /\[!\[.*?\]\(.*?\)\]\(.*?\)/g;
	var format = /__.*?__|_.*?_|\*\*.*?\*\*|\*.*?\*|~.*?~/g;
	var code = /`.*?`/g;
	var lines = md.split('\n');
	var builder = [];
	var ul = false;
	var table = false;
	var code = false;

	for (var i = 0, length = lines.length; i < length; i++) {

		if (lines[i].substring(0, 3) === '```') {

			if (code) {
				builder.push('</code></pre>');
				code = false;
				continue;
			}

			code = true;
			builder.push('<pre><code class="' + lines[i].substring(3) + '">');
			continue;
		}

		if (code) {
			builder.push(lines[i]);
			continue;
		}

		var line = lines[i].replace(imagelinks, markdown_imagelinks).replace(links, markdown_links).replace(format, markdown_format).replace(code, markdown_code);

		if (!line) {
			if (table) {
				table = null;
				builder.push('</table>');
			}
		}

		if (line === '' && lines[i - 1] === '') {
			builder.push('<br />');
			continue;
		}

		if (line[0] === '|') {
			if (!table) {
				var next = lines[i + 1];
				if (next[0] === '|') {
					table = [];
					var columns = next.substring(1, next.length - 1).split('|');
					for (var j = 0; j < columns.length; j++) {
						var column = columns[j].trim();
						var align = 'left';
						if (column[column.length - 1] === ':')
							align = column[0] === ':' ? 'center' : 'right';
						table.push(align);
					}
					builder.push('<table class="table table-bordered">');
					i++;
				} else
					continue;
			}
			builder.push(markdown_table(line, table));
			continue;
		}

		if (line[0] === '#') {

			if (line.substring(0, 2) === '# ') {
				builder.push('<h1>' + line.substring(2).trim() + '</h1>');
				continue;
			}

			if (line.substring(0, 3) === '## ') {
				builder.push('<h2>' + line.substring(3).trim() + '</h2>');
				continue;
			}

			if (line.substring(0, 4) === '### ') {
				builder.push('<h3>' + line.substring(4).trim() + '</h3>');
				continue;
			}

			if (line.substring(0, 5) === '#### ') {
				builder.push('<h4>' + line.substring(5).trim() + '</h4>');
				continue;
			}
		}

		if (line[0] === '>' && line.substring(0, 2) === '> ') {
			builder.push('<blockquote>' + line.substring(2).trim() + '</blockquote>');
			continue;
		}

		if (line[0] === '-' && line.substring(0, 2) === '- ') {
			if (!ul) {
				builder.push('<ul>');
				ul = true;
			}
			builder.push('<li>' + line.substring(2).trim() + '</li>');
		} else {
			if (ul) {
				builder.push('</ul>');
				ul = false;
			}
			line && builder.push('<p>' + line.trim() + '</p>');
		}
	}

	ul && builder.push('</ul>');
	table && builder.push('</table>');
	code && builder.push('</code></pre>');

	return U.minifyHTML('<div class="markdown">' + builder.join('\n') + '</div>');
}

function markdown_code(value) {
	return '<code>' + value.substring(1, value.length - 1) + '</code>';
}

function markdown_imagelinks(value) {
	var end = value.indexOf(')') + 1;
	var img = value.substring(1, end);
	return '<a href="' + value.substring(end + 2, value.length - 1) + '">' + markdown_links(img) + '</a>';
}

function markdown_table(value, align) {

	var columns = value.substring(1, value.length - 1).split('|');
	var builder = '';

	for (var i = 0; i < columns.length; i++) {
		var column = columns[i].trim();
		if (column[0] == '-')
			continue;
		var a = align[i];
		builder += '<td' + (a && a !== 'left' ? (' class="' + a + '"') : '') + '>' + column + '</td>';
	}

	return '<tr>' + builder + '</tr>';
}

function markdown_links(value) {
	var end = value.indexOf(']');
	var img = value[0] === '!';
	var text = value.substring(img ? 2 : 1, end);
	var link = value.substring(end + 2, value.length - 1);
	return img ? ('<img src="' + link + '" alt="' + text + '" class="img-responsive" border="0" />') : ('<a href="' + link + '">' + text + '</a>');
}

function markdown_format(value) {
	var clean = /_|\*|~/g;
	switch (value[0]) {
		case '_':
			return '<strong>' + value.replace(clean, '') + '</strong>';
		case '*':
			return '<em>' + value.replace(clean, '') + '</em>';
	}
	return value;
}