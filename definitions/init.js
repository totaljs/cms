// Fixed settings
CONF.allow_custom_titles = true;
CONF.version = '1';
CONF.op_icon = 'ti ti-rss-square';
CONF.op_path = '/admin/';

if (!PREF.name)
	PREF.name = 'CMS';

if (!PREF.cdn)
	PREF.cdn = '//cdn.componentator.com';

ON('ready', function() {

	for (var key in F.plugins) {
		var item = F.plugins[key];
		if (item.permissions)
			OpenPlatform.permissions.push.apply(OpenPlatform.permissions, item.permissions);
	}

	OpenPlatform.permissions.push({ id: 'settings', name: 'Settings' });

	// Load CMS db
	setTimeout(FUNC.load, 500);

	// UI components
	COMPONENTATOR('ui', 'exec,locale,aselected,page,fileuploader,viewbox,navlayout,extend,crop,form,input,importer,box,validate,loading,selected,intranetcss,notify,message,errorhandler,empty,menu,autofill,enter,dropfiles,breadcrumb,virtualwire,noscrollbar,preview,miniform,datagrid,filebrowser,approve,shortcuts,searchdata,search,searchinput,display,selection,children,icons,directory,colorpicker,cloudeditor,tangular-filesize,textboxlist,datepicker,cloudeditorsimple,ready,listing,keyvalue,configuration,donutchart,statsbarsimple,stats24,barchart,clipboard', true);
	COMPONENTATOR('webui', 'exec,errorhandler,locale,uibuilder,uistudio,datepicker,directory,menu,input,icons', true);

});