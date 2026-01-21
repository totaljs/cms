exports.icon = 'ti ti-envelope';
exports.name = '@(Contact forms)';
exports.position = 5;
exports.permissions = [];
exports.config = [{ id: 'contactform', name: 'E-mail address', value: 'info@totaljs.com' }];

ON('reload', async function() {
	// 7973 is a folder indentifier for the meta file
	exports.db = 'nosql/' + PATH.databases('fs-' + MAIN.cms.id + '/7973/contactforms.nosql');

	// Create external plugin
	let widget = MAIN.cms.db.widgets.findItem('id', 'contactform');
	if (!widget)
		setTimeout(() => ACTION('ContactForms|rebuild').user({ sa: true }).callback(ERROR('Unexpected problem with storing contact form widget')), 100);

});

NEWACTION('ContactForms', {
	name: 'List of contact forms',
	route: '+API ?',
	permissions: 'contactforms,admin',
	user: true,
	action: function($) {
		DATA.list(exports.db).autoquery($.query, 'id,name,subject,note,email,ip,ua,processed:Boolean,dtread:Date,dtcreated:Date', 'dtcreated_desc', 100).callback($);
	}
});

NEWACTION('ContactForms|create', {
	name: 'Create contact form',
	route: 'API ?',
	input: '*name,*subject,*email:Email,phone:Phone,*body',
	action: async function($, model) {

		model.id = UID();
		model.ip = $.ip;
		model.ua = $.ua;
		model.dtcreated = NOW;

		await DATA.insert(exports.db, model).promise($);
		$.success();

		// Sends mail
		if (CONF.smtp) {
			model.app_url = CONF.url;
			model.app_name = CONF.name;
			let html = await TEMPLATE('~' + PATH.join(PATH.plugins(exports.id), 'templates/mail.html'), model);
			HTMLMAIL(CONF.contactform, model.subject, html);
		}

	}
});

NEWACTION('ContactForms|save', {
	route: '+API ?',
	input: '*id,*name,*subject,*email:Email,phone:Phone,*body,note,dtread,processed:Boolean',
	permissions: 'contactforms,admin',
	user: true,
	action: function($, model) {
		model.dtupdated = NOW;
		model.updatedby = $.user.name;
		DATA.modify(exports.db, model).id(model.id).error(404).callback($.done(model.id));
	}
});

NEWACTION('ContactForms|read', {
	route: '+API ?',
	input: '*id',
	permissions: 'contactforms,admin',
	user: true,
	action: function($, model) {
		DATA.read(exports.db).id(model.id).error(404).callback($);
	}
});

NEWACTION('ContactForms|remove', {
	route: '+API ?',
	input: '*id',
	permissions: 'contactforms,admin',
	user: true,
	action: function($, model) {
		DATA.remove(exports.db).id(model.id).error(404).callback($.done(model.id));
	}
});

NEWACTION('ContactForms|rebuild', {
	route: '+API ?',
	permissions: 'contactforms,admin',
	user: true,
	action: async function($) {
		let html = await Total.readfile(PATH.join(PATH.plugins(exports.id), 'public/widget.txt'), 'utf8');
		ACTION('Widgets|save', { html: html }).user({ sa: true }).callback($.done());
	}
});