// Admin + OpenPlatform module
// MIT License
// Copyright 2024-2026 (c) Peter Širka <petersirka@gmail.com> | Total.js

// ==================================
// Configuration
// ==================================

// CONF.app
// CONF.name
// CONF.database
// CONF.pipetoken
// CONF.op
// CONF.op_reqtoken
// CONF.op_restoken
// CONF.op_cookie
// CONF.op_expire
// CONF.version
// CONF.schema
// CONF.icon
// CONF.color
// CONF.language

// ==================================
// Functions
// ==================================

// FUNC.authtoken = function($, token) {}
// FUNC.authadmin = function($) {}

// ==================================
// Initialization
// ==================================

CONF.database && require('querybuilderpg').init('', CONF.database, 1, ERROR('DB'));

MAIN.version = 1;
MAIN.db = MEMORIZE('data');
MAIN.ws = null;

if (!MAIN.db.config)
	MAIN.db.config = {};

DEF.onAudit = function(name, data) {
	let payload = {};
	payload.id = UID();
	payload.type = name;
	payload.app = data.app;
	payload.data = data.data;
	payload.createdby = data.createdby || data.username;
	payload.action = data.action || data.schema;
	payload.instance = data.instance;
	payload.message = data.message;
	payload.url = data.url;
	payload.ip = data.ip;
	payload.ua = data.ua;
	DATA.insert('tbl_log', data).schema(CONF.schema);
};

// Fixed settings
CONF.$customtitles = true;

if (!CONF.cdn)
	CONF.cdn = 'https://cdn.componentator.com';

ON('ready', function() {

	OpenPlatform.permissions.push({ id: 'admin', name: 'Admin' });

	for (let key in Total.plugins) {
		let item = Total.plugins[key];
		if (item.permissions)
			OpenPlatform.permissions.push.apply(OpenPlatform.permissions, item.permissions);
	}

	// UI components
	COMPONENTATOR('ui', 'locale,filter,timepicker,fileuploader,filereader,floatinginput,markdown,inlinedatepicker,aselected,configuration,datagrid,spotlight,printer,servergrid,viewbox,page,exec,hashchange,columns,extend,importer,form,crop,input,box,validate,loading,selected,intranetcss,prompt,notify,message,errorhandler,empty,menu,autofill,enter,dropfiles,filesaver,breadcrumb,virtualwire,preview,noscrollbar,miniform,filebrowser,approve,shortcuts,searchdata,search,searchinput,selection,display,tree,children,icons,directory,colorpicker,cloudeditor,edit,tangular-filesize,datepicker,ready,listing,keyvalue,clipboard,imageviewer,choose,tangular-rgba,features,datasource,cl,autocomplete,radiobutton,movable,listform,wysiwyg,clbind,changer,tangular-autoformat,pictures,attachments,emptyinline,table,listdetail,detail,expansionpanel,windows,Tangular-jsonformat,expander,totaltemplates,permissions,tabmenu,tabs,drawzone,leaflet,Tangular-initials,restart,iframeviewer,code,Tangular-badge,dragdropelement,serverlist,flow,progress,textboxlist', true, 'darkmode=0');

	FUNC.reconfigure();

	if (CONF.sync) {
		let ws = WEBSOCKETCLIENT();
		ws.on('open', () => console.log((new Date()).format('yyyy-MM-dd HH:mm'), 'Synchronization: connected'));
		ws.on('close', code => console.log((new Date()).format('yyyy-MM-dd HH:mm'), 'Synchronization: disconnected ({0})'.format(code || 'unknown reason')));
		ws.on('message', message => EMIT('message', message));
		ws.connect(CONF.sync.replace(/^http/i, 'ws'));
		ws.options.reconnectserver = true;
		MAIN.ws = ws;
	}

	// Load extensions
	let path = Total.path.root('extensions');
	Total.Fs.readdir(path, async function(err, response) {

		REPO.extensions = [];

		if (err)
			return;

		for (let file of response) {

			if (!file.endsWith('.html'))
				continue;

			let body = await Total.readfile(PATH.join(path, file), 'utf8');
			let index = body.indexOf('<script total>');
			let total = null;

			if (index !== -1) {
				total = body.substring(index, body.indexOf('</script>', index + 14) + 9);
				body = body.replace(total, '').trim();
				total = total.substring(14, total.length - 9).trim();
			}

			if (total)
				(new Function(total))();

			REPO.extensions.push(body);
		}

	});

});

