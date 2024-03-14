// Modify the addTask function to accept the danger parameter
function addTask(jobName, jobId, motivation, danger, isAutoTask) {
    currentTaskId++;
    var taskRow = document.createElement("tr");
    tasks.push({ jobId: jobId, motivation: motivation, danger: danger, taskId: currentTaskId, row: taskRow, isAutoTask: isAutoTask });

    // Other code remains the same...
}

// Modify the addTaskButton function to include danger parameter
function addTaskButton() {
    var jobName = document.getElementById("job").selectedOptions[0].text;
    var jobId = document.getElementById("job").value;
    var motivation = parseInt(document.getElementById("motivation").value);
    var danger = parseInt(document.getElementById("danger").value); // New
    if (isNaN(danger) || danger < 0 || danger > 100) { // New
        danger = 0; // Default danger level
    } // New
    if (isNaN(motivation) || motivation < -1 || motivation > 100) {
        motivation = 50; // Default motivation
    }
    addTask(jobName, jobId, motivation, danger, false); // Updated
}

// Modify the tmStartWork function to consider danger level
function tmStartWork() {
    if (timerChekingEmploy === undefined) {
        timerChekingEmploy = setInterval(function() {
            console.log("check");
            if (gameWin.TaskQueue.queue.length < 1) {
                if (currentTask) {
                    if (gameWin.Character.energy >= 2 && currentTask.danger <= 25) { // Updated
                        gameWin.Ajax.remoteCallMode('work', 'index', {}, function(json) {
                            gameWin.JobsModel.initJobs(json.jobs);
                            if (gameWin.JobsModel.getById(currentTask.jobId).jobmotivation * 100 > currentTask.motivation || currentTask.motivation == -1) {
                                console.log("старт " + gameWin.JobsModel.getById(currentTask.jobId).name + " " + new Date().getHours() + ":" + new Date().getMinutes());
                                gcStartJob(currentTask.jobId, tmGetWorkTime());
                            } else {
                                delTask(currentTask.taskId);
                                tmReset();
                            }
                        }, null);
                    } else {
                        var town = document.getElementById("town").value;
                        if (town != "") {
                            console.log("іду спать в " + town + ". " + new Date().getHours() + ":" + new Date().getMinutes());
                            gcGoSleep(town, document.getElementById("room").value);
                        }
                    }
                } else {
                    if (tasks.length > 0) {
                        currentTask = tasks[0];
                    } else {
                        if (document.getElementById("autoTask").checked) {
                            addAutoTasks(document.getElementById("direct").value);
                        } else {
                            clearInterval(timerChekingEmploy);
                            timerChekingEmploy = undefined;
                        }
                    }
                }
            } else {
                if (gameWin.TaskQueue.queue[0].type == "sleep") {
                    if (gameWin.Character.money > 1 && gameWin.TaskQueue.queue[0].data.x == gameWin.Character.position.x && gameWin.TaskQueue.queue[0].data.y == gameWin.Character.position.y) {
                        console.log("кладу гроші в банк. " + new Date().getHours() + ":" + new Date().getMinutes());
                        gcPutMoneyToBank();
                    }

                    if (gameWin.Character.energy == gameWin.Character.maxEnergy) {
                        gcCancelAllJobs();
                    }
                }

            }
        }, 3000);
    }
}
