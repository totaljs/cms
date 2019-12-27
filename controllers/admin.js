const MSG_NOTIFY = { TYPE: 'notify' };
const MSG_ALERT = { TYPE: 'alert' };
const ALLOW = ['/api/dependencies/', '/api/pages/preview/', '/api/upload/', '/api/nav/', '/api/files/', '/stats/', '/live/', '/api/widgets/'];
const SYSUSER = {};
const COOKIE_OPTIONS = { security: 'strict', httponly: true };

var DDOS = {};
var WS = null;

FUNC.notify = function(value) {
	if (WS) {
		MSG_NOTIFY.type = value instanceof Object ? value.type : value;
		MSG_NOTIFY.message = value instanceof Object ? value.message : '';
		WS.send(MSG_NOTIFY);
	}
};

FUNC.send = function(value) {
	WS && WS.send(value);
};

FUNC.alert = function(user, type, value) {
	if (user && WS) {
		MSG_ALERT.type = type;
		MSG_ALERT.message = value;
		MSG_ALERT.user = user.name;
		WS.send(MSG_ALERT);
	}
};

CONF.admin_tracking && ON('visitor', function(obj) {
	if (WS) {
		MSG_NOTIFY.type = 'visitor';
		MSG_NOTIFY.message = obj;
		WS.send(MSG_NOTIFY);
	}
});

