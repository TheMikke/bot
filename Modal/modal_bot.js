var tasks = [];
var currentTaskId = 0;
var audio;

setTimeout(function() {
    gcFillJobDropdown();
    randomClick();
}, 1000);

function addTaskButton() {
	var c = document.getElementById("job").selectedOptions[0].text;
	var a = document.getElementById("job").value;
	var b = parseInt(document.getElementById("motivation").value);
	if (typeof b != "number" || b < -1 || b > 100) {
		b = 50
	}
	addTask(c, a, b, false)
}

function addTask(g, f, i, b) {
	currentTaskId++;
	var h = document.createElement("tr");
	tasks.push({
		jobId: f,
		motivation: i,
		taskId: currentTaskId,
		row: h,
		isAutoTask: b
	});
	h.onmouseover = function() {
		this.style.background = "rgb(255, 246, 228)"
	};
	h.onmouseout = function() {
		this.style.background = "rgb(255, 255, 255)"
	};
	var e = document.createElement("td");
	e.innerText = g;
	e.style.textAlign = "left";
	e.style.paddingLeft = "5px";
	var d = document.createElement("td");
	d.innerText = i;
	d.style.paddingLeft = "5px";
	d.style.textAlign = "center";
	d.style.borderLeft = "1px solid black";
	var c = document.createElement("td");
	c.style.paddingLeft = "5px";
	c.style.textAlign = "center";
	var a = document.createElement("p");
	a.innerText = "X";
	a.style.cursor = "pointer";
	a.style.margin = "0px";
	a.style.display = "inline";
	a.style.color = "red";
	a.style.fontWeight = "bold";
	c.appendChild(a);
	h.appendChild(e);
	h.appendChild(d);
	h.appendChild(c);
	document.getElementById("tasksList").children[0].insertBefore(h, document.getElementById("elementsForAdding"));
	a.addEventListener("click", Function("delTask(" + currentTaskId + "); tmReset();"))
}

function delTask(b) {
	for (var a = 0; a < tasks.length; a++) {
		if (tasks[a].taskId == b) {
			tasks[a].row.remove();
			tasks.splice(a, 1);
			break
		}
	}
}

function delAutoTasks() {
	var b = [];
	for (var a = 0; a < tasks.length; a++) {
		if (tasks[a].isAutoTask) {
			b.push(tasks[a].taskId)
		}
	}
	for (var a = 0; a < b.length; a++) {
		delTask(b[a])
	}
}
var gameDoc = document;
var gameWin = window;

function randomClick() {
	console.log("randomClick");
	setTimeout(randomClick, parseInt(Math.random() * 170 + 10) * 1000);
	gameDoc.getElementsByClassName("menulink lcharacter")[0].click()
}

function gcFillJobDropdown() {
	gameWin.Ajax.remoteCallMode("work", "index", {}, function(c) {

    gameWin.JobsModel.initJobs(c.jobs);
    gameWin.JobsModel.sortJobs("name", null, "asc");
        for (var a = 0; a < gameWin.JobsModel.Jobs.length; a++) {
            var job = gameWin.JobsModel.Jobs[a];
            var myCondition = (job.jobpoints / job.workpoints) >= 1;
            if (job.jobObj.level && myCondition) {
                var b = document.createElement("option");
                b.value = job.id;
                b.innerText = job.name;
                document.getElementById("job").appendChild(b);
            }
        }
    }, null);
}

function gcStartJob(b, a) {
    gameWin.Ajax.get("map", "get_minimap", {}, function(g) {
        if (g.error) {
            console.error("Dropping gcStartJob: " + g.msg);
            return;
        }

        var jobGroup = g.job_groups[gameWin.JobList.getJobById(b).groupid];
        if (!jobGroup || jobGroup.length === 0) return;

        var start = gameWin.Character.getPosition();
        var target = jobGroup[0];
        var minTime = Math.sqrt((start.x - target[0]) ** 2 + (start.y - target[1]) ** 2) * Game.travelSpeed * Character.speed;

        for (var i = 1; i < jobGroup.length; i++) {
            var current = jobGroup[i];
            var time = Math.sqrt((start.x - current[0]) ** 2 + (start.y - current[1]) ** 2) * Game.travelSpeed * Character.speed;

            if (time < minTime) {
                target = current;
                minTime = time;
            }
        }

        var taskArray = new gameWin.Array();
        taskArray.push(new gameWin.TaskJob(b, target[0], target[1], a));
        gameWin.TaskQueue.add(taskArray);
    }, null);
}

function gcCancelAllJobs() {
	var b = gameDoc.getElementsByClassName("taskAbort");
	for (var a = 0; a < b.length; a++) {
		b[a].click()
	}
}
var currentTask = undefined;
var timerChekingEmploy = undefined;

function tmReset() {
	currentTask = undefined
}

function tmStartWork() {
	if (timerChekingEmploy === undefined) {
		timerChekingEmploy = setInterval(function() {
			console.log("check");
			if (gameWin.TaskQueue.queue.length < 1) {
				if (currentTask) {
					if (gameWin.Character.energy >= 2) {
						gameWin.Ajax.remoteCallMode("work", "index", {}, function(b) {
							gameWin.JobsModel.initJobs(b.jobs);
							if (gameWin.JobsModel.getById(currentTask.jobId).jobmotivation * 100 > currentTask.motivation || currentTask.motivation == -1) {
								console.log("Start job " + gameWin.JobsModel.getById(currentTask.jobId).name + " " + new Date().getHours() + ":" + new Date().getMinutes());
								gcStartJob(currentTask.jobId, tmGetWorkTime())
							} else {
								delTask(currentTask.taskId);
								tmReset()
							}
						}, null)
					}
				} else {
					if (tasks.length > 0) {
						currentTask = tasks[0]
					} else {
						if (autoTasksEnabled) {
							addAutoTasks("experience");
						} else {
							clearInterval(timerChekingEmploy);
							timerChekingEmploy = undefined
						}
					}
				}
			}
		}, 3000)
	}
}

var autoTasksEnabled = false;
function toggleAutoTasks() {
    autoTasksEnabled = !autoTasksEnabled;
    var button = document.getElementById("autoTaskButton");
    if (autoTasksEnabled) {
	button.style.backgroundColor = "#3a1906";
	button.style.color = "#fff";    
        button.textContent = "ON";
        delAutoTasks();
        tmReset();
        tmStartWork();
    } else {
        button.style.backgroundColor = "#fff";
	button.style.color = "#000";
        button.textContent = "OFF";
        delAutoTasks();
        tmReset();
    }
}

function addAutoTasks(a) {
	var customCondition = parseFloat(document.getElementById("customCondition").value);
	gameWin.Ajax.remoteCallMode("work", "index", {}, function(c) {
		gameWin.JobsModel.initJobs(c.jobs);
		gameWin.JobsModel.sortJobs(a, null, "desc");
		tasks = [];
		for (var b = 0; b < gameWin.JobsModel.Jobs.length; b++) {
			var job = gameWin.JobsModel.Jobs[b];
			var myCondition = (job.jobpoints / job.workpoints) > customCondition;
			if (job.jobObj.level && myCondition) {
				var d = 75;
				addTask(job.name, job.id, d, true);
				break
			}
		}
	}, null)
}

function tmGetWorkTime() {
	if (gameWin.Character.energy >= 2) {
		return 15
	}
	return 0
};
