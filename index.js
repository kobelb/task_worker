require('dotenv').config();

const bodyParser = require('body-parser')
const express = require('express');
const fetch = require('node-fetch');
const random = require('d3-random')
const uuid = require('uuid');

const app = express();

const workerId = uuid.v4();

const runningTasks = new Set();

const PORT = parseInt(process.env.PORT, 10);
if (isNaN(PORT)) {
    console.error(`PORT environment variable should be set to an integer`);
    return; 
}

const { TASK_MANAGER_URL } = process.env;
if (TASK_MANAGER_URL == null) {
    console.error(`TASK_MANAGER_URL environment variable should be set`);
    return;
}

const { TENANT } = process.env;
if (TENANT == null) {
    console.error(`TENANT environment variable should be set`);
    return;
}

const TOTAL_CAPACITY = parseInt(process.env.TOTAL_CAPACITY, 10);
if (isNaN(TOTAL_CAPACITY)) {
    console.error(`TOTAL_CAPACITY environment variable should be set to an integer`);
    return;
}

const RUN_DURATION_MINIMUM_MS = parseFloat(process.env.RUN_DURATION_MINIMUM_MS);
if (isNaN(RUN_DURATION_MINIMUM_MS)) {
    console.error(`RUN_DURATION_MINIMUM_MS environment variable should be set to a float`);
    return;
}

const RUN_FAILURE_RATE = parseFloat(process.env.RUN_FAILURE_RATE);
if (isNaN(RUN_FAILURE_RATE)) {
    console.error(`RUN_FAILURE_RATE environment variable should be set to a float`);
    return;
}

function startHeartbeat() {
    async function heartbeat () {
        const body = JSON.stringify({
            id: workerId,
            tenant_id: TENANT,
            url: `http://localhost:${PORT}/run_task`,
            total_capacity: TOTAL_CAPACITY,
            running_tasks: Array.from(runningTasks),
        });
        try {
            const response = await fetch(`${TASK_MANAGER_URL}/worker_heartbeat`, { method: 'POST', body, headers: { 'Content-Type': 'application/json'} });
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
        tenant_id: TENANT,
        worker_id: workerId,
    });
    try {
        const response = await fetch(`${TASK_MANAGER_URL}/task/_done`, { method: 'POST', body, headers: { 'Content-Type': 'application/json'} });
        if (response.status != 200) {
            console.error(`Expected 200 status code, received ${response.status}: ${JSON.stringify(await response.json())}`)
        }
        runningTasks.delete(taskId)
    } catch (err) {
        console.error(err);
    }
}

async function taskFailure(taskId) {
    const body = JSON.stringify({
        id: taskId,
        tenant_id: TENANT,
        worker_id: workerId,
        schedule_at: new Date(new Date().getTime() + 5000).toISOString()
    });
    try {
        const response = await fetch(`${TASK_MANAGER_URL}/task/_failure`, { method: 'POST', body, headers: { 'Content-Type': 'application/json'} });
        if (response.status != 200) {
            console.error(`Expected 200 status code, received ${response.status}: ${JSON.stringify(await response.json())}`)
        }
        runningTasks.delete(taskId)
    } catch (err) {
        console.error(err);
    }
}

runTaskRandomized = random.randomPareto(2);
function runTask(body) {
    const { task_id: taskId, params } = body;
    console.log(new Date(), 'running task', { taskId, params });
    runningTasks.add(taskId);
    setTimeout(() => {
        if (Math.random() <= RUN_FAILURE_RATE) {
            console.log(new Date(), 'failing task', { taskId });
            taskFailure(taskId);
        } else {
            taskDone(taskId);
        }
    }, runTaskRandomized() * RUN_DURATION_MINIMUM_MS);
}

app.use(bodyParser.json());

app.post('/run_task', (req, res) => {
    runTask(req.body);
    res.send();
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`)
});

startHeartbeat();