exports.install = function() {

	// Internal
	ROUTE('GET     #admin', '=admin/index');
	ROUTE('GET     #admin/logout/',                           logout);
	ROUTE('POST    /api/login/admin/',                        login);
	ROUTE('POST    #admin/api/upload/',                       upload, ['upload', 10000], 5120); // 5 MB
	ROUTE('POST    #admin/api/upload/base64/',                upload_base64, [10000], 2048); // 2 MB
	ROUTE('GET     #admin/api/dependencies/                   *Settings --> @dependencies');

	// Dashboard
	ROUTE('GET     #admin/api/dashboard/',                    json_dashboard);
	ROUTE('GET     #admin/api/dashboard/referrers/',          json_dashboard_referrers);
	ROUTE('GET     #admin/api/dashboard/online/',             json_dashboard_online);
	ROUTE('GET     #admin/api/dashboard/tracking/             *Tracking --> @stats');

	// MODEL: /schema/widgets.js
	ROUTE('GET     #admin/api/widgets/                        *Widgets --> @query');
	ROUTE('GET     #admin/api/widgets/{id}/                   *Widgets --> @read');
	ROUTE('POST    #admin/api/widgets/                        *Widgets --> @save');
	ROUTE('DELETE  #admin/api/widgets/{id}/                   *Widgets --> @remove');
	ROUTE('GET     #admin/api/widgets/{id}/editor/            *Widgets --> @editor');
	ROUTE('GET     #admin/api/widgets/dependencies/           *Widgets --> @dependencies');
	ROUTE('GET     #admin/api/widgets/{id}/settings/          *Widgets', json_widget_settings);
	ROUTE('GET     #admin/api/widgets/{id}/backups/           *Common --> @backup');

	// MODEL: /schema/widgets.js
	ROUTE('GET     #admin/api/widgets/globals/                *Widgets/Globals --> @read');
	ROUTE('POST    #admin/api/widgets/globals/                *Widgets/Globals --> @save', 30);

	// MODEL: /schema/pages.js
	ROUTE('GET     #admin/api/pages/                          *Pages --> @query');
	ROUTE('GET     #admin/api/pages/{id}/                     *Pages --> @read');
	ROUTE('POST    #admin/api/pages/                          *Pages --> @url @save (response)');
	ROUTE('DELETE  #admin/api/pages/                          *Pages --> @remove');
	ROUTE('GET     #admin/api/pages/stats/                    *Pages --> @stats');
	ROUTE('GET     #admin/api/pages/{id}/stats/               *Pages --> @stats');
	ROUTE('GET     #admin/api/pages/{id}/backups/             *Common --> @backup');
	ROUTE('POST    #admin/api/pages/preview/',                view_pages_preview, ['json'], 512);
	ROUTE('GET     #admin/api/pages/dependencies/',           json_pages_dependencies);
	ROUTE('POST    #admin/api/pages/css/',                    css_pages, ['json'], 512);

	ROUTE('POST    #admin/api/parts/                          *Parts --> @save');
	ROUTE('POST    #admin/api/tracking/                       *Tracking --> @save');
	ROUTE('GET     #admin/api/tracking/                       *Tracking --> @query');
	ROUTE('GET     #admin/api/tracking/{id}/                  *Tracking --> @stats');
	ROUTE('DELETE  #admin/api/tracking/{id}/                  *Tracking --> @remove');

	// MODEL: /schema/pages.js
	ROUTE('GET     #admin/api/pages/globals/                  *Pages/Globals --> @read');
	ROUTE('POST    #admin/api/pages/globals/                  *Pages/Globals --> @save', 30);
	ROUTE('GET     #admin/api/pages/redirects/                *Pages/Redirects --> @read');
	ROUTE('POST    #admin/api/pages/redirects/                *Pages/Redirects --> @save', 30);

	// MODEL: /schema/events.js
	ROUTE('GET     #admin/api/events/                         *Events --> @query');
	ROUTE('GET     #admin/api/events/clear/                   *Events --> @clear');

	// MODEL: /schema/posts.js
	ROUTE('GET     #admin/api/posts/                          *Posts --> @query');
	ROUTE('GET     #admin/api/posts/{id}/                     *Posts --> @read');
	ROUTE('POST    #admin/api/posts/                          *Posts --> @save');
	ROUTE('DELETE  #admin/api/posts/                          *Posts --> @remove');
	ROUTE('GET     #admin/api/posts/toggle/                   *Posts --> @toggle');
	ROUTE('GET     #admin/api/posts/stats/                    *Posts --> @stats');
	ROUTE('GET     #admin/api/posts/{id}/stats/               *Posts --> @stats');
	ROUTE('GET     #admin/api/posts/{id}/backups/             *Common --> @backup');
	ROUTE('POST    #admin/api/posts/preview/',                view_posts_preview, ['json'], 512);

	// MODEL: /schema/notices.js
	ROUTE('GET     #admin/api/notices/                        *Notices --> @query');
	ROUTE('GET     #admin/api/notices/{id}/                   *Notices --> @read');
	ROUTE('POST    #admin/api/notices/                        *Notices --> @save');
	ROUTE('DELETE  #admin/api/notices/                        *Notices --> @remove');
	ROUTE('GET     #admin/api/notices/toggle/                 *Notices --> @toggle');
	ROUTE('POST    #admin/api/notices/preview/',              view_notices_preview, ['json']);

	// MODEL: /schema/subscribers.js
	ROUTE('GET     #admin/api/subscribers/                    *Subscribers --> @query');
	ROUTE('GET     #admin/api/subscribers/{id}/               *Subscribers --> @read');
	ROUTE('POST    #admin/api/subscribers/                    *Subscribers --> @save');
	ROUTE('DELETE  #admin/api/subscribers/                    *Subscribers --> @remove');
	ROUTE('GET     #admin/api/subscribers/stats/              *Subscribers --> @stats');
	ROUTE('GET     #admin/api/subscribers/toggle/             *Subscribers --> @toggle');

	// MODEL: /schema/newsletters.js
	ROUTE('GET     #admin/api/newsletters/                    *Newsletters --> @query');
	ROUTE('GET     #admin/api/newsletters/{id}/               *Newsletters --> @read');
	ROUTE('POST    #admin/api/newsletters/                    *Newsletters --> @save');
	ROUTE('DELETE  #admin/api/newsletters/                    *Newsletters --> @remove');
	ROUTE('POST    #admin/api/newsletters/test/               *Newsletters --> @test');
	ROUTE('GET     #admin/api/newsletters/toggle/             *Newsletters --> @toggle');
	ROUTE('GET     #admin/api/newsletters/stats/              *Newsletters --> @stats');
	ROUTE('GET     #admin/api/newsletters/{id}/stats/         *Newsletters --> @stats');
	ROUTE('GET     #admin/api/newsletters/{id}/backups/       *Common --> @backup');
	ROUTE('GET     #admin/api/newsletters/state/',            json_newsletter_state);

	// MODEL: /schema/navigations.js
	ROUTE('GET     #admin/api/nav/{id}/                       *Navigations --> @read');
	ROUTE('POST    #admin/api/nav/                            *Navigations --> @save');

	// MODEL: /schema/navigations.js
	ROUTE('GET     #admin/api/redirects/{id}/                 *Redirects --> @read');
	ROUTE('POST    #admin/api/redirects/                      *Redirects --> @save');

	// MODEL: /schema/settings.js
	ROUTE('GET     #admin/api/settings/                       *Settings --> @read');
	ROUTE('POST    #admin/api/settings/                       *Settings --> @smtp @save (response) @load');

	// MODEL: /schema/common.js
	ROUTE('GET    #admin/api/backups/clear/                   *Common --> @backup_clear');
	ROUTE('GET    #admin/api/backups/{type}/{id}/             *Common --> @backup_read');

	// Files
	ROUTE('GET     #admin/api/files/                          *Files --> @query');
	ROUTE('GET     #admin/api/files/clear/                    *Files --> @clear');

	// Others
	ROUTE('GET     #admin/api/contactforms/stats/             *Contacts --> stats');

	// Websocket
	WEBSOCKET('#admin/live/', socket, ['json']);

	// System user
	SYSUSER.name = CONF.admin_superadmin.split(':')[0];
	SYSUSER.token = true;
};

