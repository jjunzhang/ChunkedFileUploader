'use strict';
var chunkedFileUploader = {
	config : {
		bytes_per_chunk : 1024 * 1024 * 2,
		maxUploadSize: 1024*1024*50,
		fileRowTemplate: "",
		files: [],
		container:{},
		uploadActionTargets:{}
	},
	
	getRowTemplate: function(){
		var fileRowTemplate = [];
		fileRowTemplate.push('<li id="file-(id)"><span class="info_inline title">(title)</span>');
		fileRowTemplate.push('<span class="info_inline">(type)</span><span class="info_inline">(size)</span>');
		fileRowTemplate.push('<span class="info_inline_status">(status)</span><span class="info_inline">(pause)</span>');
		fileRowTemplate.push('<span class="info_inline">(resume)</span></li>');
		this.config.fileRowTemplate = fileRowTemplate.join(" ");
	},
	
	getNewFileRowTemplate: function(newFiles){
		// append file info to the body
		var fileRow = '';
		for(var i=0; i<newFiles.length;i++){
			var _file = newFiles[i];
			var ts = _file.name+new Date().getTime();
			var status = _file.size > chunkedFileUploader.config.maxUploadSize?"Oversized Please Rechoose":"to be uploaded";
			var fileRowObj = {
				title:	typeof _file.name != "undefined" ?_file.name:"unknown",
				type: _file.type,
				size:_file.size+'B',
				status: status,
				pause:  '<button type="pause" file-id="'+ts+'">pause</button>',
				resume: '<button type="resume" file-id="'+ts+'">resume</button>',
				id: ts
			};
			fileRow += chunkedFileUploader.config.fileRowTemplate.replace(/\(\w+\)/gi,function(matches){
				var matched = fileRowObj[matches.replace(/[\(\)]/g,"")];
				return matched == "undefined"? "": matched;
			});
			if(_file.size <= chunkedFileUploader.config.maxUploadSize){
				chunkedFileUploader.config.files.push(ts);
				chunkedFileUploader.config.files[ts] = _file;
			}
		}
		return fileRow;
	},
	
	submit: function(){
		this.config.uploadActionTargets.submitButton.addEventListener('click', function(e){
			for(var key in chunkedFileUploader.config.files){
				if(chunkedFileUploader.config.files[key].size && chunkedFileUploader.config.files[key].size > 0 && !chunkedFileUploader.config.files[key].submited){
					// send files parallelly
					var _file = chunkedFileUploader.config.files[key];
					var span = chunkedFileUploader.config.container.getElementsByTagName('span');
					span[3].innerHTML = "Uploading...";
					chunkedFileUploader.config.files[key].submited = true;
					iniXHR(_file,key,"POST", "server/uploadFile.php", "upload", _file.slice(0, chunkedFileUploader.config.bytes_per_chunk),{ 'X-FileName' : _file.name }, 0);
				}
			}
		});
	},
	
	change: function(){
		this.config.uploadActionTargets.uploaderButton.addEventListener('change', function(e){
			// append file info to the body
			var newFileRow = chunkedFileUploader.getNewFileRowTemplate(this.files);
			chunkedFileUploader.config.container.insertAdjacentHTML("beforeEnd", newFileRow);
		}, false);
	},
	
	process: function(){
		this.config.uploadActionTargets.onProcessButton.addEventListener('click', function(event){
			var files = chunkedFileUploader.config.files;
			var target = event.target;
			if(target.hasAttribute("file-id") && /^button$/i.test(target.tagName)){
				var fileId = target.getAttribute("file-id");
				var span = document.getElementById("file-"+fileId).getElementsByTagName('span');
				if(target.getAttribute("type") == 'pause') {
					// stop xmlhttprequest for this file
					target.disabled = true;
					span[3].innerHTML = "Pausing...";
					files[fileId].xhr.abort();
				}
				if(target.getAttribute("type") == 'resume') {
					// resume xmlhttprequest for this file
					span[3].innerHTML = "Uploading...";
					target.disabled = true;
					target.parentElement.previousElementSibling.firstChild.disabled = false;
					var _xhr2 = new XMLHttpRequest();
					var file = files[fileId];
					_xhr2.open("GET", "server/getBytesFromServer.php?fileName="+file.name, true);
					_xhr2.send();
					_xhr2.onload = function(){
						if(_xhr2.readyState == 4){
							if(_xhr2.status == 200 && _xhr2.response){
								response = JSON.parse(_xhr2.response);
								/**
								 * {fileName: myAwesomeFile,bytesUploaded : 2440}
								 */
								var bytesSent = response.bytesUploaded;
								var fileBlob = file.slice(bytesSent, bytesSent+chunkedFileUploader.config.bytes_per_chunk); // crux of this article
								/** upload this remaining file to the server now */
								iniXHR(file, fileId, "POST", "server/uploadFile.php", "resume", fileBlob, { 'X-FileName' : file.name }, bytesSent);
							}
						}
					}
				}
				if(target.getAttribute("type") == 'remove' && files) {
					// remove file from server side
					span[3].innerHTML = "Removing...";
					var __xhr = new XMLHttpRequest();
					__xhr.open("GET", "server/removeFile.php?fileName="+files[fileId].name, true);
					//retrieve the entry for the stored file reference
					__xhr.send();
					__xhr.onload = function(){
						if(__xhr.readyState == 4){
							if(__xhr.status == 200 && __xhr.response){
								files.splice(fileId, 1);
							}
						}
					}
				}
			}
		});
	},
	
	init: function(ini){
		this.getRowTemplate();
		if(ini.container){
			this.config.container = ini.container;
		}else{
			throw "Container for Uploader need to be set";
			return;
		}
		if(ini.uploadActionTargets){
			this.config.uploadActionTargets = ini.uploadActionTargets;
		}else{
			throw "Action targets for Uploader need to be set";
			return;
		}
		if(ini.chunkedFileSize)
			this.config.chunkedFileSize = ini.chunkedFileSize;
		if(ini.maxUploadSize)
			this.config.chunkedFileSize = ini.maxUploadSize;
		this.change();
		this.process();
		this.submit();
	}
};

