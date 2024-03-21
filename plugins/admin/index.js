exports.icon = 'ti ti-key';
exports.name = '@(Admin)';
exports.position = 100;
// exports.visible = () => !CONF.op_reqtoken || !CONF.op_restoken;
exports.import = 'extensions.html';
exports.hidden = true;

var Storage = MEMORIZE('account');
MAIN.admin = Storage;

exports.install = function() {
	ROUTE('+API    ?    -admin_read     --> Admin/read');
	ROUTE('+API    ?    +admin_save     --> Admin/save');
	ROUTE('+API    ?    -logout         --> Admin/logout');
	ROUTE('-API    ?    +login          --> Admin/login');
	ROUTE('-GET    ?/*', login);
};

FUNC.authadmin = function($) {

	if (BLOCKED($, 10)) {
		$.invalid();
		return;
	}

	var user = Storage.user;
	var token = $.cookie(user.cookie);
	if (token) {
		var session = DECRYPTREQ($, token, user.salt);
		if (session && session.id === user.login && session.expire > NOW) {
			BLOCKED($, null);
			$.success({ id: user.id, name: user.name, sa: user.sa, permissions: user.permissions });
			return;
		}
	}

	$.invalid();
};

NEWACTION('Admin/read', {
	name: 'Read admin profile',
	action: function($) {
		var user = Storage.user;
		var model = {};
		model.name = user.name;
		model.login = user.login;
		model.password = '';
		$.callback(model);
	}
});

NEWACTION('Admin/save', {
	name: 'Save admin profile',
	input: '*name,*login,password',
	action: function($, model) {

		var user = Storage.user;
		user.login = model.login;

		if (model.password)
			user.password = model.password.sha256(user.salt);

		user.name = model.name;

		Storage.set('user', user);

		// Update session
		var session = {};
		session.id = user.login;
		session.expire = NOW.add('1 month');
		$.cookie(user.cookie, ENCRYPTREQ($, session, user.salt), session.expire);

		$.success();
	}
});

NEWACTION('Admin/login', {
	name: 'Login',
	input: '*login,*password',
	action: function($, model) {

		if (model.login !== Storage.user.login || model.password.sha256(Storage.user.salt) !== Storage.user.password) {
			$.invalid('@(Invalid credentials)');
			return;
		}

		if (Storage.user.raw) {
			delete Storage.user.raw;
			Storage.set('user', Storage.user);
		}

		var session = {};
		session.id = Storage.user.login;
		session.expire = NOW.add('1 month');
		$.cookie(Storage.user.cookie, ENCRYPTREQ($, session, Storage.user.salt), session.expire);
		$.success();
	}
});

NEWACTION('Admin/logout', {
	name: 'Logout',
	action: function($) {
		$.cookie(Storage.user.cookie, '', '-1 day');
		$.success();
	}
});

function login($) {
	if (CONF.op_reqtoken && CONF.op_restoken)
		$.fallback(401);
	else
		$.view('#admin/login');
}

if (!Storage.user) {
	(function() {
		var login = U.random_text(10);
		var password = U.random_text(10);
		var salt = U.random_text(10);
		var cookie = U.random_text(5);
		Storage.set('user', { id: 'admin', name: 'John Connor', login: login, password: password.sha256(salt), raw: password, sa: true, cookie: cookie, salt: salt });
	})();
}

CONF.op_cookie = Storage.user.cookie;