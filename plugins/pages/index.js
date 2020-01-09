exports.icon = 'far fa-file-text-o';
exports.name = 'Pages';
exports.position = 3;

exports.install = function() {
	// Pages
	ROUTE('GET     #admin/api/pages/                          *Pages --> @query');
	ROUTE('GET     #admin/api/pages/{id}/                     *Pages --> @read');
	ROUTE('POST    #admin/api/pages/                          *Pages --> @url @save (response)');
	ROUTE('DELETE  #admin/api/pages/                          *Pages --> @remove');
	ROUTE('GET     #admin/api/pages/stats/                    *Pages --> @stats');
	ROUTE('GET     #admin/api/pages/{id}/stats/               *Pages --> @stats');
	ROUTE('GET     #admin/api/pages/{id}/backups/             *Common --> @backup');
	ROUTE('POST    #admin/api/pages/preview/',                preview, ['json'], 512);
	ROUTE('GET     #admin/api/pages/dependencies/',           dependencies);
	ROUTE('POST    #admin/api/pages/css/',                    css, ['json'], 512);

	// Page globals
	ROUTE('GET     #admin/api/pages/globals/                  *Pages/Globals --> @read');
	ROUTE('POST    #admin/api/pages/globals/                  *Pages/Globals --> @save', 30);
	ROUTE('GET     #admin/api/pages/redirects/                *Pages/Redirects --> @read');
	ROUTE('POST    #admin/api/pages/redirects/                *Pages/Redirects --> @save', 30);

	// Navigations
	ROUTE('GET     #admin/api/nav/{id}/                       *Navigations --> @read');
	ROUTE('POST    #admin/api/nav/                            *Navigations --> @save');

	// Redirects
	ROUTE('GET     #admin/api/redirects/{id}/                 *Redirects --> @read');
	ROUTE('POST    #admin/api/redirects/                      *Redirects --> @save');

	// Parts & Tracking
	ROUTE('POST    #admin/api/parts/                          *Parts    --> @save');
	ROUTE('POST    #admin/api/tracking/                       *Tracking --> @save');
	ROUTE('GET     #admin/api/tracking/                       *Tracking --> @query');
	ROUTE('GET     #admin/api/tracking/{id}/                  *Tracking --> @stats');
	ROUTE('DELETE  #admin/api/tracking/{id}/                  *Tracking --> @remove');
};

function preview() {
	var self = this;
	self.layout('layout-preview');
	self.repository.preview = true;
	self.repository.page = self.body;
	self.view('~cms/' + self.body.template);
}

function dependencies() {
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

function css() {
	var self = this;
	self.content(U.minifyStyle('/*auto*/\n' + (self.body.css || '')), 'text/css');
}