function iniXHR(file, fileId, method, url, mode, fileDataURL, headersObject, start){
	//create the object
	var xhr = new XMLHttpRequest();
	xhr.open(method, url, true);
	chunkedFileUploader.config.files[fileId].xhr = xhr;
	//append the form data
	var formData = new FormData();
	formData.append('file', fileDataURL);
	formData.append('mode', mode);
	xhr.onload = function(){
		if(xhr.readyState == 4){
			if(xhr.status == 200){
				if(xhr.response === "FILE_UPLOAD_SUCCESSFUL" || xhr.response === "FILE_APPEND_SUCCESSFUL"){
					if (start + chunkedFileUploader.config.bytes_per_chunk <= file.size) {
						localStorage.setItem(fileId, start + "");
						start += chunkedFileUploader.config.bytes_per_chunk;
						iniXHR(file, fileId, "POST", "server/uploadFile.php", "upload", file.slice(start, start+chunkedFileUploader.config.bytes_per_chunk), { 'X-FileName' : file.name }, start);
					}else{
						/** note that once the upload completes, make sure to remove
						*  the storageLocal entry.
						*/
						localStorage.removeItem(fileId);
						// add remove button
						var li = document.getElementById("file-"+fileId);
						var item = li.lastElementChild;
						li.removeChild(item);
						item = li.lastElementChild;
						item.innerHTML = '<button type="remove" file-id="'+fileId+'">remove</button>';
						var span = li.getElementsByTagName('span');
						span[3].innerHTML = "Completed!";
						chunkedFileUploader.config.files.splice(fileId, 1);
					}
				}
			}
		}
	}
	 
	xhr.onerror = function(error){
		
	}
	//add request headers if any
	for(var header in headersObject)
		xhr.setRequestHeader(header, headersObject[header]);
	xhr.send(formData);
}
