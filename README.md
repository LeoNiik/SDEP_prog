Progetto programmazione web

Prima di buildare i container:

    sudo docker network create --subnet=172.25.0.0/16 app_default

Per buildare i container:
    
    make up

Per stoppare i container:

    make down

Per riavviare i container:

    make restart

Per visualizzare eventuali messaggi di errore:

    make logs
