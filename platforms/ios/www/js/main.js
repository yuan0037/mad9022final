var pages = [];
var links=[];
var numLinks = 0;
var numPages = 0;

var globalFileURI;
var globalImageObject;

var canvasForLarge, contextForLarge;
var largeImage, smallImage
var canvasForSmall, contextForSmall;


document.addEventListener('DOMContentLoaded', function(){
                          
                          console.log("add listner for content loaded");
                          document.addEventListener('deviceready', function(){
                                                    largeImage = document.createElement("img");
                                                    smallImage = document.createElement("img");
                                                    
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
                                                    document.querySelector("#btnOK").addEventListener("click", closeModalDialog);
                                                    
                                                    });
                          
                          });





//handle the click event

function handleNav(ev){
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
        getPictureFromDeviceCamera();
    }
    else {
        if ((url == "home") || (url ==null))
        {
            loadPhotoListFromDB();
        }
    }
    
}



//Need a listener for the popstate event to handle the back button

function browserBackButton(ev){
    
    url = location.hash;  //hash will include the "#"
    
    //update the visible div and the active tab
    for(var i=0; i < numPages; i++)
    {
        if(("#" + pages[i].id) == url)
        {
            pages[i].style.display = "block";
        }
        else
        {
            pages[i].style.display = "none";
        }
    }
    
    for(var t=0; t < numLinks; t++)
    {
        links[t].className = "";
        if(links[t].href == location.href){
            links[t].className = "activetab";
        }
    }
}

function ConfirmDelete()
{
    var x = confirm("Are you sure you want to delete?");
    if (x)
        return true;
    else
        return false;
}

function deletePhotoFromDB(ev){
    
    if (ConfirmDelete() == true)
    {
    console.log("delete photo id = ", ev.target.getAttribute("photoID"));
    
    var http = new XMLHttpRequest();
    var url = "http://faculty.edumedia.ca/griffis/mad9022/final-w15/delete.php";
    //var url = "http://localhost:8888/mad9022/ajax/save.php";
    
    var params = "dev="+device.uuid+"&img_id="+ev.target.getAttribute("photoID");
    url = url+"?"+params
    console.log("url=",url);
    http.open("GET", url, true);
    
    http.setRequestHeader("Access-Control-Allow-Origin", "true");
    
    http.onreadystatechange = function() {//Call a function when the state changes.
        console.log("statechanged, status = ", http.status);
        console.log("readystate=", http.readystate);
        //console.log("before, responseText = ", http.responseText);
        if (http.readyState == 4 && http.status == 200) {
            console.log(http.responseText);
        }
    }
    http.send();
    document.querySelector("#photoList").removeChild(ev.target.parentNode);
    console.log("deletePhotoFromDB invoke finished");
    }
}

function closeModalDialog(){
    document.querySelector("[data-role=modal]").style.display="none";
    document.querySelector("[data-role=overlay]").style.display="none";
}

function showLargePhotoInModalDialog(ev){
    var http = new XMLHttpRequest();
    var url = "http://faculty.edumedia.ca/griffis/mad9022/final-w15/get.php";
    //var url = "http://localhost:8888/mad9022/ajax/save.php";
    
    var photoID = ev.target.parentNode.getAttribute("photoID");
    var params = "dev="+device.uuid+"&img_id="+photoID;
    url = url+"?"+params
    console.log("url=",url);
    http.open("GET", url, true);
    
    http.setRequestHeader("Access-Control-Allow-Origin", "true");
    
    http.onreadystatechange = function() {//Call a function when the state changes.
        if (http.readyState == 4 && http.status == 200) {
            console.log("after get photo = ", http.responseText);
            
            //------------------show modal dialog---------
            document.querySelector("[data-role=modal]").style.display="block";
            document.querySelector("[data-role=overlay]").style.display="block";
            document.querySelector("#modalLargeImage").src = JSON.parse(http.responseText).data;
        }
    }
    http.send();
    console.log("showLargePhotoInModalDialog invoke finished");
}

