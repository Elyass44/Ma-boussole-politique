start:
	docker compose up -d

stop:
	docker compose down

restart:
	docker compose restart

build:
	docker compose up --build -d

logs:
	docker compose logs -f

bash:
	docker compose exec web sh

install:
	docker compose exec web npm install

.PHONY: start stop restart build logs bash install
