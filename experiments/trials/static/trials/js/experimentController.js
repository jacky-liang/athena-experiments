//Global Variables
var gameData = {lastSwitch: 0};
var gameMode = {tedious: 0, relaxed: 1};
var experimentData = {events: []};
var maxStringLength = 10;
var minStringLength = 5;
var numString = 1;
var numCircles = 4;
var experimentDuraction = null;

//Initializes the game
function initGame(tediousFirst){
  gameData.score = 0;
  updateScore();
  gameData.lastSwitch = 0;
  gameData.currentTask = 0;
  console.log("Finished Initialization, waiting on user ready...");

  var startTime = new Date();
  experimentData.startTime = startTime;
  if (tediousFirst){
    tediousTask();
  }else{
    relaxedTask();
  }
  updateTime();
}

//Helper Functions

//Sets up the tedious Task
function tediousTask(){
  $('#gameWindow').empty();
  $('#userInput').css("display", "block");
  $('#scoreWindow').css("display", "block");
  gameData.taskCount = numString;
  gameData.tediousArray = [];
  gameData.prevLength = 0;
  //Generate random strings for current tedious task
  for(var i = 0; i < numString; i++){
    var curString = generateString();
    gameData.tediousArray.push(curString);
    $newdiv = $("<div id =" + curString + " class = \"tediousTask\">" + curString + "</div>");
    gameData.curString = curString;
    $('#gameWindow').append($newdiv);
    $('#' + curString).css({"left": $('#gameWindow').width()/2 - $('#' + curString).width()/2})
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
  var curString = gameData.curString;
 
  if (input == curString){
    //End of tedious task, finished completing the string
    storeTediousData(curString[curString.length -1], input[input.length -1], false, true);
    gameData.score++;
    updateScore();
    $('#' + curString).remove();
    $('#userInput').val("");
    gameData.taskCount--;
    if (gameData.taskCount == 0){
      tediousTask();
    }
  }else{
    //The task isn't complete because the string is not correct
    //Highlight the correct characters
    var correctString = "";
    for (var i in input){
      if (i < curString.length && input[i] == curString[i]){
        correctString = correctString + curString[i];
      }else{
        break;
      }
    }
    var wrongString = curString[correctString.length];
    var restOfString = curString.substring(correctString.length + 1);
    if (input.length == correctString.length){
      wrongString = "";
      restOfString = curString.substring(correctString.length);
      if (gameData.prevLength - input.length== 1){
        //They pressed backspace
        storeTediousData(input.slice(-1), null, true, true);
      }else{
        storeTediousData(correctString[correctString.length - 1], input[input.length - 1], false, true);
      }
    }else{
      if (gameData.prevLength - input.length == 1){
        //They pressed backspace
        storeTediousData(wrongString, null, true, false);
      }else{
        storeTediousData(wrongString, input[input.length - 1], false, false);
      }
    }
    $('#' + curString).html('<span style="color: green">'+ correctString + '</span>' + '<span style="color: red">'+ wrongString + '</span>' + restOfString);
  }
  gameData.prevLength = input.length;
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
      scroll: false,
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
        storeRelaxedData(false, true, true);
        gameData.taskCount--;
        if (gameData.taskCount == 0){
          relaxedTask();
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

//Determines if it is time to switch Task
function chooseTask(){
  var curDuration = Math.round(getExperimentTime());
  if (experimentData.ratio == 1 || experimentData.period == -1){
    return gameData.currentTask;
  }
  if (gameData.currentTask == gameMode.tedious){
    //If the current task is tedious, check to see if duration is up
    var tediousDuration = experimentData.ratio * experimentData.period;
    var switchDuration = Math.round(gameData.lastSwitch + tediousDuration);
  }else{
    var relaxedDuration = (1 - experimentData.ratio) * experimentData.period;
    var switchDuration = Math.round(gameData.lastSwitch + relaxedDuration);
  }
  if (curDuration >= switchDuration){
      gameData.lastSwitch = getExperimentTime();
      return otherTask(gameData.currentTask);
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
  var submit_event_url = "/trials/data/events/?id=" + ENV.TRIAL_ID;
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
  $('#score').empty();
  $('#score').append("Score: " + gameData.score);
}

function updateTime(){
  $('#time').empty();
  var curSeconds = getExperimentTime();
  var gameDuration = ENV.TRIAL_LENGTH;
  var delta = gameDuration - curSeconds;
  if (delta <= 0){
    endExperiment();
    return;
  }
  var minutesLeft = Math.floor(delta/60);
  var secondsLeft= Math.round(delta - minutesLeft*60);
  if (secondsLeft == 60){
    minutesLeft = minutesLeft + 1;
    secondsLeft = 0;
  }
  $('#time').append("Time: " + minutesLeft + ":" + ("0" + secondsLeft).slice(-2));
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
 function csrfSafeMethod(method) {
      return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
 }
 
 $.ajaxSetup({
  beforeSend: function(xhr, settings) {
      if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
          xhr.setRequestHeader("X-CSRFToken", ENV.CSRF);
          }
      }
  });

  var startTrialUrl = "/trials/time_start/?id=" + ENV.TRIAL_ID;
  $.ajax({
    type: "POST",
    url: startTrialUrl,
    success: function(res){
      if (res.success){
        experimentData.ratio = ENV.trial_type.ratio; //Get ratio from ENV here
        experimentData.period = ENV.trial_type.period; //Get period here
        //TediousFirst Parameter- temporarily set as true
        initGame(ENV.trial_type.tedious_first);
        window.setInterval(function(){
          updateTime();
          var newTask = chooseTask();
          if (newTask != gameData.currentTask){
            gameData.currentTask = newTask;
            startTask(newTask);
          }
        }, 1000);
      }else{
        alert("Experiment not set up correctly: " + res.msg);
      }
    }
  });

});
