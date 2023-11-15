exports.install = function() {

	// Misc
	ROUTE('+API     /admin/             -account          --> Account/read');
	ROUTE('+API     /admin/             +chatgpt  <60s    --> ChatGPT/ask');

	// Internal
	ROUTE('+GET     /admin/backup/          <60s', backup);
	ROUTE('+POST    /admin/restore/ @upload <60s <10MB', restore);
	ROUTE('+GET     /admin/clear/           <60s', clear);
};

function backup($) {

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

function clear($) {
	if (UNAUTHORIZED($, 'admin'))
		return;
	FUNC.unload(() => FUNC.load($.done()));
}

function restore($) {
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