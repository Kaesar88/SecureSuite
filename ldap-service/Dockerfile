FROM python:3.11-slim

WORKDIR /app

RUN pip install flask ldap3 --no-cache-dir

COPY ldap-service.py .

EXPOSE 5050

CMD ["python", "ldap-service.py"]
