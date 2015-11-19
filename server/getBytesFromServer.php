<?php
  if(isset($_REQUEST['fileName'])){
			$fileName = $_REQUEST['fileName'];
			$fileSize = 0;
			$response = array(
				'fileName' => $fileName,
				'bytesUploaded' => $fileSize
			);
			 
			if($fileName != NULL){
				try{
					$fileSize = filesize(dirname(__FILE__)."/".$fileName); // filesize() is a built-in function which returns the size of the file in bytes
				}
				catch(Exception $e){
					$fileSize = -1;
				}
			}
			$response['bytesUploaded'] = $fileSize;
			echo json_encode($response, TRUE);
	}
?>
