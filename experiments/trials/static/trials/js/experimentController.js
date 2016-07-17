//Global Variables
var gameData = {lastSwitch: 0};
var gameMode = {tedious: 0, relaxed: 1};
var experimentData = {events: [], taskDuration: 0.5, experimentType: 0};
var maxStringLength = 10;
var minStringLength = 5;
var numString = 1;
var numCircles = 4;
var experimentDuraction = null;

//Initializes the game
function initGame(){
	gameData.score = 0;
	updateScore();
	gameData.lastSwitch = 0;
	gameData.currentTask = 0;
	console.log("Finished Initialization, waiting on user ready...");
	var readyDiv = document.createElement('div');

	var startTime = new Date();
	experimentData.startTime = startTime;
	tediousTask();
}

//Helper Functions

//Sets up the tedious Task
function tediousTask(){
	$('#gameWindow').empty();
	$('#userInput').css("display", "block");
	$('#scoreWindow').css("display", "block");
	gameData.taskCount = numString;
	gameData.tediousArray = [];

	//Generate random strings for current tedious task
	for(var i = 0; i < numString; i++){
		var curString = generateString();
		gameData.tediousArray.push(curString);
		var divsize = 15 * maxStringLength;
		var posx = (Math.random() * ($('#gameWindow').width() - divsize)).toFixed();
    var posy = (Math.random() * ($('#gameWindow').height() - divsize)).toFixed();
		$newdiv = $("<div id =" + curString + " class = \"tediousTask\">" + curString + "</div>").css({
			'position':'absolute',
      'left':posx+'px',
      'top':posy+'px',
    });
		gameData.curChar = curString[0];
		gameData.curString = curString;
		gameData.playerString = "";
		gameData.prevString = "";
		$('#gameWindow').append($newdiv);
	}
}

function relaxedTask(){
	$('#gameWindow').empty();
	$('#userInput').css("display", "none");
	$('#scoreWindow').css("display", "none");

	gameData.taskCount = numCircles;
	var circleTypes = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
	
	for (var i = 0; i < numCircles; i++){
		var divsize = ((Math.random()*100) + 50).toFixed();
		makeCircle(circleTypes[i], divsize, "");
		makeCircle(circleTypes[i], divsize, "sibling");
	}
}

//Handles the tedious Task inputs
function getUserText(){
	var input = $('#userInput').val();
	if (input == ""){
		return;
	}
	var curString = gameData.curString;
	if (input.length > 1){
		if (gameData.prevString.length - input.length == 1){
			storeTediousData(gameData.curChar, null, true, false);
		}else{
			storeTediousData(gameData.curChar, input[input.length-1], false, false);
		}
		gameData.prevString = input; 
		return;
	}else if (input == gameData.curChar){
		//If the user has typed same character as the current character -> color the character green and move on
		storeTediousData(gameData.curChar, input[input.length-1], false, true);
		gameData.playerString = gameData.playerString + input;
		//End of the tedious task, finished completing the string
		if (gameData.playerString == gameData.curString){
			gameData.score++;
			updateScore();
			$('#' + curString).remove();
			$('#userInput').val("");
			gameData.taskCount--;
			if (isTimeUp()){
				endExperiment();
				return;
			}
			if (gameData.taskCount == 0){
				startTask(chooseTask());
			}
		}else{
			//The string has not been completed yet -> mark completed part green and leave the rest untouched
			var endString = curString.substring(gameData.playerString.length);
			$('#' + curString).html('<span style="color: green">'+ gameData.playerString + '</span>' + endString);
			$('#userInput').val("");
			gameData.curChar = curString.substring(gameData.playerString.length, gameData.playerString.length + 1);
		}	
	}else{
		//This current character is incorrect -> color it red
		if (gameData.prevString.length - input.length == 1){
			storeTediousData(gameData.curChar, null, true, false);
		}else{
			storeTediousData(gameData.curChar, input[input.length-1], false, false);
		}
		var endString = curString.substring(gameData.playerString.length + 1);
		var incorrectChar = curString.substring(gameData.playerString.length, gameData.playerString.length + 1);
		$('#' + curString).html('<span style="color: green">'+ gameData.playerString + '</span>' + '<span style="color: red">'+ incorrectChar + '</span>' + endString);	
	}
	gameData.prevString = input; 
}

