const bodyParser = require('body-parser')
const express = require('express');
const fetch = require('node-fetch');
const uuid = require('uuid');

const app = express();
const port = 3000;

const tenantId = "foo";
const workerId = uuid.v4();

const totalCapacity = 10;

const runningTasks = new Set();

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function startHeartbeat() {
    async function heartbeat () {
        const body = JSON.stringify({
            id: workerId,
            tenant_id: tenantId,
            url: 'http://localhost:3000/run_task',
            total_capacity: totalCapacity,
            running_tasks: Array.from(runningTasks),
        });
        try {
            const response = await fetch(`http://localhost:1323/worker_heartbeat`, { method: 'POST', body, headers: { 'Content-Type': 'application/json'} });
            if (response.status != 200) {
                console.error(`Expected 200 status code, received ${response.status}: ${JSON.stringify(await response.json())}`)
            }
        } catch (err) {
            console.error(err);
        }
    }

    setInterval(() => {
        heartbeat()
    }, 10000);
    heartbeat();
}

async function taskDone(taskId) {
    const body = JSON.stringify({
        id: taskId,
        tenant_id: tenantId,
        worker_id: workerId,
    });
    try {
        const response = await fetch(`http://localhost:1323/task/_done`, { method: 'POST', body, headers: { 'Content-Type': 'application/json'} });
        if (response.status != 200) {
            console.error(`Expected 200 status code, received ${response.status}: ${JSON.stringify(await response.json())}`)
        }
        runningTasks.delete(taskId)
    } catch (err) {
        console.error(err);
    }
}

function runTask(body) {
    const { task_id: taskId, params } = body;
    console.log('running task', { taskId });
    runningTasks.add(taskId);
    setTimeout(() => {
        taskDone(taskId);
    }, 60000);
}

app.use(bodyParser.json());

app.post('/run_task', (req, res) => {
    runTask(req.body);
    res.send();
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
});

startHeartbeat();