exports.icon = 'fa fa-newspaper-o';
exports.name = 'Posts';
exports.position = 50;

exports.install = function() {
	ROUTE('GET     #admin/api/posts/                          *Posts --> @query');
	ROUTE('GET     #admin/api/posts/{id}/                     *Posts --> @read');
	ROUTE('POST    #admin/api/posts/                          *Posts --> @save');
	ROUTE('DELETE  #admin/api/posts/                          *Posts --> @remove');
	ROUTE('GET     #admin/api/posts/toggle/                   *Posts --> @toggle');
	ROUTE('GET     #admin/api/posts/stats/                    *Posts --> @stats');
	ROUTE('GET     #admin/api/posts/{id}/stats/               *Posts --> @stats');
	ROUTE('GET     #admin/api/posts/{id}/backups/             *Common --> @backup');
	ROUTE('POST    #admin/api/posts/preview/',                preview, ['json'], 512);
};

// Creates a preview
function preview() {
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