FUNC.error = function($, err, message) {
	console.log(new Date().format('yyyy-MM-dd HH:mm:ss'), 'Unexpected error', $.id, err, message);
};

// ==================================
// Controller
// ==================================

exports.install = function() {
	// ROUTE('GET   /', $ => $.redirect(CONF.$api));
	ROUTE('+GET  ?*', admin);
	ROUTE('POST  /pipe/', pipe);
};

function pipe($) {

	if (CONF.pipetoken && $.query.token !== CONF.pipetoken) {
		$.invalid(401);
		return;
	}

	let model = $.body;
	let user = $.headers.authorization;

	try {
		user = user ? JSON.parse(Buffer.from(user, 'base64').toString('utf8')) : null;
	} catch {
		$.invalid(401);
		return;
	}

	if (user) {
		if (user.language)
			$.language = user.language;
		else if ($.query.language)
			$.language = $.query.language;

		if (user.permissions && typeof(user.permissions) === 'string')
			user.permissions = user.permissions.split(',');
	}

	let action = ACTION(model.schema, model.data, $);
	user && action.user(user);
	action.callback($.callback());
}

function admin($) {

	let plugins = [];

	if ($.user.openplatform && !$.user.iframe && $.query.openplatform) {
		$.cookie(CONF.op_cookie, $.query.openplatform, NOW.add('12 hours'));
		$.redirect($.url);
		return;
	}

	let count = 0;

	for (let key in Total.plugins) {
		let item = Total.plugins[key];
		if (!item.visible || item.visible($.user)) {
			let obj = {};
			obj.id = item.id;
			obj.position = item.position;
			obj.name = TRANSLATE($.user.language || '', item.name);
			obj.divider = item.divider === true;
			obj.icon = item.icon;
			obj.import = item.import;
			obj.routes = item.routes;
			obj.welcome = item.welcome;
			obj.hidden = item.hidden;
			plugins.push(obj);

			if (!item.hidden)
				count++;

		}
	}

	let view = $.view('admin', { plugins: plugins });
	view.repository.menu = count > 1;
}

// ==================================
// Authorization
// ==================================

const ADMIN = { id: 'admin', sa: true, name: 'Admin', permissions: [], color: '#4285F4' };

AUTH(function($) {

	let path = $.split[0];

	if (path === 'pipe') {
		$.invalid();
		return;
	}

	let token = $.query.token || $.headers['x-token'];
	if (token) {
		if (FUNC.authtoken)
			FUNC.authtoken($, token);
		else
			$.invalid();
	} else if (CONF.op && CONF.op_reqtoken && CONF.op_restoken)
		OpenPlatform.auth($);
	else if (FUNC.authadmin)
		FUNC.authadmin($);
	else
		$.success(ADMIN);

});

// ==================================
// Reconfiguration
// ==================================

FUNC.reconfigure = async function() {

	if (CONF.database) {

		let table = await DATA.check('information_schema.tables').where('table_schema', CONF.schema || 'public').where('table_name', 'tbl_config').promise();
		if (!table) {
			let sql = await Total.readfile(PATH.root('database.sql'), 'utf8');
			if (sql)
				await DATA.query(sql.format(CONF.schema || 'public')).promise();
		}

		let response = await DATA.find('tbl_config').schema(CONF.schema).fields('id,value,type').promise();
		LOADCONFIG(response);

	}

	for (let key in PLUGINS) {
		let plugin = PLUGINS[key];
		if (plugin.config) {
			for (let cfg of plugin.config) {
				if (MAIN.db.config[cfg.id] === undefined)
					MAIN.db.config[cfg.id] = cfg.value;
			}
		}
	}

	LOADCONFIG(MAIN.db.config);
	EMIT('configure');

};

// ==================================
// Default actions
// ==================================

