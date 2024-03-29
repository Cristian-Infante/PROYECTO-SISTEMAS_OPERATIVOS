$(document).ready(function () {
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
	var R = 0;
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
			utilization = parseFloat(utilization.toPrecision(4));

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
				waitTimes[i] = parseFloat(waitTimes[i].toPrecision(4));
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

			fcfs = fullExplanation;

			document.getElementById('explanation-equation1').innerHTML = 'TpEspera: ';
			document.getElementById('explanation-equation1_1').innerHTML = averageWait;
			document.getElementById('explanation-equation1_2').innerHTML = 'ms';
			$("#explanation-equation1_3").html('<p id="p"><br>TpRetorno: ' + averageWait2 + 'ms');
			$("#explanation-equation1_4").html('<p id="p"><br>TpRespuesta: ' + averageWait3 + 'ms');
			$("#explanation-equation").html('<p class="lead">Utilización de la CPU: ' + utilization + '%');

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

		if ($("#bar1_" + index).length == 0) {
			$(".progress1").append(" <div class='progress-bar' data-toggle='tooltip' title=' ' data-placement='right' id='bar1_" + index + "' role='progressbar' >" + processName + "</div>");
		} else {
			$("#bar1_" + index).removeClass("progress-bar-context	");
		}
		$("#bar1_" + index).addClass("progress-bar-idle");
		if (processName == "context switch") {
			$("#bar1_" + index).addClass("progress-bar-context");
		} else if (processName == "idle") {
			$("#bar1_" + index).addClass("progress-bar-context");
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
		$("#bar1_" + index).attr('title', toolTipTitle + "\nInicio: " + start + "\nFin: " + end + "\nDuración: " + duration);
		//sets the processName, should be blank for context switch or idle
		$("#bar1_" + index).text(newName);
		//sets the width of the progress bar item
		$("#bar1_" + index).css('width', percent + "%");
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
		sortArriveTimes();
		while (isDone() == false) {
			fillGaps();
			var i = findSmallestBurstIndex();
			bar.addItem(processArray[i].processName, processArray[i].burstTime);
			processArray[i].finished();
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


	function optimo(){
		var Optimo = [];
		var Optimo2 = ["FCFS", "SJF", "Prioridad", "Round Robin"];
		Optimo[0] = Number(document.getElementById('explanation-equation1_2').innerHTML);
		Optimo[0] = parseFloat(Optimo[0].toPrecision(4));
		Optimo[1] = Number(document.getElementById('explanation-equation2_1').innerHTML);
		Optimo[1] = parseFloat(Optimo[1].toPrecision(4));
		Optimo[2] = Number(document.getElementById('explanation-equation3_1').innerHTML);
		Optimo[2] = parseFloat(Optimo[2].toPrecision(4));
		Optimo[3] = Number(document.getElementById('explanation-equation4_1').innerHTML);
		Optimo[3] = parseFloat(Optimo[3].toPrecision(4));
			
		let dataLen = Optimo.length;
		for(let i=0; i < dataLen; i++){
			for(let j=0; j < dataLen; j++){
				if(j+1 !== dataLen){
				if(Optimo[j] > Optimo[j+1]){
					let swapElement = Optimo[j+1];
					Optimo[j+1] = Optimo[j];
					Optimo[j] = swapElement;

					let swapElement2 = Optimo2[j+1];
					Optimo2[j+1] = Optimo2[j];
					Optimo2[j] = swapElement2;
				}
				}  
			}
		}
		if(Optimo[0] == Optimo[1] && Optimo[1] == Optimo[2] && Optimo[2] == Optimo[3]){
			document.getElementById('optimo').innerHTML = 'Todos los algoritmos de planificacion de procesos0 tienen la misma efectividad';
		}
		else{
			if(Optimo[0] == Optimo[1] && Optimo[1] == Optimo[2]){
				document.getElementById('optimo').innerHTML = 'Excepto ' + Optimo2[3] + ' todos los algoritmos tienen la misma efectividad';
			}
			else{
				if(Optimo[0] == Optimo[1]){
					document.getElementById('optimo').innerHTML = 'Los mejores algoritmos son: ' + Optimo2[0] + ' y ' + Optimo2[1];
				}
				else{
					document.getElementById('optimo').innerHTML = 'El mejor algoritmo es: ' + Optimo2[0];
				}
			}
		}
	}
	function run() {
		if(R == 0){
			document.getElementById("main1").style.display = "none";
		}
		else{
			document.getElementById("main1").style.display = "block";
		}

		loadValues();
		if (processArray.length > 0) {
			sortArriveTimes();
			position = 0;

			algorithm = "FCFS";
			bar = new progressBar();
			FCFS();
			bar.displayBar();

			/*algorithm = "SJF";
			bar = new progressBar();
			SJF();
			bar.displayBar();*/

			/*algorithm = "Round Robin";
			bar = new progressBar();
			roundRobin();
			bar.displayBar();*/

			/*algorithm = "Prioridad";
			bar = new progressBar();
			priority();
			bar.displayBar();*/
			optimo();
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

			var ruler = $("#rule1").empty();
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


		var width = $(".progress1").width();

		var spacing = (width / itemAmount) + "px";
		$(".ruler1").css("padding-right", spacing).find("li").css("padding-left", spacing);
		$(".zero").css("padding-left", 0);
		$(".zero").css("padding-right", "0.5px");

	}
	$('#add_row').click(function () {
		processCount++;
		$("#row_" + processCount).collapse("show");

		$('#remove_row').prop("disabled", false);
		if (processCount == 10) {
			$('#add_row').prop("disabled", true);
		}
		run();
		$('#proccess_num').val(processCount);
	});
	$('#remove_row').click(function () {

		$("#row_" + processCount).collapse("hide");
		processCount--;

		$('#add_row').prop("disabled", false);
		if (processCount == 2) {
			$('#remove_row').prop("disabled", true);
		}
		run();
		$('#proccess_num').val(processCount);
	});
	// when you enter a quantum time, used for Round Robin
	$('#enter_quantum').on('input propertychange paste', function () {

		if (isNaN($(this).val()) == false && $(this).val() != 0) {
			timeQuantum = Number($(this).val());
		}

		run();
	});
	//when you input a value into the table
	$('td input').on('input propertychange paste', function () {
		processCount = Number($("#proccess_num").val());
		run();
	});
	$('#SIMULAR').click(function () {
		console.log("hola1");

		function getRandomInt(min, max) {
			min = Math.ceil(min);
			max = Math.floor(max);
			return Math.floor(Math.random() * (max - min) + min);
		}
		processCount = getRandomInt(2, 11);

		if (processCount < processCount2) {
			for (var i = processCount2; i > processCount; i--) {
				$("#row_" + i).collapse("hide");
			}
		} else if (processCount > processCount2) {
			for (var i = processCount2; i <= processCount; i++) {
				$("#row_" + i).collapse("show");
			}
		}

		processCount2 = processCount;
		$('#proccess_num').val(processCount);

		$('#remove_row').prop("disabled", false);
		$('#add_row').prop("disabled", false);
		if (processCount == 2) {
			$('#remove_row').prop("disabled", true);
		} else if (processCount == 10) {
			$('#add_row').prop("disabled", true);
		}


		timeQuantum = getRandomInt(1, 11);
		$('#enter_quantum').val(timeQuantum);

		$('#subtract_quantum').prop("disabled", false);
		$('#add_quantum').prop("disabled", false);
		if (timeQuantum == 1) {
			$('#subtract_quantum').prop("disabled", true);
		}
		if (timeQuantum == 10) {
			$('#add_quantum').prop("disabled", true);
		}


		for (var i = 0; i <= processCount; i++) {
			$("#arrive_" + i).val(getRandomInt(0, 10));
			$("#burst_" + i).val(getRandomInt(1, 10));
			$("#priority_" + i).val(getRandomInt(0, 10));
		}
		R = 1;
		run();

	})
	$('#RESET').click(function () {
		//window.location.reload()
	})
	$(window).resize(function () {
		createRuler(bar.sum);
	});
});