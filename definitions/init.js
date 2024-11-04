// Fixed settings
CONF.$customtitles = true;

if (!CONF.cdn)
	CONF.cdn = 'https://cdn.componentator.com';

CONF.version = '1';
CONF.op_icon = 'ti ti-rss-square';
CONF.op_path = '/admin/';

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
	COMPONENTATOR('ui', 'aselected,fileuploader,locale,exec,page,viewbox,navlayout,extend,crop,form,importer,input,box,validate,loading,selected,intranetcss,prompt,notify,message,errorhandler,empty,menu,autofill,enter,dropfiles,breadcrumb,virtualwire,noscrollbar,preview,miniform,datagrid,filebrowser,approve,shortcuts,searchdata,search,searchinput,display,selection,children,icons,directory,colorpicker,cloudeditor,tangular-filesize,textboxlist,datepicker,cloudeditorsimple,ready,listing,keyvalue,configuration,donutchart,stats24,statsbarsimple,barchart,clipboard,edit,choose,imageviewer,tangular-rgba,features,datasource,cl,autocomplete,filereader', true);
	COMPONENTATOR('webui', 'errorhandler,exec,locale,uibuilder,uistudio,directory,message,approve,datepicker,menu,icons,input,imageviewer,mobilecarousel', true);

});