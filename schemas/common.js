NEWACTION('Account/read', {
	name: 'Read account',
	action: function($) {
		var user = $.user;
		var obj = {};
		obj.id = user.id;
		obj.name = user.name;
		obj.sa = user.sa;
		obj.permissions = user.permissions;
		$.callback(obj);
	}
});

NEWACTION('ChatGPT/ask', {
	name: 'Ask a question',
	input: '*value:String;type:{text|image}',
	action: function($, model) {
		API('TAPI', 'chatgpt', model).callback($);
	}
});