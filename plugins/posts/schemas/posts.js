NEWSCHEMA('Posts', '*name,category,picture,reference,summary,body,icon:Icon,color:Color,ishidden:Boolean,date:Date');

NEWACTION('Posts/list', {
	name: 'List of posts',
	permissions: 'posts',
	action: function($) {
		DATA.list(PLUGINS.posts.db).autoquery($.query, 'id,picture,summary,reference,category,icon,color,name,ishidden,dtupdated,date', 'date_desc', 100).callback($);
	}
});

NEWACTION('Posts/read', {
	name: 'Read post',
	params: '*id:String',
	permissions: 'posts',
	action: function($) {
		DATA.read(PLUGINS.posts.db).id($.params.id).error('@(Post not found)').callback($);
	}
});

NEWACTION('Posts/categories', {
	name: 'Read all categories',
	action: async function($) {
		var items = await DATA.scalar(PLUGINS.posts.db, 'group', 'category').promise($);
		var output = [];
		for (var item of items)
			output.push({ id: item.category, name: item.category });
		$.callback(output);
	}
});

NEWACTION('Posts/create', {
	name: 'Create post',
	input: '@Posts',
	permissions: 'posts',
	action: function($, model) {

		model.id = UID();
		model.dtcreated = NOW;
		model.dtupdated = NOW;
		model.linker = model.name.slug();
		model.search = model.name.toSearch();

		if (!model.date)
			model.date = NOW;

		DATA.insert(PLUGINS.posts.db, model).callback($.done(model.id));
	}
});

NEWACTION('Posts/update', {
	name: 'Update post',
	params: '*id:String',
	input: '@Posts',
	permissions: 'posts',
	action: function($, model) {

		model.dtupdated = NOW;
		model.search = model.name.toSearch();
		model.linker = model.name.slug();

		if (!model.date)
			model.date = NOW;

		DATA.modify(PLUGINS.posts.db, model).id($.params.id).error('@(Post not found)').callback($.done($.params.id));
	}
});

NEWACTION('Posts/clear', {
	name: 'Clear all posts',
	permissions: 'posts',
	action: function($) {
		DATA.remove(PLUGINS.posts.db).callback($.done());
	}
});

NEWACTION('Posts/remove', {
	name: 'Remove post',
	params: '*id:String',
	permissions: 'posts',
	action: function($) {
		DATA.remove(PLUGINS.posts.db).id($.params.id).error('@(Post not found)').callback($.done());
	}
});