exports.icon = 'ti ti-object-group';
exports.name = '@(Flow)';
exports.position = 5;
exports.permissions = [{ id: 'flow', name: 'Flow' }];
exports.visible = user => user.sa || user.permissions.includes('flow');
exports.config = [
	{ id: 'floweditor', name: 'Flow editor', value: 'https://flow.totaljs.com' }
];

var template = null;

exports.install = function() {

	ROUTE('+API   /admin/    -flow       * --> flow_token');
	ROUTE('+API   /admin/    -flow_ui    * --> flow_ui');

	ROUTE('SOCKET /$flow/', socket, 1024 * 8);

};

function socket() {
	var $ = this;
	Flow.socket('flowstream', $, function(client, next) {

		if (BLOCKED(client, 10)) {
			client.close(4001);
			return;
		}

		if (client.query.token === Flow.token) {
			BLOCKED(client, null);
			next();
		} else
			client.close(4001);
	});
}

Flow.on('save', function() {
	MAIN.db.fs.save('flow', 'flow.json', Buffer.from(JSON.stringify(Flow.db.flowstream, null, '\t')));
});

function refreshui() {

	var processed = {};
	var components = [];
	var flow = Flow.instances.flowstream.flow;
	var forms = MAIN.db?.storage?.forms || EMPTYARRAY;

	for (var item of forms) {

		item.group = 'UI Studio Apps';

		var tmp = ["{ id: 'render', name: 'No data' }"];

		if (item.inputs) {
			for (var m of item.inputs) {
				if (m.componentid === 'flowinput')
					tmp.push("{ id: '{0}', name: '{1}' }".format(m.id, m.name));
			}
		}

		item.inputs = tmp.join(', ');

		if (item.outputs) {
			tmp = [];
			for (var m of item.outputs) {
				if (m.componentid === 'flowoutput')
					tmp.push("{ id: '{0}', name: '{1}' }".format(m.id, m.name));
			}
			item.outputs = tmp.length ? tmp.join(', ') : '';
		}

		item.url = '/render/' + item.id + '/';
		item.uid = 'ui' + item.id;

		processed[item.uid] = 1;
		components.push({ id: item.uid, html: template(item) });
	}

	// Create components
	components.wait(function(item, next) {
		flow.add(item.id, item.html);
		setTimeout(next, 100);
	}, function() {

		var db = flow.meta.components;
		var remove = [];

		for (var key in db) {
			var com = db[key];
			if (com.uistudio) {
				if (!processed[com.id])
					remove.push(com.id);
			}
		}

		remove.wait(function(id, next) {
			flow.unregister(id, next);
		}, function() {
			flow.save();
			flow.redraw();
		});
	});

}

ON('forms.refresh', refreshui);

ON('reload', function() {

	var loadflow = function(response) {
		Flow.token = GUID();
		Flow.load(response, function() {
			F.Fs.readFile(PATH.plugins('flow/flow-ui.html'), 'utf8', function(err, response) {
				template = Tangular.compile(response);
				refreshui();
			});
		});
	};

	MAIN.db.fs.readjson('flow', function(err, response) {
		if (response)
			loadflow(response);
		else
			F.Fs.readFile(PATH.plugins('flow/flow.json'), 'utf8', (err, response) => loadflow(response.parseJSON(true)));
	});

	// IMPORT widgets
	PLUGINS.widgets.create(PATH.plugins(exports.id + '/widget.html'), ERROR('Flow.widget'));

});

NEWACTION('flow_token', {
	name: 'Flow: Token',
	permissions: 'flow',
	action: function($) {
		$.callback({ url: CONF.floweditor, token: Flow.token });
	}
});

NEWACTION('flow_ui', {
	name: 'Flow: List of UI flows',
	permissions: 'flow',
	action: function($) {
		var output = [];
		var flowstream = Flow.instances.flowstream.flow;
		var schema = flowstream.meta.flow;
		for (let key in schema) {
			let instance = schema[key];
			if (instance.module && instance.module.id === 'uistart')
				output.push({ id: key, name: instance.config.name });
		}
		output.quicksort('name');
		$.callback(output);
	}
});