ON('controller', function(controller, name) {

	if (name !== 'admin' || controller.url === '/api/login/admin/') {
		if (!controller.route.groups || !controller.route.groups.admin)
			return;
	}

	var ddos = DDOS[controller.ip];

	// 5 failed attempts
	if (ddos > 5) {
		controller.cancel();
		controller.throw401();
		return;
	}

	if (CONF.admin_token && controller.req.headers['x-token'] === CONF.admin_token) {
		controller.user = SYSUSER;
		return;
	}

	var cookie = controller.cookie(CONF.admin_cookie);
	if (!cookie || !cookie.length) {
		DDOS[controller.ip] = ddos ? ddos + 1 : 1;
		controller.cancel();
		controller.theme('admin');
		controller.view('~login');
		return;
	}

	var user = MAIN.users[cookie];
	if (user == null) {
		DDOS[controller.ip] = ddos ? ddos + 1 : 1;
		controller.cancel();
		controller.theme('admin');
		controller.view('~login');
		return;
	}

	// Roles
	if (!user.sa && user.roles.length && controller.url !== controller.sitemap_url('admin')) {

		var cancel = true;

		for (var i = 0, length = user.roles.length; i < length; i++) {
			var role = user.roles[i];
			if (controller.url.indexOf(role.toLowerCase()) !== -1) {
				cancel = false;
				break;
			}
		}

		// Allowed URL
		if (cancel) {
			for (var i = 0, length = ALLOW.length; i < length; i++) {
				if (controller.url.indexOf(ALLOW[i]) !== -1) {
					cancel = false;
					break;
				}
			}

			if (cancel) {
				controller.cancel();
				controller.throw401();
				return;
			}
		}
	}

	controller.user = user;
});

ON('service', function(counter) {
	if (counter % 15 === 0)
		DDOS = {};
});

function socket() {
	var self = this;
	WS = self;
	self.autodestroy(() => WS = null);
}

function logout() {
	var self = this;
	self.cookie(CONF.admin_cookie, '', '-1 day');
	self.redirect(self.sitemap_url('admin'));
}

