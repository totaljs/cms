// Fixed settings
CONF.allow_custom_titles = true;
CONF.version = '1';
CONF.op_icon = 'ti ti-rss-square';
CONF.op_path = '/admin/';

if (!PREF.name)
	PREF.name = 'CMS';

if (!PREF.cdn)
	PREF.cdn = '//cdn.componentator.com';

if (!PREF.cookie)
	PREF.set('cookie', U.random_string(5).toLowerCase());

if (!PREF.cookie_secret)
	PREF.set('cookie_secret', GUID(15));

// UI components
COMPONENTATOR('ui', 'exec,locale,aselected,part,navlayout,fileuploader,viewbox,crop,form,input,importer,box,validate,loading,selected,intranetcss,notify,message,errorhandler,empty,menu,autofill,enter,dropfiles,breadcrumb,virtualwire,noscrollbar,preview,miniform,datagrid,filebrowser,approve,shortcuts,searchdata,search,searchinput,display,selection,children,icons,directory,colorpicker,cloudeditor,tangular-filesize,textboxlist,datepicker,cloudeditorsimple,ready,listing,keyvalue,configuration,donutchart,statsbarsimple,stats24,barchart', true);

ON('ready', function() {

	// Loads configuration
	FUNC.reconfigure();

	for (var key in F.plugins) {
		var item = F.plugins[key];
		if (item.permissions)
			OpenPlatform.permissions.push.apply(OpenPlatform.permissions, item.permissions);
	}

	OpenPlatform.permissions.push({ id: 'settings', name: 'Settings' });

	// Load CMS db
	setTimeout(FUNC.load, 500);

});

if (!PREF.user) {
	var password = GUID(10);
	PREF.set('user', { id: UID(), login: GUID(10), password: password.sha256(PREF.cookie_secret), raw: password });
}