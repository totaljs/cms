exports.install = function() {

	// Misc
	ROUTE('+API     /admin/             -account            *Account      --> read');
	ROUTE('+API     /admin/             -auth               *Auth         --> read');
	ROUTE('+API     /admin/             -permissions        *Roles        --> permissions');
	ROUTE('+API     /admin/             +enterprise         *Enterprise   --> download');

	ROUTE('+API     /admin/             +enterprise         *Enterprise   --> download');
	ROUTE('+API     /admin/             -enterprise_read    *Enterprise   --> read');
	ROUTE('+API     /admin/             +enterprise_save    *Enterprise   --> save');

	// Admin
	ROUTE('-POST    /admin/auth/                            *Auth         --> exec');
	ROUTE('+GET     /admin/logout/                          *Auth         --> logout');
	ROUTE('+POST    /admin/password/                        *Auth         --> save');

	// Internal
	ROUTE('+GET     /admin/backup/',  backup, [1000 * 60]);
	ROUTE('+POST    /admin/restore/', restore, ['upload', 1000 * 120], 1024 * 100); // Max. 100 MB
	ROUTE('+GET     /admin/clear/',   clear, [1000 * 30]);
};

function backup() {

	var $ = this;

	if (UNAUTHORIZED($, 'admin'))
		return;

	var filename = CONF.name.slug() + '-{0}.txt'.format(NOW.format('yyyy-MM-dd'));

	MAIN.db.fs.backup(PATH.temp(filename), function(err, meta) {
		if (meta)
			$.file('~' + meta.filename, filename);
		else
			$.invalid(err);
	});
}

function clear() {
	var $ = this;

	if (UNAUTHORIZED($, 'admin'))
		return;

	FUNC.unload(function() {
		FUNC.load($.done());
	});
}

function restore() {
	var $ = this;

	if (UNAUTHORIZED($, 'admin'))
		return;

	FUNC.unload(function() {
		MAIN.db.fs.restore($.files[0].path, function(err, meta) {
			if (meta && meta.files) {
				FUNC.load($.done());
			} else
				$.success();
		});
	});
}