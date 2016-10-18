const SITEMAP = {};
const Fs = require('fs');

exports.install = function() {
	// Auto-localize static HTML templates
	F.localize('/templates/*.html', ['compress']);

	var url = CONFIG('manager-url');

	// COMMON
	F.route(url + '/*', '~manager');
	F.route(url + '/upload/',                  upload, ['post', 'upload', 10000], 3084); // 3 MB
	F.route(url + '/upload/base64/',           upload_base64, ['post', 10000], 2048); // 2 MB
	F.route(url + '/logoff/',                  redirect_logoff);

	// DASHBOARD
	F.route(url + '/api/dashboard/',           json_dashboard);
	F.route(url + '/api/dashboard/online/',    json_dashboard_online);
	F.route(url + '/api/dashboard/clear/',     json_dashboard_clear);

	// POSTS
	F.route(url + '/api/posts/',               json_query, ['*Post']);
	F.route(url + '/api/posts/',               json_save, ['post', '*Post']);
	F.route(url + '/api/posts/{id}/',          json_read, ['*Post']);
	F.route(url + '/api/posts/',               json_remove, ['delete', '*Post']);
	F.route(url + '/api/posts/clear/',         json_clear, ['*Post']);
	F.route(url + '/api/posts/codelists/',     json_posts_codelists);

	// PAGES
	F.route(url + '/api/pages/',               json_query, ['*Page']);
	F.route(url + '/api/pages/',               json_pages_save, ['post', '*Page']);
	F.route(url + '/api/pages/',               json_remove, ['delete', '*Page']);
	F.route(url + '/api/pages/{id}/',          json_read, ['*Page']);
	F.route(url + '/api/pages/preview/',       view_pages_preview, ['json']);
	F.route(url + '/api/pages/dependencies/',  json_pages_dependencies);
	F.route(url + '/api/pages/clear/',         json_clear, ['*Page']);
	F.route(url + '/api/pages/sitemap/',       json_pages_sitemap);

	// WIDGETS
	F.route(url + '/api/widgets/',             json_query, ['*Widget']);
	F.route(url + '/api/widgets/',             json_widgets_save, ['post', '*Widget']);
	F.route(url + '/api/widgets/',             json_remove, ['delete', '*Widget']);
	F.route(url + '/api/widgets/{id}/',        json_read, ['*Widget']);
	F.route(url + '/api/widgets/clear/',       json_clear, ['*Widget']);

	// NEWSLETTER
	F.route(url + '/api/newsletter/',          json_query, ['*Newsletter']);
	F.route(url + '/api/newsletter/csv/',      file_newsletter, ['*Newsletter']);
	F.route(url + '/api/newsletter/clear/',    json_clear, ['*Newsletter']);

	// SETTINGS
	F.route(url + '/api/settings/',            json_settings, ['*Settings']);
	F.route(url + '/api/settings/',            json_settings_save, ['put', '*Settings']);
};

// ==========================================================================
// COMMON
// ==========================================================================

// Upload (multiple) pictures
function upload() {

	var self = this;
	var id = [];

	self.files.wait(function(file, next) {
		file.read(function(err, data) {

			// Store current file into the HDD
			file.extension = U.getExtension(file.filename);
			id.push(DB('files').binary.insert(file.filename, data) + '.' + file.extension);

			// Next file
			setTimeout(next, 100);
		});

	}, function() {
		// Returns response
		self.json(id);
	});
}

// Upload base64
function upload_base64() {
	var self = this;

	if (!self.body.file) {
		self.json(null);
		return;
	}

	var type = self.body.file.base64ContentType();
	var data = self.body.file.base64ToBuffer();
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
	}

	var id = DB('files').binary.insert('base64' + ext, data);
	self.json('/download/' + id + ext);
}

// Logoff
function redirect_logoff() {
	var self = this;
	self.res.cookie('__manager', '', '-1 days');
	self.redirect(CONFIG('manager-url'));
}

// ==========================================================================
// SCHEMA CRUD OPERATIONS
// ==========================================================================

function json_query() {
	var self = this;
	self.$query(self.query, self.callback());
}

function json_save() {
	var self = this;
	self.body.$save(self, self.callback());
}

function json_remove() {
	var self = this;
	self.$remove(self.body.id, self.callback());
}

function json_clear() {
	var self = this;
	self.$workflow('clear', self.callback());
}

