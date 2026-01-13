exports.icon = 'ti ti-account';
exports.name = '@(Account)';
exports.position = 10;
exports.import = 'extensions.html';
exports.visible = () => true;
exports.hidden = true;

let Storage = MEMORIZE('account');
MAIN.admin = Storage;

exports.install = function() {
	ROUTE('-GET  /*', login);
	ROUTE('-GET  /auth/', auth);
};

function login($) {

	if (CONF.op && CONF.op_reqtoken && CONF.op_restoken) {
		if ($.query.login && CONF.openplatform)
			$.redirect(CONF.openplatform);
		else
			$.fallback(401);
	} else {
		if (CONF.sso) {
			if ($.banned || $.query.authorized)
				$.redirect(CONF.sso);
			else
				$.redirect(CONF.sso + '/?url=' + $.hostname());
		} else
			$.view('#account/login');
	}

}

FUNC.authadmin = async function($) {

	if (BLOCKED($, 10)) {
		$.banned = true;
		$.invalid();
		return;
	}

	let token = $.cookie(CONF.op_cookie);
	if (token) {

		if (TEMP[token]) {
			BLOCKED($, -1);
			$.success(TEMP[token]);
			return;
		}

		if (!CONF.sso) {
			let user = Storage.user;
			let session = DECRYPTREQ($, token, user.salt);
			if (session && session.id === user.login && session.expire > NOW) {
				BLOCKED($, null);
				$.success({ id: user.id, name: user.name, sa: user.sa, permissions: user.permissions, color: '#4285F4', language: 'eu', groups: [], platform: { groups: [], users: [], apps: [] }} );
				return;
			} else {
				$.invalid();
				return;
			}
		}

		RESTBuilder.POST(CONF.sso, { schema: 'Session', data: { app: CONF.app }}).header('authorization', token).header('user-agent', $.headers['user-agent']).callback(function(err, response) {
			if (response && response.id) {
				BLOCKED($, -1);
				TEMP[token] = response;
				$.success(response);
			} else {
				$.invalid();
			}
		});

	} else
		$.invalid();
};

NEWACTION('Admin|read', {
	name: 'Read admin profile',
	route: 'API ?',
	user: true,
	action: function($) {
		let user = Storage.user;
		let model = {};
		model.name = user.name;
		model.login = user.login;
		model.password = '';
		$.callback(model);
	}
});

NEWACTION('Admin|save', {
	name: 'Save admin profile',
	route: 'API ?',
	input: '*name,*login,password',
	user: true,
	action: function($, model) {

		let user = Storage.user;
		user.login = model.login;

		if (model.password)
			user.password = model.password.sha256(user.salt);

		user.name = model.name;

		Storage.set('user', user);

		// Update session
		let session = {};
		session.id = user.login;
		session.expire = NOW.add('1 month');
		$.cookie(CONF.op_cookie, ENCRYPTREQ($, session, user.salt), session.expire);

		$.success();
	}
});

NEWACTION('Admin|login', {
	name: 'Login',
	route: 'API ?',
	user: false,
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

		let session = {};
		session.id = Storage.user.login;
		session.expire = NOW.add('1 month');
		let token = ENCRYPTREQ($, session, Storage.user.salt);
		$.cookie(CONF.op_cookie, token, session.expire);
		$.success();
	}
});

NEWACTION('Logout', {
	route: 'API ?',
	user: true,
	action: function($) {
		$.cookie(CONF.op_cookie, '', '-1 day');
		$.success();
	}
});

async function auth($) {
	if ($.query.token)
		$.cookie(CONF.op_cookie, $.query.token, '1 month');
	$.redirect('/?authorized=1');
}

if (!Storage.user) {
	(function() {
		let login = U.random_text(10);
		let password = U.random_text(10);
		let salt = U.random_text(10);
		Storage.set('user', { id: 'admin', name: 'John Connor', login: login, password: password.sha256(salt), raw: password, sa: true, salt: salt });
	})();
}