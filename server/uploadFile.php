<?php
  error_reporting(E_ALL | E_STRICT);
  $response = "";
  if(isset($_FILES)){
  	$allHeaders = apache_request_headers();
  	$fileName = $allHeaders['X-FileName'];
  	if(isset($_POST['mode'])){
  		$mode = $_POST['mode'];
  		if($mode == "resume"){
  			// this is the resume mode. Append to the file instead of overwriting it.
  			if(file_exists(dirname(__FILE__)."/".$fileName)){
  				file_put_contents(dirname(__FILE__)."/".$fileName, file_get_contents($_FILES['file']['tmp_name']), FILE_APPEND | LOCK_EX);
  				$response = "FILE_APPEND_SUCCESSFUL";
  			}else{
  				$response = "file not found !";
  			}	
  		}else if($mode == "upload"){
  			// this is the normal uninterrupted upload mode
  			file_put_contents(dirname(__FILE__)."/".$fileName, file_get_contents($_FILES['file']['tmp_name']), FILE_APPEND | LOCK_EX);
  			$response = "FILE_UPLOAD_SUCCESSFUL";
  		}
  	}
  }
  echo $response;
?>
