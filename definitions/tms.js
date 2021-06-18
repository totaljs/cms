// Wait until framework is ready all plugins are loaded
ON('ready', function() {
	NEWPUBLISH('contactforms_save', 'ContactForms');
	NEWPUBLISH('subscribers_save', 'Subscribers');
	NEWPUBLISH('newsletters_view', 'id:String,dttms:Date');
	NEWPUBLISH('visitor', 'id:String,unique:Boolean,ping:Boolean,url:String,ip:String,type:String,online:Number,mobile:Boolean,user:String,dtcreated:Date');
});