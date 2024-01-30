exports.icon = 'ti ti-plug';
exports.name = '@(Widgets)';
exports.position = 4;
exports.permissions = [{ id: 'widgets', name: 'Widgets' }];
exports.visible = user => user.sa || user.permissions.includes('widgets');

exports.install = function() {

	ROUTE('+API    ?    +widgets_save     <5MB  --> Widgets/save');
	ROUTE('+API    ?    -widgets_list           --> Widgets/list');
	ROUTE('+API    ?    -widgets_read/{id}      --> Widgets/read');
	ROUTE('+API    ?    -widgets_remove/{id}    --> Widgets/remove');
	ROUTE('+API    ?    -widgets_detail/{id}    --> Widgets/detail');

};

exports.create = function(html, rewrite, callback) {

	if (typeof(rewrite) === 'function') {
		callback = rewrite;
		rewrite = false;
	}

	if (!callback)
		callback = NOOP;

	if (html.indexOf('<') === -1) {
		// filename?
		F.Fs.readFile(html, 'utf8', function(err, response) {
			if (err)
				callback(err);
			else
				exports.create(response, rewrite, callback);
		});
		return;
	}

	var widgets = [];
	var arr = html.match(/<widget.*?>/g);
	var error = new ErrorBuilder();

	if (arr) {
		for (var i = 0; i < arr.length; i++) {
			var item = arr[i];
			var index = item.indexOf(' data="');
			if (index !== -1) {
				try {
					var widget = decodeURIComponent(Buffer.from(item.substring(index + 7, item.indexOf('"', index + 8)), 'base64')).toString('utf8');
					widget && widgets.push(widget);
				} catch (e) {
					error.push(e);
				}
			}
		}
	} else {
		// HTML is a widget
		widgets.push(html);
	}

	widgets.wait(function(item, next) {
		ACTION('Widgets/save', { html: item, singleton: rewrite !== true }).user({ sa: true }).callback(function(err) {
			err && error.push(err);
			next();
		});
	}, () => callback(error.length ? error : null));

};