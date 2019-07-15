NEWSCHEMA('PartData', function(schema) {

	// Id generated on client-side
	schema.define('id', 'String(20)');

	// List of dynamic widgets in this part
	schema.define('widgets', '[Object]');

	// Data
	schema.define('name', 'String(50)', true);
	schema.define('body', 'String', true);

	// Widget container category
	schema.define('category', 'Capitalize');
});

NEWSCHEMA('Part', function(schema) {

	// Owner
	schema.define('idowner', 'UID');

	// page, post
	schema.define('type', 'Lower');

	// List of dynamic widgets in this part
	schema.define('items', '[PartData]');

	schema.setSave(function($) {
		var model = $.model;
		model.dateupdated = NOW;
		NOSQL('parts').remove().where('idowner', model.idowner).callback(function() {
			for (var i = 0; i < model.items.length; i++) {
				var item = model.items[i];
				item.idowner = model.idowner;
				item.type = model.type;
				FUNC.write('parts', item.id, U.minifyHTML(item.body), true);
				item.body = undefined;
				NOSQL('parts').update(item, true).where('id', item.id);
			}
			$.success();
		});
	});

	schema.addWorkflow('render', function($) {
		NOSQL('parts').find().where('id', $.options.id).first().callback(function(err, response) {
			if (response) {
				FUNC.read('parts', response.id, function(err, body) {
					response.body = body;
					response.body.CMSrender(response.widgets, $.callback, $.controller);
				});
			} else
				$.callback('');
		});
	});

});