```
--Authenticate
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 593881202230.dkr.ecr.us-east-1.amazonaws.com
--Build Image
docker build -t whatsaap-qik .
docker tag whatsaap-qik:latest 593881202230.dkr.ecr.us-east-1.amazonaws.com/whatsaap-qik:latest
docker push 593881202230.dkr.ecr.us-east-1.amazonaws.com/whatsaap-qik:latest
--Move to .kube folder and run
kubectl apply -f deployment.yml
```