NEWSCHEMA('Attachment', '*id,*url,*name,*type,*ext,dtcreated:Date,*createdby,size:Number,height:Number,width:Number');

NEWACTION('CL', {
	name: 'Codelists',
	route: 'API ?',
	user: true,
	action: async function($) {

		let value = {};
		if ($.user.platform) {
			value.groups = $.user.platform.groups;
			value.users = $.user.platform.users;
			value.apps = $.user.platform.apps || $.user.platform.modules;
		}

		if (!value.users)
			value.users = EMPTYARRAY;

		if (!value.groups)
			value.groups = EMPTYARRAY;

		if (!value.apps)
			value.apps = EMPTYARRAY;

		let response = await TRANSFORM('CL', value, $);
		$.callback(response);
	}
});

NEWACTION('Account', {
	name: 'Read account information',
	route: 'API ?',
	user: true,
	action: function($) {
		let user = $.user;
		let data = {};
		data.id = user.id;
		data.name = user.name;
		data.sa = user.sa;
		data.color = user.color;
		data.logo = user.platform ? user.platform.logo : '';
		data.openplatform = user.openplatform;
		data.iframe = user.iframe;
		data.permissions = user.permissions || EMPTYARRAY;
		data.groups = user.groups || EMPTYARRAY;
		data.language = user.language;
		data.version = CONF.version;
		$.callback(data);
	}
});

NEWACTION('Ping', {
	route: 'API ?',
	action: function($) {
		$.success();
	}
});

NEWACTION('API', {
	name: 'External API call',
	input: '*schema,data:object',
	route: '+POST ?pipe/',
	user: true,
	action: function($, model) {
		$.pipe(model.schema, model.data, null, function(err, response) {
			if (err)
				$.invalid(err);
			else
				$.callback(response);
		});
	}
});

// ==================================
// OpenPlatform
// ==================================

const EXPIRE = '2 minutes';
var Data = {};

if (!CONF.op_cookie)
	CONF.op_cookie = 'op';

// A temporary object for storing of sessions
Data.sessions = {};
Data.permissions = [];
Data.groups = [];
Data.users = [];

// Meta file
ROUTE('FILE /openplatform.json', function($) {
	let model = {};
	model.name = CONF.name;
	model.icon = CONF.icon;
	model.color = CONF.color;
	model.url = CONF.url || $.hostname();
	model.permissions = Data.permissions;
	$.json(model);
});

ROUTE('#401', function($) {

	// Auto redirect for the OpenPlatform
	if (!$.user && (CONF.op_reqtoken || CONF.op_restoken)) {
		if (!$.xhr && !$.query.login && !$.query.openplatform && CONF.openplatform) {
			$.redirect(QUERIFY(CONF.openplatform, { redirect: $.address }));
			return;
		}
	}

	$.invalid(401);

});

// Auth method
Data.auth = function($) {

	if (!CONF.op_reqtoken || !CONF.op_restoken) {
		$.invalid();
		return;
	}

	let q = $.query;
	let a = q.openplatform || (CONF.op_cookie ? $.cookie(CONF.op_cookie) : '');

	if (!a) {
		$.invalid();
		return;
	}

	let m = a.match(/token=.*?(&|$)/);
	if (!m) {
		$.invalid();
		return;
	}

	// token~sign
	let tmp = m[0].substring(6).split('~');
	let token = tmp[0];
	let sign = tmp[1];
	let session = Data.sessions[token];

	if (session) {
		Data.onread && Data.onread(session);
		$.success(session);
		return;
	}

	let checksum = a.replace('~' + sign, '').md5(CONF.op_reqtoken);
	if (checksum !== sign) {
		$.invalid();
		return;
	}

	let opt = {};

	opt.url = a;
	opt.method = 'GET';
	opt.headers = { 'x-token': sign.md5(CONF.op_restoken) };
	opt.keepalive = true;
	opt.callback = function(err, response) {

		if (err || response.status !== 200) {
			$.invalid();
			return;
		}

		session = response.body.parseJSON(true);

		if (session) {

			if (!session.permissions)
				session.permissions = [];

			Data.groups = session.platform.groups;
			Data.users = session.platform.users;
			session.dtexpire = NOW.add(CONF.op_expire || EXPIRE);
			session.token = token;
			session.logout = Logout;
			session.json = Json;
			session.notification = Notification;
			let hostname = opt.url.substring(0, opt.url.indexOf('/', 10));
			session.iframe = session.iframe === false ? null : (hostname + '/iframe.js');
			CONF.openplatform = hostname;
			Data.sessions[token] = session;
			Data.oncreate && Data.oncreate(session);
			$.success(session);
		} else
			$.invalid();
	};

	REQUEST(opt);
};

