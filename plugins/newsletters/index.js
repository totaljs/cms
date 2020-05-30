exports.icon = 'far fa-envelope-o';
exports.name = '@(Newsletters)';
exports.group = '@(Visitors)';
exports.position = 60;

exports.install = function() {

	ROUTE('GET     /admin/api/newsletters/                    *Newsletters --> @query');
	ROUTE('GET     /admin/api/newsletters/{id}/               *Newsletters --> @read');
	ROUTE('POST    /admin/api/newsletters/                    *Newsletters --> @save');
	ROUTE('DELETE  /admin/api/newsletters/                    *Newsletters --> @remove');
	ROUTE('POST    /admin/api/newsletters/test/               *Newsletters --> @test');
	ROUTE('GET     /admin/api/newsletters/toggle/             *Newsletters --> @toggle');
	ROUTE('GET     /admin/api/newsletters/stats/              *Newsletters --> @stats');
	ROUTE('GET     /admin/api/newsletters/{id}/stats/         *Newsletters --> @stats');
	ROUTE('GET     /admin/api/newsletters/{id}/backups/       *Common --> @backup');
	ROUTE('GET     /admin/api/newsletters/state/',            state);

	FILE('/newsletter.gif', stats);
};

function state() {
	this.json(MAIN.newsletter);
}

function stats(req, res) {
	NOSQL('newsletters').counter.hit('all');
	req.query.id && NOSQL('newsletters').counter.hit(req.query.id);
	res.binary('R0lGODdhAQABAIAAAAAAAAAAACH5BAEAAAEALAAAAAABAAEAAAICTAEAOw==', 'image/gif', 'base64');
}