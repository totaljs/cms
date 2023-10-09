NEWSCHEMA('ChatGPT', function(schema) {

	schema.action('ask', {
		name: 'Ask a question',
		input: '*value:String;type:{text|image}',
		action: function($, model) {
			API('TAPI', 'chatgpt', model).callback($);
		}
	});

});