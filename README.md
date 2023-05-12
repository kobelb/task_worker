## To Do
[ ] Healthcheck
[ ] Task Run HTTP API
[ ] Task Completion
[ ] Schedule large number of recurring tasks on startup
[ ] Load tests
[ ] Task done retries

## Build and push Docker image

```
docker build -t task_worker .
docker tag task_worker kobelb/task_worker
docker push kobelb/task_worker
```