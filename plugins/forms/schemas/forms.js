function Storage() {
	return MAIN.db.storage.forms;
}

NEWACTION('Forms/list', {
	name: 'List of forms',
	action: function($) {
		$.callback(Storage());
	}
});

NEWACTION('Forms/read', {
	name: 'Read form',
	params: '*id:String',
	action: function($) {

		var params = $.params;
		var item = Storage().findItem('id', params.id);

		if (!item) {
			$.invalid(404);
			return;
		}

		MAIN.db.fs.readjson(params.id, function(err, response) {
			if (response)
				$.callback({ editor: response });
			else
				$.invalid(404);
		});
	}
});

NEWACTION('Forms/save', {
	name: 'Save form',
	input: 'data:Object',
	action: async function($, model) {

		var db = Storage();
		var data = model.data;
		var item = db.findItem('id', data.id);

		var obj = {};
		obj.id = data.id;
		obj.icon = data.icon;
		obj.color = data.color;
		obj.name = data.name;
		obj.version = data.version;
		obj.author = data.author;
		obj.type = data.type;
		obj.dtupdated = NOW;
		obj.inputs = data.inputs;
		obj.outputs = data.outputs;

		await MAIN.db.fs.save(obj.id, 'editor.json', Buffer.from(JSON.stringify(data), 'utf8'));

		if (item) {
			COPY(obj, item);
		} else {
			obj.dtcreated = NOW;
			db.push(obj);
		}

		F.TUIBuilder.compile({ schema: data, download: true }, function(err, response) {
			MAIN.db.fs.save(data.id + '_compiled', 'compiled.json', Buffer.from(JSON.stringify(response), 'utf8'));
		});

		db.quicksort('name');
		FUNC.save();
		$.success(data.id);
		EMIT('forms.refresh', data.id);
	}
});

NEWACTION('Forms/remove', {
	name: 'Remove form',
	params: '*id:String',
	action: function($) {

		var db = Storage();
		var params = $.params;
		var index =db.findIndex('id', params.id);

		if (index === -1) {
			$.invalid(404);
			return;
		}

		db.splice(index, 1);

		MAIN.db.fs.remove(params.id, NOOP);
		MAIN.db.fs.remove(params.id + '_compiled', NOOP);

		FUNC.save();
		$.success(params.id);
		EMIT('forms.refresh');
	}
});