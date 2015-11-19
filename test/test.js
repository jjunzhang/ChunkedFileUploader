chunkedFileUploader.init({
	container: document.getElementById("uploadUl"),
	uploadActionTargets:{
		uploaderButton: document.getElementById('uploadFile'),
		submitButton: document.getElementById('submit'),
		onProcessButton: document.getElementById('uploadUl')
	},
	chunkedFileSize: 1024*1024*2,
	maxUploadSize: 1024*1024*50
});
