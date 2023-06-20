NEWSCHEMA('Posts', function(schema) {

	schema.define('name', String, true);
	schema.define('category', String);
	schema.define('picture', String);
	schema.define('reference', String);
	schema.define('summary', String);
	schema.define('body', String);
	schema.define('icon', 'Icon');
	schema.define('color', 'Color');
	schema.define('ishidden', Boolean);
	schema.define('date', Date);

	schema.action('list', {
		name: 'List of posts',
		permissions: 'posts',
		action: function($) {
			DB().list(MAIN.db_posts).autoquery($.query, 'id,picture,summary,reference,category,icon,color,name,ishidden,dtupdated,date', 'date_desc', 100).callback($.callback);
		}
	});

	schema.action('read', {
		name: 'Read post',
		params: '*id:String',
		permissions: 'posts',
		action: function($) {
			DB().read(MAIN.db_posts).id($.params.id).error('@(Post not found)').callback($.callback);
		}
	});

	schema.action('categories', {
		name: 'Read all categories',
		action: async function($) {
			var items = await DB().scalar(MAIN.db_posts, 'group', 'category').promise($);
			var output = [];
			for (var item of items)
				output.push({ id: item.category, name: item.category });
			$.callback(output);
		}
	});

	schema.action('create', {
		name: 'Create post',
		permissions: 'posts',
		action: function($, model) {

			model.id = UID();
			model.dtcreated = NOW;
			model.dtupdated = NOW;
			model.linker = model.name.slug();
			model.search = model.name.toSearch();

			if (!model.date)
				model.date = NOW;

			DB().insert(MAIN.db_posts, model).callback($.done(model.id));
		}
	});

	schema.action('update', {
		name: 'Update post',
		params: '*id:String',
		permissions: 'posts',
		action: function($, model) {

			model.dtupdated = NOW;
			model.search = model.name.toSearch();
			model.linker = model.name.slug();

			if (!model.date)
				model.date = NOW;

			DB().modify(MAIN.db_posts, model).id($.params.id).error('@(Post not found)').callback($.done($.params.id));
		}
	});

	schema.action('clear', {
		name: 'Clear all posts',
		permissions: 'posts',
		action: function($) {
			DB().remove(MAIN.db_posts).callback($.done());
		}
	});

	schema.action('remove', {
		name: 'Remove post',
		params: '*id:String',
		permissions: 'posts',
		action: function($) {
			DB().remove(MAIN.db_posts).id($.params.id).error('@(Post not found)').callback($.done());
		}
	});

});