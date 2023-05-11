const express = require('express');
const fetch = require('node-fetch');
const uuid = require('uuid');

const app = express();
const port = 3000;

const totalCapacity = 10;
var runningTasksCount = 0;
const workerId = uuid.v4();

function startHeartbeat() {
    async function heartbeat () {
        const body = JSON.stringify({
            id: workerId,
            tenant_id: "foo",
            url: 'http://localhost:3000/run_task',
            total_capacity: totalCapacity,
            available_capacity: totalCapacity - runningTasksCount
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
    }, 30000);
    heartbeat();
} 

app.post('/run_task', (req, res) => {
    runningTasksCount += 1;
    console.log('running task')
    res.send();
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})

startHeartbeat();