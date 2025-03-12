NEWACTION('Redirects/list', {
	name: 'List of redirects',
	permissions: 'redirects,admin',
	action: function($) {

		var arr = [];
		for (var item of MAIN.db.redirects)
			arr.push({ id: item.id, url: item.url, permanent: item.permanent, target: item.target, dtcreated: item.dtcreated, dtupdated: item.dtupdated });

		$.callback(arr);
	}
});

NEWACTION('Redirects/read', {
	name: 'Read redirect',
	input: '*id',
	permissions: 'redirects,admin',
	action: function($, model) {
		var item = MAIN.db.redirects.findItem('id', model.id);
		if (item)
			$.callback(item);
		else
			$.invalid(404);
	}
});

NEWACTION('Redirects/save', {
	name: 'Save redirect',
	input: 'id,*url,*target,permanent:Boolean',
	permissions: 'redirects,admin',
	action: function($, model) {

		var db = MAIN.db;

		model.url = U.normalize(model.url).toLowerCase();

		if (!(/^http(s)\:\/\//).test(model.target)) {
			if (!(/[#?]/).test(model.target))
				model.target = U.normalize(model.target);
		}

		if (model.id) {

			var item = db.redirects.findItem('id', model.id);
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

		FUNC.save();
		$.success();
	}
});

NEWACTION('Redirects/remove', {
	name: 'Remove redirect',
	input: '*id',
	permissions: 'redirects,admin',
	action: function($, model) {
		var id = model.id;
		var index = MAIN.db.redirects.findIndex('id', id);
		if (index !== -1) {
			MAIN.db.redirects.splice(index, 1);
			FUNC.save();
			$.success();
		} else
			$.invalid(404);
	}
});
