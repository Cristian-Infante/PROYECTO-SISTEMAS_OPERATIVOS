$(document).ready(function () {
	$('#explanation-equation3');
	$(".priority").collapse({
		toggle: true
	});

	//used to keep track of how long the CPU has been running as opposed to idle
	var runningTime = 0;
	//the time it takes to switch between processes
	var contexSwitch = 0;
	//array used to store the processes
	var processArray = [];
	//the time quantum used in Round Robin
	var timeQuantum = 2;
	//the amount of processes, this is used to load in values into processArray
	var processCount = 3;
	var processCount2 = 3;
	//used to keep track of the position
	var position = 0;
	//things are put into here to display
	var bar = new progressBar();
	var fcfs = 0,
		sjf = 0,
		rr = 0,
		pr = 0;
	//set up program initially
	run();
	setTimeout(function () {
		run()
	}, 200);

	//used for SJF, finds the index of the next available smallest job
	function findSmallestBurstIndex() {
		var smallestIndex = 0;
		var smallestBurst = 0;
		//finds an initial burst time
		for (var i = 0; i < processArray.length; i++) {
			if (processArray[i].done == false && processArray[i].arrivalTime <= position) {
				smallestIndex = i;
				smallestBurst = processArray[i].burstTime;
				break;
			}
		}
		//looks through the array to find a smaller burst time
		for (var i = smallestIndex; i < processArray.length; i++) {
			if (processArray[i].burstTime < smallestBurst && processArray[i].done == false && processArray[i].arrivalTime <= position) {
				smallestIndex = i;
				smallestBurst = processArray[i].burstTime;
			}
		}
		return smallestIndex;
	}

	function findSmallestPriorityIndex() {
		var smallestIndex = 0;
		var smallestPriority = 0;
		//finds an initial burst time
		for (var i = 0; i < processArray.length; i++) {
			if (processArray[i].done == false && processArray[i].arrivalTime <= position) {
				smallestIndex = i;
				smallestPriority = processArray[i].priority;
				break;
			}
		}
		//looks through the array to find a smaller burst time
		for (var i = smallestIndex; i < processArray.length; i++) {
			if (processArray[i].priority < smallestPriority && processArray[i].done == false && processArray[i].arrivalTime <= position) {
				smallestIndex = i;
				smallestPriority = processArray[i].priority;
			}
		}
		return smallestIndex;
	}
	//checks if all the processes have completed
	function isDone() {
		var done = true;
		for (var i = 0; i < processArray.length; i++) {
			if (processArray[i].done == false) {
				done = false;
			}
		}
		return done;
	}
	//inserts idle time if no process is ready to go yet
	function fillGaps() {
		for (var i = 0; i < processArray.length; i++) {
			if (processArray[i].done == false) {
				if (processArray[i].arrivalTime > position) {
					bar.addItem("idle", processArray[i].arrivalTime - position);
				}
				break;
			}
		}
	}
	//used to display the gant chart
	function progressBar() {
		this.indexes = [];
		this.names = [];
		this.sum = 0;
		this.addItem = function (name, progressLength) {
			var previousName = this.names[this.names.length - 1];
			//if the process being added is the same as the current one, combine them
			if (this.names.length > 0 && previousName == name) {
				this.indexes[this.indexes.length - 1] += progressLength;
				this.sum += progressLength;
				position += progressLength;
			} else {
				if (previousName != "idle" && previousName != "context switch" && name != "idle" && position != 0 && contexSwitch > 0 || name == "idle" && progressLength <= contexSwitch && position != 0) {
					this.indexes[this.indexes.length] = contexSwitch;
					this.names[this.names.length] = "context switch";
					this.sum += contexSwitch;
					position += contexSwitch;
					position = parseFloat(position.toPrecision(12));
				}
				if ((name == "idle" && progressLength <= contexSwitch && position != 0) == false) {
					this.indexes[this.indexes.length] = progressLength;
					this.names[this.names.length] = name;
					this.sum += progressLength;
					position += progressLength;
				}
			}
			position = parseFloat(position.toPrecision(12));
			this.sum = parseFloat(this.sum.toPrecision(12));
		}

		this.displayBar = function () {
			var pos = 0;
			for (var i = 0; i < this.indexes.length; i++) {
				var length = (this.indexes[i] / this.sum) * 100;
				addToBar(this.names[i], length, pos, this.indexes[i], i);
				pos += this.indexes[i];
				pos = parseFloat(pos.toPrecision(12));
			}
			createRuler(this.sum);

			var utilization = parseFloat((runningTime / this.sum).toPrecision(3)) * 100;

			sortNames();
			var waitTimes = [];
			waitTimes[0] = processArray[0].finishTime - processArray[0].arrivalTime - processArray[0].initialBurst;
			waitTimes[0] = parseFloat(waitTimes[0].toPrecision(12));
			var waitSum = waitTimes[0];

			var waitTimes2 = [];
			waitTimes2[0] = processArray[0].finishTime - processArray[0].arrivalTime;
			waitTimes2[0] = parseFloat(waitTimes2[0].toPrecision(12));
			var waitSum2 = waitTimes2[0];

			var waitTimes3 = [];
			waitTimes3[0] = processArray[0].finishTime - processArray[0].initialBurst;
			waitTimes3[0] = parseFloat(waitTimes3[0].toPrecision(12));
			var waitSum3 = waitTimes3[0];

			var fullExplanation = '';
			fullExplanation = 'TpEspera: ';

			for (var i = 1; i < processArray.length; i++) {
				waitTimes[i] = processArray[i].finishTime - processArray[i].arrivalTime - processArray[i].initialBurst;
				waitTimes[i] = parseFloat(waitTimes[i].toPrecision(12));
				waitSum += waitTimes[i];
				
				waitTimes2[i] = processArray[i].finishTime - processArray[i].arrivalTime;
				waitTimes2[i] = parseFloat(waitTimes2[i].toPrecision(4));
				waitSum2 += waitTimes2[i];
				
				waitTimes3[i] = processArray[i].finishTime - processArray[i].initialBurst;
				waitTimes3[i] = parseFloat(waitTimes3[i].toPrecision(4));
				waitSum3 += waitTimes3[i];
			}
			var averageWait = waitSum / processArray.length;
			averageWait = Math.round(averageWait * 10000) / 10000;
			averageWait = parseFloat(averageWait.toPrecision(4));
			
			var averageWait2 = waitSum2 / processArray.length;
			averageWait2 = Math.round(averageWait2 * 10000) / 10000;
			averageWait2 = parseFloat(averageWait2.toPrecision(4));
			
			var averageWait3 = waitSum3 / processArray.length;
			averageWait3 = Math.round(averageWait3 * 10000) / 10000;
			averageWait3 = parseFloat(averageWait3.toPrecision(4));

			sjf = fullExplanation;

			document.getElementById('explanation-equation3').innerHTML = 'TpEspera: ';
			document.getElementById('explanation-equation3_1').innerHTML = averageWait;
			document.getElementById('explanation-equation3_2').innerHTML = 'ms';
			$("#explanation-equation3_3").html('<p id="p"><br>TpRetorno: ' + averageWait2 + 'ms');
			$("#explanation-equation3_4").html('<p id="p"><br>TpRespuesta: ' + averageWait3 + 'ms');

			//set the equation text
			//updates equation
			Preview.Update();
		}
	}

	function process(processName, burstTime, arrivalTime, pIndex, newPriority) {
		this.processName = processName;
		this.burstTime = burstTime;
		this.initialBurst = burstTime;
		this.arrivalTime = arrivalTime;
		this.done = false;
		this.hasStarted = false;
		this.finishTime;
		this.priority = newPriority;
		this.pIndex = pIndex;
		this.finished = function () {
			this.done = true;
			this.finishTime = position;
		}
	}
	//sorts the processArray in terms of arrival times
	function sortArriveTimes() {
		function compareArrivals(process1, process2) {
			if (process1.arrivalTime > process2.arrivalTime) {
				return 1;
			} else if (process1.arrivalTime < process2.arrivalTime) {
				return -1;
			} else {
				return 0;
			}
		}
		processArray.sort(compareArrivals);
	}
	//sorts the processArray in terms of process names. i.e. P1,P2,P3, etc
	function sortNames() {
		function compareNames(process1, process2) {
			if (process1.pIndex > process2.pIndex) {
				return 1;
			} else if (process1.pIndex < process2.pIndex) {
				return -1;
			} else {
				return 0;
			}
		}
		processArray.sort(compareNames);
	}
	//loads the values into processArray from the table
	function loadValues() {
		processArray = [];
		runningTime = 0;
		var index = 0;
		for (var i = 0; i < processCount; i++) {
			var burstTime = Number($("#burst_" + (i + 1)).val()) + 0.0;
			runningTime += burstTime;
			var arrivalTime = Number($("#arrive_" + (i + 1)).val()) + 0.0;
			var processName = "P" + (i + 1);
			var priority = Number($("#priority_" + (i + 1)).val()) + 0.0;
			if (burstTime > 0 && isNaN(arrivalTime) == false) {
				processArray[index] = new process(processName, burstTime, arrivalTime, i, priority);
				index++;
			}
		}
	}

	function addToBar(processName, percent, start, duration, index) {
		//find the end time of the process
		var end = start + duration;
		end = parseFloat(end.toPrecision(12));

		if ($("#bar3_" + index).length == 0) {
			$(".progress3").append(" <div class='progress-bar' data-toggle='tooltip' title=' ' data-placement='right' id='bar3_" + index + "' role='progressbar' >" + processName + "</div>");
		} else {
			$("#bar3_" + index).removeClass("progress-bar-context");
		}
		$("#bar3_" + index).addClass("progress-bar-idle");
		if (processName == "context switch") {
			$("#bar3_" + index).addClass("progress-bar-context");
		} else if (processName == "idle") {
			$("#bar3_" + index).addClass("progress-bar-context");
		}
		var newName = processName;
		var tooltip;
		var toolTipTitle = processName;
		if (processName == "idle") {
			toolTipTitle = "CPU sin uso";
			newName = "";
		} else if (processName == "context switch") {
			toolTipTitle = "Context Switch";
			newName = "";
		}
		//sets the tooltip
		$("#bar3_" + index).attr('title', toolTipTitle + "\nInicio: " + start + "\nFin: " + end + "\nDuración: " + duration);
		//sets the processName, should be blank for context switch or idle
		$("#bar3_" + index).text(newName);
		//sets the width of the progress bar item
		$("#bar3_" + index).css('width', percent + "%");
	}


	function FCFS() {
		sortArriveTimes();
		for (var i = 0; i < processArray.length; i++) {
			fillGaps();
			bar.addItem(processArray[i].processName, processArray[i].burstTime);
			processArray[i].finished();
		}
	}

	function SJF() {
		function findNextJump(proccessIndex) {
			var interruptFound = false;
			for (var i = 0; i < processArray.length; i++) {
				if (processArray[i].done == false &&
					processArray[i].arrivalTime < position + processArray[proccessIndex].burstTime &&
					processArray[i].arrivalTime > processArray[proccessIndex].arrivalTime &&
					processArray[i].burstTime < processArray[proccessIndex].burstTime &&
					i != proccessIndex &&
					processArray[i].hasStarted == false) {
					processArray[proccessIndex].burstTime -= processArray[i].arrivalTime - position;
					bar.addItem(processArray[proccessIndex].processName, processArray[i].arrivalTime - position);
					processArray[proccessIndex].hasStarted = true;
					interruptFound = true;
					break;
				}
			}
			if (interruptFound == false) {
				bar.addItem(processArray[proccessIndex].processName, processArray[proccessIndex].burstTime);
				processArray[proccessIndex].finished();
			}
		}
		sortArriveTimes();
		while (isDone() == false) {
			fillGaps();
			var i = findSmallestBurstIndex();
			findNextJump(i);
		}
	}

	function priority() {
		function findNextJump(proccessIndex) {
			var interruptFound = false;
			for (var i = 0; i < processArray.length; i++) {
				if (processArray[i].done == false &&
					processArray[i].arrivalTime < position + processArray[proccessIndex].burstTime &&
					processArray[i].arrivalTime > processArray[proccessIndex].arrivalTime &&
					processArray[i].priority < processArray[proccessIndex].priority &&
					processArray[i].hasStarted == false) {
					processArray[proccessIndex].burstTime -= processArray[i].arrivalTime - position;
					bar.addItem(processArray[proccessIndex].processName, processArray[i].arrivalTime - position);
					processArray[proccessIndex].hasStarted = true;
					interruptFound = true;
					break;
				}
			}
			if (interruptFound == false) {
				bar.addItem(processArray[proccessIndex].processName, processArray[proccessIndex].burstTime);
				processArray[proccessIndex].finished();
			}
		}
		sortArriveTimes();
		while (isDone() == false) {
			fillGaps();
			var i = findSmallestPriorityIndex();
			findNextJump(i);
		}
	}

	function roundRobin() {
		function findNextJump(index) {
			while (true) {
				if (processArray[index].burstTime <= timeQuantum && processArray[index].done == false && processArray[index].arrivalTime <= position) {
					bar.addItem(processArray[index].processName, processArray[index].burstTime);
					processArray[index].finished();
					index = (index + 1) % processArray.length
					return index;
					break;
				}
				if (processArray[index].done == false && processArray[index].arrivalTime <= position && processArray[index].burstTime > timeQuantum) {
					processArray[index].burstTime -= timeQuantum;
					bar.addItem(processArray[index].processName, timeQuantum);
				}
				index = (index + 1) % processArray.length
			}
		}
		var i = 0;
		sortArriveTimes();
		while (isDone() == false) {
			fillGaps();
			i = findNextJump(i);
		}
	}


	function run() {
		loadValues();
		if (processArray.length > 0) {
			sortArriveTimes();
			position = 0;

			/*algorithm = "FCFS";
			bar = new progressBar();
			FCFS();
			bar.displayBar();*/

			/*algorithm = "SJF";
			bar = new progressBar();
			SJF();
			bar.displayBar();*/

			/*algorithm = "Round Robin";
			bar = new progressBar();
			roundRobin();
			bar.displayBar();*/

			algorithm = "Prioridad";
			bar = new progressBar();
			priority();
			bar.displayBar();
		}
	}
	//creates the tick marks under the gant chart
	function createRuler(itemAmount) {

		var multi = 1;
		var word = " " + itemAmount;

		if (itemAmount > 5000) {
			var power = Math.pow(10, word.length - 2);
			itemAmount = itemAmount / power;
			multi = power;
		} else if (itemAmount > 2500) {
			itemAmount = itemAmount / 100;
			multi = 100;
		} else if (itemAmount > 1000) {
			itemAmount = itemAmount / 50;
			multi = 50;
		} else if (itemAmount > 500) {
			itemAmount = itemAmount / 25;
			multi = 25;
		} else if (itemAmount > 100) {
			itemAmount = itemAmount / 10;
			multi = 10;
		} else if (itemAmount > 50) {
			itemAmount = itemAmount / 5;
			multi = 5;
		}


		for (var j = 0; j < itemAmount; j++) {

			var ruler = $("#rule3").empty();
			var len = Number(itemAmount) || 0;
			// add text
			var item = $(document.createElement("li"));
			$(item).addClass("zero");
			ruler.append(item.text(0));
			for (var i = 0; i < len; i++) {
				var item = $(document.createElement("li"));
				ruler.append(item.text(((i + 1) * multi)));
			}
		}


		var width = $(".progress3").width();

		var spacing = (width / itemAmount) + "px";
		$(".ruler3").css("padding-right", spacing).find("li").css("padding-left", spacing);
		$(".zero").css("padding-left", 0);
		$(".zero").css("padding-right", "0.5px");

	}
	$('#add_row').click(function () {
		processCount = Number($("#proccess_num").val());
		run();
	});
	$('#remove_row').click(function () {
		processCount = Number($("#proccess_num").val());
		run();
	});
	$('#subtract_quantum').click(function () {
		timeQuantum = Number($(this).val());
		run();
	});
	$('#add_quantum').click(function () {
		timeQuantum = Number($(this).val());
		run();
	});
	//when you input a value into the table
	$('td input').on('input propertychange paste', function () {
		processCount = Number($("#proccess_num").val());
		run();
	});
	$('#SIMULAR').click(function () {
		processCount = Number($("#proccess_num").val());
		run();
	})
	$(window).resize(function () {
		createRuler(bar.sum);
	});
});