function showPhotos(photoArray){
    console.log("showPhotos invoked");
    var ul = document.querySelector("#photoList");
    ul.innerHTML = "";
    
    try
    {
        //console.log("after parsed to json: " + typeof(JSON.parse(photoArray)));
        photoArray =JSON.parse(photoArray);
        for (i=0; i<photoArray.thumnbails.length; i++)
        {
            var li = document.createElement("li");
            li.setAttribute("photoID", photoArray.thumnbails[i].id);

            var thumbImage = document.createElement("img");
            var deleteBtn = document.createElement("BUTTON");
            deleteBtn.setAttribute("photoID", photoArray.thumnbails[i].id);
            
            var deleteBtnCaption = document.createTextNode("Delete");       // Create a text node
            deleteBtn.appendChild(deleteBtnCaption);                                // Append the text to <button>
            deleteBtn.addEventListener("click", deletePhotoFromDB);
            
            var mcForSmallImage = new Hammer.Manager(thumbImage);
            mcForSmallImage.add(new Hammer.Tap({ event: 'singletap' , taps: 1, threshold: 5}) );
            mcForSmallImage.on("singletap", showLargePhotoInModalDialog);
            

            thumbImage.src = photoArray.thumnbails[i].data;
            
            li.appendChild(thumbImage);
            li.appendChild(deleteBtn);
            ul.appendChild(li);
        }
    }
    catch(err) {
        console.log("cannot convert to JSON, error = ", err.message);
    }

}
function loadPhotoListFromDB(){
    console.log("loadPhotoListFromDB invoked");
    var http = new XMLHttpRequest();
    var url = "http://faculty.edumedia.ca/griffis/mad9022/final-w15/list.php";
    //var url = "http://localhost:8888/mad9022/ajax/save.php";

    var params = "dev="+device.uuid;
    url = url+"?"+params
    console.log("url=",url);
    http.open("GET", url, true);
    
    http.setRequestHeader("Access-Control-Allow-Origin", "true");
    
    http.onreadystatechange = function() {//Call a function when the state changes.
        if (http.readyState == 4 && http.status == 200) {
            showPhotos(http.responseText);
        }
    }
    http.send();
    console.log("loadPhotoListFromDB invoke finished");
    
}


function getPictureFromDeviceCamera(){
    console.log("getPictureFromCamera invoked");
    if (!navigator.camera) {
        console.log("Camera API not supported", "Error");
        return;
    }
    
    var opts = {
        quality : 75,
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: Camera.PictureSourceType.CAMERA,
        allowEdit : true,
        encodingType : Camera.EncodingType.JPEG,
        mediaType: Camera.MediaType.PICTURE,
        targetWidth : 400,
        targetHeight : 400,
        cameraDirection : Camera.Direction.FRONT,
        saveToPhotoAlbum : false
        
    };
    
    navigator.camera.getPicture(imgSuccess, imgFail, opts);
    
}

function imgFail(message)
{
    alert('Failed because: '+ message);
}



