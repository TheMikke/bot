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
	console.log("Random clicked");
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
			return
		}
		var d = g.job_groups[gameWin.JobList.getJobById(b).groupid];
		var c = d[0][0];
		var j = d[0][1];
		var e = gameWin.Map.calcWayTime(gameWin.Character.getPosition(), {
			x: c,
			y: j
		});
		for (var f = 0; f < d.length; f++) {
			if (gameWin.Map.calcWayTime(gameWin.Character.getPosition(), {
					x: d[f][0],
					y: d[f][1]
				}) < e) {
				c = d[f][0];
				j = d[f][1];
				e = gameWin.Map.calcWayTime(gameWin.Character.getPosition(), {
					x: c,
					y: j
				})
			}
		}
		var h = new gameWin.Array();
		h.push(new gameWin.TaskJob(b, c, j, a));
		gameWin.TaskQueue.add(h)
	}, null)
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

function gcGoSleep(b, a) {
        if (b == "") {
            return
        }
        gameWin.Ajax.get("map", "get_minimap", {}, function(c) {
            if (c.error) {
                console.error("трохи упав gcGoSleep: " + c.msg);
                return
            }
            for (var d in c.towns) {
                if (c.towns[d].name == b) {
                    gameWin.HotelWindow.townid = d;
                    gameWin.HotelWindow.start(a);
                    break
                }
            }
        }, null)
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
								console.log("Started job " + gameWin.JobsModel.getById(currentTask.jobId).name + " " + new Date().getHours() + ":" + new Date().getMinutes());
								gcStartJob(currentTask.jobId, tmGetWorkTime())
							} else {
								delTask(currentTask.taskId);
								tmReset()
							}
						}, null)
					} else {
                            			var a = document.getElementById("town").value;
                           			if (a != ""){
                                		console.log("Consumed energy " + a + ". " + new Date().getHours() + ":" + new Date().getMinutes());
                                		gcGoSleep(a, document.getElementById("room").value)
                            				}
                       				}
				} else {
					if (tasks.length > 0) {
						currentTask = tasks[0]
					} else {
						if (document.getElementById("autoTask").checked) {
							addAutoTasks(document.getElementById("direct").value)
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

function addAutoTasks(a) {
	gameWin.Ajax.remoteCallMode("work", "index", {}, function(c) {
		gameWin.JobsModel.initJobs(c.jobs);
		gameWin.JobsModel.sortJobs(a, null, "desc");
		tasks = [];
		for (var b = 0; b < gameWin.JobsModel.Jobs.length; b++) {
			var job = gameWin.JobsModel.Jobs[b];
			var myCondition = (job.jobpoints / job.workpoints) > 1.3;
			if (job.jobObj.level && myCondition) {
				var d = 50;
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
