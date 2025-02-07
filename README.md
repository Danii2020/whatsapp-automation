```
--Authenticate
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 593881202230.dkr.ecr.us-east-1.amazonaws.com
--Build Image
docker build --platform linux/amd64 -t whatsaap-qik .
docker tag whatsaap-qik:latest 593881202230.dkr.ecr.us-east-1.amazonaws.com/whatsaap-qik:latest
docker push 593881202230.dkr.ecr.us-east-1.amazonaws.com/whatsaap-qik:latest
--Move to .kube folder and run
kubectl delete -f deployment.yml
kubectl apply -f deployment.yml
kubectl get pods
```