function login() {
	var self = this;
	var key = (self.body.name + ':' + self.body.password + ':' + CONF.secret + (self.body.name + ':' + self.body.password).hash() + CONF.admin_secret).md5();
	if (MAIN.users[key]) {
		$SAVE('Event', { type: 'system/login', user: self.body.name, admin: true }, NOOP, self);
		self.cookie(CONF.admin_cookie, key, '1 month', COOKIE_OPTIONS);
		self.success();
	} else
		self.invalid('error-users-credentials');
}

// Upload (multiple) pictures
function upload() {

	var id = [];
	var self = this;

	self.files.wait(function(file, next) {
		file.read(function(err, data) {

			// Store current file into the HDD
			file.extension = U.getExtension(file.filename).toLowerCase();

			FILESTORAGE('files').insert(file.filename, data, function(err, ref) {
				id.push({ id: ref, name: file.filename, size: file.length, width: file.width, height: file.height, type: file.type, ctime: NOW, mtime: NOW, extension: file.extension, download: '/download/' + ref + '.' + file.extension });
				setImmediate(next);
			});

		});

	}, () => self.json(id));
}

// Upload base64
function upload_base64() {
	var self = this;

	if (!self.body.file) {
		self.json(null);
		return;
	}

	var type = self.body.file.base64ContentType();
	var ext;

	switch (type) {
		case 'image/png':
			ext = '.png';
			break;
		case 'image/jpeg':
			ext = '.jpg';
			break;
		case 'image/gif':
			ext = '.gif';
			break;
		default:
			self.json(null);
			return;
	}

	var data = self.body.file.base64ToBuffer();
	FILESTORAGE('files').insert((self.body.name || 'base64').replace(/\.[0-9a-z]+$/i, '').max(40) + ext, data, (err, id) => self.json('/download/' + id + ext));
}

// Creates a preview
function view_pages_preview() {
	var self = this;
	self.layout('layout-preview');
	self.repository.preview = true;
	self.repository.page = self.body;
	self.view('~cms/' + self.body.template);
}

function css_pages() {
	var self = this;
	self.content(U.minifyStyle('/*auto*/\n' + (self.body.css || '')), 'text/css');
}

function json_widget_settings(id) {
	var self = this;
	var item = MAIN.widgets[id];
	self.json(item ? item.editor : null);
}

function json_newsletter_state() {
	this.json(MAIN.newsletter);
}

function json_dashboard_online() {
	var self = this;
	var data = MODULE('visitors').today();
	data.memory = process.memoryUsage();
	data.performance = F.stats.performance;
	self.json(data);
}

function json_pages_dependencies() {
	var self = this;
	var arr = [];

	for (var i = 0, length = MAIN.pages.length; i < length; i++) {
		var item = MAIN.pages[i];
		arr.push({ url: item.url, name: item.name, parent: item.parent });
	}

	var output = {};
	output.links = arr;

	NOSQL('parts').find().fields('id', 'name', 'category').callback(function(err, response) {
		output.parts = response;
		self.json(output);
	});
}

function json_dashboard() {
	MODULE('visitors').monthly(this.callback());
}

function json_dashboard_referrers() {
	NOSQL('visitors').counter.stats_sum(24, NOW.getFullYear(), this.callback());
}

function view_notices_preview() {
	var self = this;
	var body = self.body.body;
	if (body)
		$WORKFLOW('Notices', 'preview', body, (err, response) => self.content(response, 'text/html'));
	else
		self.content('', 'text/html');
}

// Creates a preview
function view_posts_preview() {
	var self = this;
	self.layout('layout-preview');
	self.repository.preview = true;

	if (typeof(self.body.body) === 'string')
		self.body.body = self.body.body.markdown();
	else
		self.body.body = '';

	self.repository.page = self.body;
	self.view('~cms/' + self.body.template);
}