function json_read(id) {
	var self = this;
	var options = {};
	options.id = id;
	self.$get(options, self.callback());
}

// ==========================================================================
// DASHBOARD
// ==========================================================================

// Reads basic informations for dashboard
function json_dashboard() {

	var self = this;
	var model = {};
	var counter = MODULE('webcounter');

	model.webcounter = {};
	model.webcounter.today = counter.today();
	model.webcounter.online = counter.online();

	if (!model.webcounter.today.pages)
		model.webcounter.today.pages = 0;

	model.webcounter.today.pages = Math.floor(parseFloat(model.webcounter.today.pages));

	var async = [];

	// Reads all monthly stats
	async.push(function(next) {
		counter.monthly(function(stats) {
			model.webcounter.stats = stats;
			next();
		});
	});

	// Reads dashboard information from all registered schemas which they have defined `dashboard` operation.
	async.push(function(next) {

		var pending = [];

		EACHSCHEMA(function(group, name, schema) {
			if (!schema.operations || !schema.operations['dashboard'])
				return;
			pending.push(schema);
		});

		pending.wait(function(schema, next) {
			schema.operation('dashboard', null, function(err, data) {
				if (!err && data)
					model[schema.name] = data;
				next();
			});
		}, next);
	});

	async.async(function() {
		self.json(model);
	});
}

// Reads online users
function json_dashboard_online() {
	var self = this;
	var counter = MODULE('webcounter');
	var memory = process.memoryUsage();
	var model = {};
	model.visitors = counter.online();
	model.today = counter.today();
	model.last = counter.today().last;
	model.memoryused = memory.heapUsed.filesize();
	model.memorytotal = memory.heapTotal.filesize();
	self.json(model);
}

// Clear visitor statistics
function json_dashboard_clear() {
	var self = this;
	var instance = MODULE('webcounter').instance;

	Fs.unlink('databases/webcounter.nosql', NOOP);
	Fs.unlink('databases/webcounter.cache', NOOP);

	Object.keys(instance.stats).forEach(key => instance.stats[key] = 0);
	self.json(SUCCESS(true));
}

// ==========================================================================
// POSTS
// ==========================================================================

// Reads all post categories and manufacturers
function json_posts_codelists() {
	var self = this;
	self.json({ categories: F.global.posts, templates: F.config.custom.templates });
}

// ==========================================================================
// PAGES
// ==========================================================================

// Creates HTML preview
function view_pages_preview() {
	var self = this;
	self.layout('layout-preview');
	self.repository.preview = true;
	self.repository.page = self.body;
	self.view('~cms/' + self.body.template);
}

// Gets dependencies for Pages (templates and navigations)
function json_pages_dependencies() {
	var self = this;
	self.json({ templates: F.config.custom.templates, navigations: F.config.custom.navigations });
}

// Saves (update or create) specific page
function json_pages_save() {
	var self = this;

	// Is auto-creating URL?
	if (self.body.url[0] === '-')
		self.body.$async(self.callback(), 1).$workflow('url', self).$save(self);
	else
		self.body.$save(self, self.callback());

	// Clears view cache
	setTimeout(() => F.cache.removeAll('cache.'), 2000);
}

function json_pages_sitemap() {
	SITEMAP.sitemap = F.global.sitemap;
	SITEMAP.partial = F.global.partial;
	this.json(SITEMAP);
}

// ==========================================================================
// WIDGETS
// ==========================================================================

// Saves (updates or creates) specific widget
function json_widgets_save() {
	var self = this;
	self.body.$save(self, self.callback());

	// Clears view cache
	setTimeout(() => F.cache.removeAll('cache.'));
}

// Clears all widgets
function json_widgets_clear() {
	var self = this;
	self.$workflow('clear', self.callback());
}

// ==========================================================================
// NEWSLETTER
// ==========================================================================

// Downloads all email address as CSV
function file_newsletter() {
	var self = this;
	self.$workflow('download', self);
}

// Clears all email addreses in newsletter
function json_newsletter_clear() {
	var self = this;
	self.$workflow('clear', self.callback());
}

// ==========================================================================
// SETTINGS
// ==========================================================================

// Reads custom settings
function json_settings() {
	var self = this;
	self.$get(null, self.callback());
}

// Saves and refresh custom settings
function json_settings_save() {
	var self = this;
	self.body.$async(self.callback(), 0).$save().$workflow('load');
}