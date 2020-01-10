exports.icon = 'fa fa-cog';
exports.name = 'Settings';
exports.position = 150;

exports.install = function() {
	ROUTE('GET     /admin/api/settings/                       *Settings --> @read');
	ROUTE('POST    /admin/api/settings/                       *Settings --> @smtp @save (response) @load');
};