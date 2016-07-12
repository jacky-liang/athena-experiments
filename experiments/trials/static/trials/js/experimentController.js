//Global Variables
var gameData = {lastSwitch: 0};
var gameMode = {tedious: 0, relaxed: 1};
var experimentData = {experimentType: 0, taskDuration: 0.5};	//ExperimentType not used
var experimentDuration = 5; //Time in minutes
var stringLength = 7;
var numString = 5;
var numCircles = 4;

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
	gameData.taskCount = numString;
	gameData.tediousArray = [];

	//Generate random strings for current tedious task
	for(var i = 0; i < numString; i++){
		var curString = generateString();
		gameData.tediousArray.push(curString);
		var divsize = ((Math.random()*100) + 50).toFixed();
		var posx = (Math.random() * ($('#gameWindow').width() - divsize)).toFixed();
    var posy = (Math.random() * ($('#gameWindow').height() - divsize)).toFixed();
		$newdiv = $("<div id =" + curString + " class = \"tediousTask\">" + curString + "</div>").css({
			'position':'absolute',
      'left':posx+'px',
      'top':posy+'px',
    });
		$('#gameWindow').append($newdiv);
	}
}

function relaxedTask(){
	$('#gameWindow').empty();
	$('#userInput').css("display", "none");

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

	//If the user hasn't pressed enter yet, do nothing
	if (input.indexOf("\n") == -1){
		return;
	}else{	//User pressed enter, check for any matches with the generated words
		var userInput = (input.split("\n"))[0];
		for (var i in gameData.tediousArray){
			if(gameData.tediousArray[i] == userInput){	//If user typed in a right word, determine which game to switch to
				gameData.score++;
				updateScore();
				$('#' + userInput).remove();
				gameData.taskCount--;
				storeExperimentData();
				if (isTimeUp()){
					endExperiment();
					return;
				}
				if (gameData.taskCount == 0){
    			startTask(chooseTask());
    		}
			}
		}
		//Clear text area if user didn't match anything
		$('#userInput').val("");
	}
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
    $newdiv.draggable();
    $newdiv.droppable({
    	tolerance: "touch",
    	accept: '#circle' + num + otherType,
    	hoverClass: "hover",
    	drop: function(event, ui){
    		ui.draggable.remove();
    		$(this).remove();
    		if (isTimeUp()){
					endExperiment();
					return;
				}
    		storeExperimentData();
    		gameData.taskCount--;
    		if (gameData.taskCount == 0){
    			startTask(chooseTask());
    		}
    	}
    });
    
    $newdiv.prepend('<img src="' + ENV.ASSET_PATH + 'circle' + num + '.png" class = "circleImg"/>');
    $('#gameWindow').append($newdiv);
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
}

//Updates the score Window
function updateScore(){
	$('#scoreWindow').empty();
	$('#scoreWindow').append("Score: " + gameData.score);
}

//Stores experiment data
function storeExperimentData(){

}

$(document).ready(function(){
	initGame();
});
