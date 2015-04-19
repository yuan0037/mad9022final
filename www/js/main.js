var pages = [];
var links=[];
var numLinks = 0;
var numPages = 0;
var c, context, i;
var globalFileURI;
var globalImageObject;

document.addEventListener('DOMContentLoaded', function(){
                          
                          console.log("add listner for content loaded");
                          document.addEventListener('deviceready', function(){
                                                    
                                                    pages = document.querySelectorAll('[data-role="page"]');
                                                    numPages = pages.length;
                                                    links = document.querySelectorAll('[data-role="pagelink"]');
                                                    numLinks = links.length;
                                                    for(var i=0;i<numLinks; i++)
                                                    {
                                                        var mcForLink = new Hammer.Manager(links[i]);
                                                        mcForLink.add(new Hammer.Tap({ event: 'singletap' , taps: 1, threshold: 5}) );
                                                        mcForLink.on("singletap", handleNav);
                                                    }
                                                    
                                                    //add the listener for the back button
                                                    window.addEventListener("popstate", browserBackButton, false);
                                                    loadPage(null);
                                                    document.querySelector("#applyText").addEventListener("click", addText);
                                                    document.querySelector("#saveToDB").addEventListener("click", savePhotoToDB);
                                                    
                                                    
                                                    
                                                    

                                                    
                                                    
                                                    
                                                    
                                                    });
                          
                          });





//handle the click event

function handleNav(ev){
    
    console.log("handleNav invoked, ev = ", ev);
    
    ev.preventDefault();
    
    var href = ev.target.href;
    
    var parts = href.split("#");
    
    loadPage( parts[1] );
    
    return false;
    
}



//Deal with history API and switching divs

function loadPage(url){
    
    console.log("url = ", url);
    
    if(url == null)
        
    {
        
        //home page first call
        
        pages[0].style.display = 'block';
        
        history.replaceState(null, null, "#home");
        
    }
    
    else
        
    {
        
        for(var i=0; i < numPages; i++)
            
        {
            
            if(pages[i].id == url){
                
                pages[i].style.display = "block";
                
                history.pushState(null, null, "#" + url);
                
            }
            
            else
                
            {
                
                pages[i].style.display = "none";
                
            }
            
        }
        
        
        
        for(var t=0; t < numLinks; t++)
            
        {
            
            links[t].className = "";
            
            if(links[t].href == location.href)
                
            {
                
                links[t].className = "activetab";
                
            }
            
        }
        
    }
    
    
    
    if (url == "takephoto")
        
    {
        console.log("start to take photo");
        getPicture();
        
    }
    
}



//Need a listener for the popstate event to handle the back button

function browserBackButton(ev){
    
    url = location.hash;  //hash will include the "#"
    
    //update the visible div and the active tab
    
    for(var i=0; i < numPages; i++){
        
        if(("#" + pages[i].id) == url){
            
            pages[i].style.display = "block";
            
        }else{
            
            pages[i].style.display = "none";
            
        }
        
    }
    
    for(var t=0; t < numLinks; t++){
        
        links[t].className = "";
        
        if(links[t].href == location.href){
            
            links[t].className = "activetab";
            
        }
        
    }
    
}


function getPicture(){
    
    console.log("getPicture invoked");
    if (!navigator.camera) {
        console.log("Camera API not supported", "Error");
        return;
    }
    
    var options =   {   quality: 50,
    destinationType: Camera.DestinationType.DATA_URL,
    sourceType: 1,      // 0:Photo Library, 1=Camera, 2=Saved Album
    encodingType: 0     // 0=JPG 1=PNG
    };
    
    var opts = {
        quality : 75,
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: Camera.PictureSourceType.CAMERA,
        allowEdit : true,
        encodingType : Camera.EncodingType.JPEG,
        mediaType: Camera.MediaType.PICTURE,
        targetWidth : 100,
        targetHeight : 100,
        cameraDirection : Camera.Direction.FRONT,
        saveToPhotoAlbum : false
        
    };
    
    navigator.camera.getPicture(imgSuccess, imgFail, opts);
    
}

function imgFail(message){
    
    alert('Failed because: '+ message);
    
}



function imgSuccess(fileURI){
    console.log(fileURI);
//    
//    var canvas = document.getElementById('photoFromCamera');
//    context = canvas.getContext('2d');
//    if (!globalImageObject)
//    {
//        globalImageObject = new Image();
//        globalImageObject.onload = function() {
//            console.log("context.draw");
//            context.drawImage(globalImageObject, 0, 0);
//        };
//    }
//    globalFileURI = fileURI
//    globalImageObject.src = globalFileURI;
    
    
    i = document.createElement("img");
    c = document.querySelector("#photoFromCamera");
    //good idea to set the size of the canvas in Javascript in addition to CSS
    c.height = 600;
    c.width = 800;
    context = c.getContext('2d');
    i.addEventListener("load", function(ev){
                       //load to canvas after the image is loaded
                       //in this sample the original is 300px x 430px
                       //we want to resize it to fill the height of our canvas - 600px;
                       //alert( i.width + " " + i.height)
                       var imgWidth = ev.currentTarget.width;
                       var imgHeight = ev.currentTarget.height;
                       var aspectRatio = imgWidth / imgHeight;
                       //alert(aspectRatio)
                       ev.currentTarget.height = c.height;
                       ev.currentTarget.width = c.height * aspectRatio;
                       var w = i.width;
                       var h = i.height;
                       console.log("width: ", w, " height: ", h, " aspect ratio: ", aspectRatio);
                       c.width = w;
                       c.style.width = w + "px";
                       context.drawImage(i, 0, 0, w, h);
                       //drawImage(image, x-position, y-position, width, height)
                       });
    
    i.src = fileURI;
    console.log("done");
    
}

function addText(ev){
    var txt = document.querySelector("#textOnPhoto").value;
    console.log("addText invoked");
    if(txt != ""){
        //clear the canvas
        context.clearRect(0, 0, c.w, c.h);
        //reload the image
        var w = i.width;
        var h = i.height;
        context.drawImage(i, 0, 0, w, h);
        //THEN add the new text to the image
        var middle = c.width / 2;
        var bottom = c.height - 50;
        var top = 50;
        context.font = "30px sans-serif";
        context.fillStyle = "red";
        context.strokeStyle = "gold";
        context.textAlign = "center";
        
        if (document.querySelector('input[name="position"]:checked').value == "bottom")
        {
        context.fillText(txt, middle, bottom);
        context.strokeText(txt, middle, bottom);
        }
        else
        {
            context.fillText(txt, middle, top);
            context.strokeText(txt, middle, top);
        }
    }
}

function savePhotoToDB(){
    console.log("savePhotoToDB invoked");
    var http = new XMLHttpRequest();
    //var url = "http://faculty.edumedia.ca/griffis/mad9022/final-w15/save.php";
    var url = "http://localhost:8888/mad9022/ajax/save.php";
    var params = "dev="+device.uuid+"&img=abc&thumb=bbd";
    console.log("params=",params);
    http.open("POST", url, true);
    
    //Send the proper header information along with the request
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    http.setRequestHeader("Content-length", params.length);
    http.setRequestHeader("Connection", "close");
    http.setRequestHeader("Access-Control-Allow-Origin", "true");
    
    http.onreadystatechange = function() {//Call a function when the state changes.
        console.log("statechanged, status = ", http.status);
        if(http.readyState == 4 && http.status == 200) {
            console.log(http.responseText);
        }
    }
    http.send(params);
    console.log("savePhotoToDB invoke finished");
}
