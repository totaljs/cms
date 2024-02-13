exports.install = function() {
	// Internal
	ROUTE('+GET     ?backup/          <60s', backup);
	ROUTE('+POST    ?restore/ @upload <60s <100MB', restore);
	ROUTE('+GET     ?clear/           <60s', clear);
};

function backup($) {

	if (UNAUTHORIZED($, 'admin'))
		return;

	var filename = CONF.name.slug() + '-{0}.txt'.format(NOW.format('yyyy-MM-dd'));

	MAIN.db.fs.backup(PATH.temp(filename), function(err, meta) {
		if (meta)
			$.file(meta.filename, filename);
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