function makeCircle(num, divsize, type){
    $newdiv = $('<div class = "circleContainer" id = "circle' + num + type +'" />').css({
        'width':divsize+'px',
        'height':divsize+'px',
        'display':'inline-block',
    });

    // make position sensitive to size and document's width
    var posx = (Math.random() * ($('#gameWindow').width() - divsize)).toFixed();
    var posy = (Math.random() * ($('#gameWindow').height() - divsize)).toFixed();

    $newdiv.css({
        'position':'absolute',
        'left':posx+'px',
        'top':posy+'px',
    })

    var otherType = "";
    if (type == ""){
    	otherType = "sibling";
    }
    $newdiv.draggable({
			start: function(){
				storeRelaxedData(true, false, false);
			},
			stop: function(){
				storeRelaxedData(false, true, false);
			},
		});
    $newdiv.droppable({
    	tolerance: "intersect",
    	accept: '#circle' + num + otherType,
    	hoverClass: "hover",
    	drop: function(event, ui){
    		ui.draggable.remove();
    		$(this).remove();
    		if (isTimeUp()){
					endExperiment();
					return;
				}
				storeRelaxedData(false, true, true);
    		gameData.taskCount--;
    		if (gameData.taskCount == 0){
    			startTask(chooseTask());
    		}
    	}
    });
    
    $newdiv.prepend('<img src="' + ENV.ASSET_PATH + 'circle' + num + '.png" class = "circleImg"/>');
    $('#gameWindow').append($newdiv);
}

//Returns time in seconds
function getExperimentTime(){
	var curTime = new Date();
	return ((curTime.getTime() - experimentData.startTime.getTime())/1000);
}

//Returns time in minutes
function getCurTime(){
	var curTime = new Date();
	return ((curTime.getTime() - experimentData.startTime.getTime())/1000)/60;
}

/*
Determines if time is greater than experiment duration
	Time is up -> true
	Time isn't up yet -> false
*/
function isTimeUp(){
	return  getCurTime(experimentData.startTime) > experimentDuration;
}

//Determines if it is time to switch Task
function chooseTask(){
	var curDuration = getCurTime();
	var switchDuration = experimentData.taskDuration + gameData.lastSwitch;
	//Switch every taskDuration
	if (experimentData.experimentType == 0){
		if (curDuration > switchDuration){
			gameData.lastSwitch = getCurTime();
			gameData.currentTask = otherTask(gameData.currentTask);
			return gameData.currentTask;
		}
	}
	return gameData.currentTask;
}

function startTask(task){
	if (task == gameMode.tedious){
		tediousTask();
		return;
	}
	relaxedTask();
}

function otherTask(task){
	if (task == gameMode.tedious){
		return gameMode.relaxed;
	}
	return gameMode.tedious;
}

function generateString()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
		var stringLength = Math.round(Math.random() * maxStringLength);

		//Keep generating stringLengths until it matches the size we want
		while(stringLength < minStringLength){
			stringLength = Math.round(Math.random() * maxStringLength);
		}
	
    for( var i=0; i < stringLength; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

//Ends the experiment
function endExperiment(){
	$('#gameWindow').empty();
	$('#gameWindow').append("<div>Experiment is over..</div>");
	submit_event_url = "/trials/data/events/?id=" + ENV.TRIAL_ID;
	$.ajax({
		type: "POST",
		url: submit_event_url,
		contentType: 'application/json',
		data: JSON.stringify(experimentData.events),
		dataType: 'json',
		success: function(res){
			if (res.success){
				complete_url = '/trials/complete/?id=' + ENV.TRIAL_ID;
				window.location=complete_url;
			}else{
				alert("YOU MESSED UP BUD");
			}
		}
	});
}

//Updates the score Window
function updateScore(){
	$('#scoreWindow').empty();
	$('#scoreWindow').append("Score: " + gameData.score);
}

function storeRelaxedData(drag, release, correct){
	var Event = {
		'Timestamp': getExperimentTime(),
		'Action': {
			'Tedious': null,	
			'Relaxed': {
				'circle_drag': drag,
				'circle_release': release,
				'result': correct
			}
		}
	};
	experimentData.events.push(Event);
}

function storeTediousData(intendedChar, pressedChar, isBackspace, correct){
	var Event = {
		'Timestamp': getExperimentTime(),
		'Action': {
			'Relaxed': null,	
			'Tedious': {
				'intended_char': intendedChar,
				'pressed_char': pressedChar,
				'is_backspace': isBackspace,
				'result': correct
			}
		}
	};
	experimentData.events.push(Event);
}

$(document).ready(function(){
	experimentDuration = ENV.TRIAL_LENGTH; //Time in minutes
	initGame();
});
