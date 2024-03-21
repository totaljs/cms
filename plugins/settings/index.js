exports.icon = 'ti ti-cog';
exports.name = '@(Settings)';
exports.position = 100;
exports.permissions = [{ id: 'settings', name: 'Settings' }];
exports.visible = user => user.sa || user.permissions.includes('settings');

exports.install = function() {
	ROUTE('+API    ?    -account          --> Account/read');
	ROUTE('+API    ?    +chatgpt  <60s    --> ChatGPT/ask');
	ROUTE('+API    ?    -settings_read    --> Settings/read');
	ROUTE('+API    ?    +settings_test    --> Settings/test');
	ROUTE('+API    ?    +settings_save    --> Settings/save');
};

NEWACTION('Account/read', {
	name: 'Read account',
	action: function($) {
		var user = $.user;
		var obj = {};
		obj.id = user.id;
		obj.name = user.name;
		obj.sa = user.sa;
		obj.openplatform = !!user.openplatform;
		obj.iframe = !!user.iframe;
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