const express = require('express');
const fetch = require('node-fetch');
const uuid = require('uuid');

const app = express();
const port = 3000;

const totalCapacity = 10;
const runningTasksCount = 0;
const workerId = uuid.v4();

function startHeartbeat() {
    async function heartbeat () {
        const body = {
            id: workerId,
            tenant_id: "foo",
            url: 'http://localhost:3000/run_task',
            total_capacity: totalCapacity,
            available_capacity: totalCapacity - runningTasksCount
        };
        try {
            await fetch(`http://localhost:1323/worker_heartbeat`, { method: 'POST', body });
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
  
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})

startHeartbeat();