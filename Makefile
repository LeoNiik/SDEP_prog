

up:
	sudo docker compose up -d --build

down:
	sudo docker compose down
restart:
	sudo docker compose down
	sudo docker compose up -d --build

logs:
	sudo docker logs sdep_prog-app-1

execsrv:
	sudo docker exec -it sdep_prog-app-1 bash

execdb:
	sudo docker exec -it sdep_prog-app-db-1 bash
clean:
	make down
	sudo rm -r upload/
	sudo docker volume rm db-default-sdep
dblog:
	sudo docker logs sdep_prog-app-db-1
