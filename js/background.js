
var animationFrames = 36;
var animationSpeed = 10; // ms
var canvas;
var canvasContext;
var loggedInImage;
var pollIntervalMin = 1000 * 60;  // 1 minute
var pollIntervalMax = 1000 * 60 * 5;  // 1 hour
var requestFailureCount = 0;  // used for exponential backoff
var requestTimeout = 1000 * 2;  // 5 seconds
var rotation = 0;
var unreadCount = -1;
var requestTimerId;



function init() {

	canvas = document.getElementById('canvas');
	loggedInImage = document.getElementById('logged_in');
	canvasContext = canvas.getContext('2d');

	chrome.browserAction.setBadgeBackgroundColor({color:[30, 30, 180, 100]});
	chrome.browserAction.setIcon({path: "asanaSmallLogout.png"});

	goGetIt();
}

function scheduleRequest() {
	if (requestTimerId) {
		window.clearTimeout(requestTimerId);
	}
	
	var randomness = Math.random() * 2;
	var exponent = Math.pow(2, requestFailureCount);
	var multiplier = Math.max(randomness * exponent, 1);
	var delay = Math.min(multiplier * pollIntervalMin, pollIntervalMax);
	delay = Math.round(delay);
	
	requestTimerId = window.setTimeout(goGetIt, delay);
}

function isAsanaUrl(asanaURL){
	if(asanaURL.indexOf("asana") != -1){
		return true;
	}
	return false;
}

function ease(x) {
	return (1-Math.sin(Math.PI/2+x*Math.PI))/2;
}

function animateFlip() {
	/* Perform animation
	rotation += 1/animationFrames;
	drawIconAtRotation();
	if (rotation <= 1) {
		setTimeout(animateFlip, animationSpeed);
	} else {*/
		rotation = 0;
		drawIconAtRotation();
		chrome.browserAction.setBadgeText({ text: unreadCount+"" } );
		chrome.browserAction.setBadgeBackgroundColor({color:[52, 173, 0, 255]});
	//}
}

function showLoggedOut() {
	unreadCount = -1;
	chrome.browserAction.setIcon({path:"asanaSmallLogout.png"});
	chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
	chrome.browserAction.setBadgeText({text:"?"});
}

function drawIconAtRotation() {
	canvasContext.save();
	canvasContext.clearRect(0, 0, canvas.width, canvas.height);
	canvasContext.translate(
		Math.ceil(canvas.width/2),
		Math.ceil(canvas.height/2));
	canvasContext.rotate(2*Math.PI*ease(rotation));
	canvasContext.drawImage(loggedInImage,
		-Math.ceil(canvas.width/2),
		-Math.ceil(canvas.height/2));
	canvasContext.restore();

	chrome.browserAction.setIcon({imageData:canvasContext.getImageData(0, 0,
		canvas.width,canvas.height)});
}



function goGetIt(){

	chrome.windows.getCurrent(function(w) {
		//alert("goGetIt")
		chrome.tabs.query({
			active: true,
			windowId: w.id
		}, function(tabs) {
			// Now load our options ...
			Asana.ServerModel.options(function(options) {
				// And ensure the user is logged in ...
				Asana.ServerModel.isLoggedIn(function(is_logged_in) {
					if (is_logged_in) {
						scheduleRequest();
						getRemainingTasks();
					} else {
						showLoggedOut();
						scheduleRequest();
					}
				});
			});
		});
	});
}

function getRemainingTasks(){
	
	unreadCount = 0;
	
	var workspacesArray = null;
	
	Asana.ServerModel.me(function(user) {
		
      	Asana.ServerModel.workspaces(function(workspaces) {
			workspacesArray = workspaces;
			
			if(workspacesArray == null || workspacesArray.length == 0){
				return;
			}
			
			for(var i = 0;i<workspacesArray.length;i++){
				var workspaceID = workspacesArray[i].id;
				
				Asana.ServerModel.tasks(workspaceID,function(tasks) {
		        	
					tasks.forEach(function(task) {
						if(task.completed == false){
		          			unreadCount++;
						}	
		        	});
				
					animateFlip();
		      	});
			}
      	});	
    });
	
}


chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if ( changeInfo.status == "complete" ) {
		if (isAsanaUrl(tab.url) == true) {
  			goGetIt();
  		}
  	}  
}); 


document.addEventListener('DOMContentLoaded', init);