function imgSuccess(fileURI){
    console.log(fileURI);

    canvasForLarge = document.querySelector("#photoFromCamera");
    //good idea to set the size of the canvas in Javascript in addition to CSS
    canvasForLarge.height = 300;
    canvasForLarge.width = 400;
    contextForLarge = canvasForLarge.getContext('2d');
    
    canvasForSmall = document.querySelector("#thumbPhoto");
    //good idea to set the size of the canvas in Javascript in addition to CSS
    canvasForSmall.height = 180;
    canvasForSmall.width = 180;
    contextForSmall = canvasForSmall.getContext('2d');
    
    largeImage.addEventListener("load", function(ev){
                       //load to canvas after the image is loaded
                       //in this sample the original is 300px x 400px
                       //alert( i.width + " " + i.height)
                                console.log("large image load listener");
                                console.log("large image width, height = ", largeImage.width, largeImage.height);
                                console.log("ev.currentTarget==", ev.currentTarget);
                        console.log("ev.currentTarget.width height == ", ev.currentTarget.width, ev.currentTarget.height);
                       var imgWidth = ev.currentTarget.width;
                       var imgHeight = ev.currentTarget.height;
                       var aspectRatio = imgWidth / imgHeight;
                       //alert(aspectRatio)
                       ev.currentTarget.height = canvasForLarge.height;
                       ev.currentTarget.width = canvasForLarge.height * aspectRatio;
                       var w = largeImage.width;
                       var h = largeImage.height;
                       console.log("width: ", w, " height: ", h, " aspect ratio: ", aspectRatio);
                       canvasForLarge.width = w;
                       canvasForLarge.style.width = w + "px";
                       contextForLarge.drawImage(largeImage, 0, 0, w, h);
                       //drawImage(image, x-position, y-position, width, height)
                       });
    
    smallImage.addEventListener("load", function(ev){
                                console.log("small image load listener");
                                //load to canvas after the image is loaded
                                //in this sample the original is 300px x 400px
                                //alert( i.width + " " + i.height)
                                console.log("small image width, height = ", smallImage.width, smallImage.height);
                                console.log("ev.currentTarget==", ev.currentTarget);
                                console.log("ev.currentTarget.width height == ", ev.currentTarget.width, ev.currentTarget.height);
                                var imgWidth = ev.currentTarget.width;
                                var imgHeight = ev.currentTarget.height;
                                var aspectRatio = imgWidth / imgHeight;
                                //alert(aspectRatio)
                                ev.currentTarget.height = canvasForSmall.height;
                                ev.currentTarget.width = canvasForSmall.height*aspectRatio;
                                var w = smallImage.width;
                                var h = smallImage.height;
                                console.log("width: ", w, " height: ", h, " aspect ratio: ", aspectRatio);
                                canvasForSmall.width = w;
                                canvasForSmall.style.width = w + "px";
                                contextForSmall.drawImage(smallImage, 0, 0, w, h);
                                //drawImage(image, x-position, y-position, width, height)
                                });
    
    
    largeImage.src = fileURI;
    smallImage.src = fileURI;
    console.log("large and small image loaded done");
    
}

function drawTextOnContext(context, canvas, image, text){
    
    if(text != ""){
        console.log("draw triggered once");
        //clear the canvas
        context.clearRect(0, 0, canvas.w, canvas.h);
        //reload the image
        var w = image.width;
        var h = image.height;
        
        context.drawImage(image, 0, 0, w, h);
        //THEN add the new text to the image
        var middle = canvas.width / 2;
        var bottom = canvas.height - 30;
        var top = 30;
        context.font = "20px sans-serif";
        context.fillStyle = "red";
        context.strokeStyle = "gold";
        context.textAlign = "center";
        
        if (document.querySelector('input[name="position"]:checked').value == "bottom")
        {
            context.fillText(text, middle, bottom);
            context.strokeText(text, middle, bottom);
        }
        else
        {
            context.fillText(text, middle, top);
            context.strokeText(text, middle, top);
        }
    }
}

function addText(ev){
    var txt = document.querySelector("#textOnPhoto").value;
    if(txt != ""){
        drawTextOnContext(contextForLarge, canvasForLarge, largeImage, txt);
        drawTextOnContext(contextForSmall, canvasForSmall, smallImage, txt);
    }
}

function savePhotoToDB(){
    console.log("savePhotoToDB invoked");
    var http = new XMLHttpRequest();
    var url = "http://faculty.edumedia.ca/griffis/mad9022/final-w15/save.php";


    console.log(getLargeImageBase64Code());
    console.log(getSmallImageBase64Code());
    var params = "dev="+device.uuid+"&img="+getLargeImageBase64Code()+"&thumb="+getSmallImageBase64Code();
    console.log("params=",params);
    http.open("POST", url, true);
    
    //Send the proper header information along with the request
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    http.setRequestHeader("Content-length", params.length);
    http.setRequestHeader("Connection", "close");
    http.setRequestHeader("Access-Control-Allow-Origin", "true");
    
    http.onreadystatechange = function() {//Call a function when the state changes.
        if(http.readyState == 4 && http.status == 200) {
            console.log("photo saved");
        }
    };
    http.send(params);
    console.log("savePhotoToDB invoke finished");
}

function getLargeImageBase64Code(){
    var largeImageBase64 = canvasForLarge.toDataURL("image/jpeg", 1.0);
    return largeImageBase64;
}

function getSmallImageBase64Code(){
    var smallImageBase64 = canvasForSmall.toDataURL("image/jpeg", 1.0);
    return smallImageBase64;
}
