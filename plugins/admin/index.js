exports.icon = 'ti ti-key';
exports.name = '@(Admin)';
exports.position = 100;
exports.visible = () => !CONF.op_reqtoken || !CONF.op_restoken;
exports.import = 'extensions.html';
exports.hidden = true;

exports.install = function() {
	ROUTE('+API    /admin/    -admin_read    *Admin   --> read');
	ROUTE('+API    /admin/    +admin_save    *Admin   --> save');
	ROUTE('+API    /admin/    -logout        *Admin   --> logout');
	ROUTE('-API    /admin/    +login         *Admin   --> login');
	ROUTE('-GET    /admin/*', login);
};

FUNC.authadmin = function($) {

	if (BLOCKED($, 10)) {
		$.invalid();
		return;
	}

	var user = PREF.user;
	var token = $.cookie(user.cookie);
	if (token) {
		var session = DECRYPTREQ($.req, token, user.salt);
		if (session && session.id === user.login && session.expire > NOW) {
			BLOCKED($, null);
			$.success({ id: user.id, name: user.name, sa: user.sa, permissions: user.permissions });
			return;
		}
	}

	$.invalid();
};

NEWSCHEMA('Admin', function(schema) {

	schema.action('read', {
		name: 'Read admin profile',
		action: function($) {
			var user = PREF.user;
			var model = {};
			model.name = user.name;
			model.login = user.login;
			model.password = '';
			$.callback(model);
		}
	});

	schema.action('save', {
		name: 'Save admin profile',
		input: '*name,*login,password',
		action: function($, model) {

			var user = PREF.user;
			user.login = model.login;

			if (model.password)
				user.password = model.password.sha256(user.salt);

			user.name = model.name;

			PREF.set('user', user);

			// Update session
			var session = {};
			session.id = user.login;
			session.expire = NOW.add('1 month');
			$.cookie(user.cookie, ENCRYPTREQ($.req, session, user.salt), session.expire);

			$.success();
		}
	});

	schema.action('login', {
		name: 'Login',
		input: '*login,*password',
		action: function($, model) {

			if (model.login !== PREF.user.login || model.password.sha256(PREF.user.salt) !== PREF.user.password) {
				$.invalid('@(Invalid credentials)');
				return;
			}

			if (PREF.user.raw) {
				delete PREF.user.raw;
				PREF.set('user', PREF.user);
			}

			var session = {};
			session.id = PREF.user.login;
			session.expire = NOW.add('1 month');
			$.cookie(PREF.user.cookie, ENCRYPTREQ($.req, session, PREF.user.salt), session.expire);
			$.success();
		}
	});

	schema.action('logout', {
		name: 'Logout',
		action: function($) {
			$.cookie(PREF.user.cookie, '', '-1 day');
			$.success();
		}
	});

});

function login() {
	this.view('#admin/login');
}

if (!PREF.user) {
	(function() {
		var login = U.random_text(10);
		var password = U.random_text(10);
		var salt = U.random_text(10);
		var cookie = U.random_text(5);
		PREF.set('user', { id: 'admin', name: 'John Connor', login: login, password: password.sha256(salt), raw: password, sa: true, cookie: cookie, salt: salt });
	})();
}