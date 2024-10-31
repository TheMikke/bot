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
    h.setAttribute("data-task-id", currentTaskId);

    h.onclick = function() {
    const isSelected = h.classList.contains("selected");
    document.querySelectorAll("tr").forEach(row => {
        row.classList.remove("selected");
        row.style.background = "rgb(255, 246, 228)";
        row.onmouseover = function() {
            this.style.background = "rgb(255, 240, 210)";
        };
        row.onmouseout = function() {
            this.style.background = "rgb(255, 246, 228)";
        };
    });
	if (!isSelected) {
        h.classList.add("selected");
        h.style.background = "rgb(255, 230, 200)";
        h.onmouseover = null;
        h.onmouseout = null;
    }
};
    var experience;
    var selectedJob = document.getElementById("job").options[document.getElementById("job").selectedIndex];
    if (selectedJob) {
        experience = selectedJob.getAttribute("data-exp");
    }
    tasks.push({
        jobId: f,
        motivation: i,
        experience: experience,
        taskId: currentTaskId,
        row: h,
        isAutoTask: b
    });
    var e = document.createElement("td");
    e.innerText = g;
    e.style.textAlign = "left";
    e.style.paddingLeft = "5px";
    
    var d = document.createElement("td");
    d.innerText = i;
    d.style.paddingLeft = "5px";
    d.style.textAlign = "center";
    d.style.borderLeft = "1px solid black";

    var expCell = document.createElement("td");
    expCell.innerText = experience;
    expCell.style.paddingLeft = "5px";
    expCell.style.textAlign = "center";
    expCell.style.borderLeft = "1px solid black";

    var c = document.createElement("td");
    c.style.paddingLeft = "5px";
    c.style.textAlign = "center";

    var deleteButton = document.createElement("p");
    deleteButton.innerText = "X";
    deleteButton.style.cursor = "pointer";
    deleteButton.style.margin = "0px";
    deleteButton.style.display = "inline";
    deleteButton.style.color = "red";
    deleteButton.style.fontWeight = "bold";
    deleteButton.addEventListener("click", Function("delTask(" + currentTaskId + "); tmReset();"));
    c.appendChild(deleteButton);

    h.appendChild(e);
    h.appendChild(d);
    h.appendChild(expCell);
    h.appendChild(c);
    
    document.getElementById("tasksList").children[0].insertBefore(h, document.getElementById("elementsForAdding"));
}
function updateTaskListOrder() {
    const rows = Array.from(document.querySelectorAll("#tasksList tr[data-task-id]"));
    tasks = rows.map(row => tasks.find(task => task.taskId === parseInt(row.getAttribute("data-task-id"))));
    handleTaskChange();
}
function handleTaskChange() {
    gcCancelAllJobs();
    const firstTask = tasks[0];
    if (firstTask) {
        gcStartJob(firstTask.jobId, firstTask.motivation);
    }
}
function moveUp() {
    const selectedRow = document.querySelector("tr.selected");
    if (selectedRow && selectedRow.previousElementSibling && selectedRow.previousElementSibling.hasAttribute("data-task-id")) {
        selectedRow.parentNode.insertBefore(selectedRow, selectedRow.previousElementSibling);
        updateTaskListOrder();
    }
}
function moveDown() {
    const selectedRow = document.querySelector("tr.selected");
    if (selectedRow && selectedRow.nextElementSibling && selectedRow.nextElementSibling.hasAttribute("data-task-id")) {
        selectedRow.parentNode.insertBefore(selectedRow.nextElementSibling, selectedRow);
        updateTaskListOrder();
    }
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
		var experience;
                if (JobsModel.basetype) {
                    experience = job.basis[JobsModel.basetype].experience;
                } else {
                    experience = job.experience;
                }
                var b = document.createElement("option");
                b.value = job.id;
                b.innerText = job.name + " (Exp: " + experience + ")";
                b.setAttribute("data-exp", job.experience);
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