ON('service', function() {
	for (let key in Data.sessions) {
		let session = Data.sessions[key];
		if (session.dtexpire < NOW) {
			delete Data.sessions[key];
			Data.onremove && Data.onremove(session);
		}
	}
});

function Json() {
	let obj = {};
	for (let key in this) {
		switch (key) {
			case 'token':
			case 'dtexpired':
			case 'openplatformid':
			case 'openplatform':
			case 'notify':
			case 'notification':
			case 'sign':
			case 'json':
			case 'logout':
			case 'groups':
				break;
			default:
				obj[key] = this[key];
				break;
		}
	}
	obj.openplatform = true;
	return obj;
}

function Notification(body, path, icon, color) {

	let model = {};

	model.body = body;
	model.path = path;
	model.icon = icon;
	model.color = color;

	if (!this.sign)
		this.sign = this.notify.md5(CONF.op_reqtoken).md5(CONF.op_restoken);

	return RESTBuilder.POST(this.notify, model).header('x-token', this.sign).promise();
}

function Logout() {
	let session = Data.sessions[this.token];
	if (session) {
		delete Data.sessions[this.token];
		Data.onremove && Data.onremove(session);
	}
}

Total.extend('Options', 'pipe', function(schema, data, permissions, callback) {
	let $ = this;
	let user = $.user;
	user = { id: user.id, name: user.name, email: user.email, language: user.language, permissions: permissions };
	return PIPE(schema, data, user, callback ? callback : $);
});

// Example: PIPE('HelpDesk|Tickets', null, { id: String, name: String, permissions: String });
global.PIPE = function(schema, data, user, callback) {

	if (!callback || callback.invalid) {
		return new Promise(function(resolve, reject) {
			global.PIPE(schema, data, user, function(err, response) {
				if (err) {
					if (callback.invalid)
						callback.invalid(err);
					else
						reject(err);
				} else
					resolve(response);
			});
		});
	}

	let index = schema.indexOf('|');
	if (index === -1) {
		callback('Invalid external module name');
		return;
	}

	let module = schema.substring(0, index);
	let url = CONF[module];

	if (!url) {
		callback('Invalid external module name');
		return;
	}

	let payload = { schema: schema.substring(index + 1), data: data };
	RESTBuilder.POST(url, payload).keepalive().header('authorization', Buffer.from(JSON.stringify(user), 'utf8').toString('base64')).callback((err, response) => callback(err, response));
};

// Real-time synchronization between apps through the WebSocket
Total.extend('Options', 'notify', function(data) {

	if (!MAIN.ws)
		return;

	let $ = this;
	let user = $.user;
	let payload = {};

	payload.app = CONF.app || CONF.name;
	payload.url = CONF.url;
	payload.action = $.id;
	payload.data = data;
	payload.ip = $.ip;
	payload.ua = $.ua;
	payload.language = $.language;
	payload.user = { id: user.id, name: user.name, openplatform: user.openplatform };
	payload.data = data;

	MAIN.ws.send(payload);

});

// Real-time synchronization between apps through the WebSocket
Total.extend('Options', 'mail', async function(template, email, model) {
	let $ = this;

	if (!model)
		model = {};

	model.app = { name: CONF.name, url: CONF.url, user: $.user ? $.user.name : '' };

	let html = await TEMPLATE(template, model);
	let index = html.indexOf('<title>');
	let subject = html.substring(index + 7, html.indexOf('</title>', index + 8));
	HTMLMAIL(email, subject, html, $.language);
});

LOCALIZE($ => ($.user ? $.user.language : '') || $.query.language || CONF.language || '');
global.OpenPlatform = Data;