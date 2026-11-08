---
title: Обновление PostgreSQL 17 до 18
description: Перенос данных в новый том PostgreSQL 18 с проверкой восстановления.
---

Стек Compose использует `postgres:18-alpine` и монтирует именованный том в `/var/lib/postgresql`. PostgreSQL 18 хранит
кластер в подкаталоге своей версии. Файлы PostgreSQL 17 нельзя использовать напрямую. См.
[официальную документацию образа](https://hub.docker.com/_/postgres).

Процедура создаёт дамп базы приложения и восстанавливает его в **отдельный новый том**. Требуется окно обслуживания. Не
совмещайте её с [переименованием продукта](/docs/next/branding-upgrade): сначала завершите переименование на предыдущем
выпуске с PostgreSQL 17. Обновление исходников не запускает производственную миграцию автоматически.

<a id="before-maintenance"></a>

## До обслуживания

- Сохраните полную конфигурацию предыдущего выпуска, его `.env` и точное имя тома PostgreSQL 17. Оставьте Compose-файл в
  старом каталоге для правильного разрешения относительных путей монтирования и файлов окружения.
- Не меняйте `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `TOKEN_ENCRYPTION_KEY` и `AUTH_JWT_SECRET`. Ключ
  необходим для расшифровки существующих учётных данных провайдеров и уведомлений.
- Зарезервируйте место для дампа и двух томов. Защищайте резервные копии и `.env` как секреты.
- Предполагается единственная роль базы Repovio. Отдельно учтите пользовательские роли, права, расширения и
  дополнительные базы; дамп приложения не гарантирует их сохранение.
- Отрепетируйте восстановление и проверку на одноразовой копии. `pnpm test:postgres-upgrade` использует реальные
  миграции и только синтетические данные; он не проверяет резервную копию конкретной установки.

<a id="stop-writers-and-back-up-postgresql-17"></a>

## Остановка записи и резервное копирование PostgreSQL 17

Выполните команды из **каталога предыдущего выпуска** с его конфигурацией Compose PostgreSQL 17. Остановите также
внешние процессы записи. Не запускайте новое приложение до завершения восстановления и проверки.

```sh
umask 077
docker compose stop web api migrate
backup="$PWD/repovio-postgresql17-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker compose exec -T postgres sh -ec \
  'pg_dump --format=custom --no-owner --no-privileges --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"' > "$backup"
docker compose exec -T postgres sh -ec \
  'psql -X --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "SELECT count(*) FROM users; SELECT count(*) FROM repositories; SELECT count(*) FROM notification_channels; SELECT count(*) FROM _prisma_migrations;"'
docker compose stop postgres
```

Конфиденциально запишите исходные количества строк. Проверьте дамп восстановлением, а не только его размером. Сохраните
старый том и конфигурацию. Никогда не выполняйте `docker compose down --volumes` и не удаляйте ни один том данных.

<a id="restore-into-postgresql-18"></a>

## Восстановление в PostgreSQL 18

В **каталоге нового выпуска** сохраните те же учётные данные и ключ. Укажите в `backup` абсолютный путь к копии.
Выберите уникальное новое имя тома и сохраните его в `REPOVIO_POSTGRES_VOLUME` нового `.env`; оно должно отличаться от
тома PostgreSQL 17. Используйте переопределение внешнего тома, чтобы отклонять отсутствующие имена и опечатки.

```sh
export REPOVIO_POSTGRES_VOLUME=repovio-postgresql18-upgrade
docker volume create "$REPOVIO_POSTGRES_VOLUME"
docker compose -f compose.yml -f compose.upgrade.yml up --detach --wait postgres
docker compose -f compose.yml -f compose.upgrade.yml exec -T postgres sh -ec \
  'pg_restore --exit-on-error --no-owner --no-privileges --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"' < "$backup"
docker compose -f compose.yml -f compose.upgrade.yml exec -T postgres sh -ec \
  'psql -X --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "SHOW server_version; SHOW data_directory; SELECT count(*) FROM users; SELECT count(*) FROM repositories; SELECT count(*) FROM notification_channels; SELECT count(*) FROM _prisma_migrations;"'
docker compose -f compose.yml -f compose.upgrade.yml run --rm migrate
docker compose -f compose.yml -f compose.upgrade.yml up --detach --wait api web
```

Используйте действительно новый пустой том; если имя занято, выберите другое. Точка входа отклоняет старые структуры
данных, включая том PostgreSQL 17, ошибочно смонтированный в новом корне; преобразование не выполняется. При ошибке
сохраните дамп и старый том, выясните причину и повторите с другим новым пустым томом. Не восстанавливайте многократно
поверх частично восстановленной базы.

Сравните исходные количества и характерные связи. Проверьте вход, права, уведомления и расшифровку сохранённым ключом.
Конфиденциально проверьте состояние API и журналы. Перезапустите PostgreSQL 18 и подтвердите сохранность данных до
окончания обслуживания. Проверенный каталог по умолчанию — `/var/lib/postgresql/18/docker`.

<a id="recovery"></a>

## Возврат к предыдущей версии

До новых записей можно остановить новый стек и запустить полный предыдущий выпуск с исходным томом PostgreSQL 17 и
конфигурацией. Не допускайте одновременной записи обоих стеков. Сохраните новый том для диагностики; PostgreSQL 17
никогда не должен открывать файлы PostgreSQL 18.

После новых записей старый том устаревает; возврат потеряет эти изменения. Сначала спланируйте согласование данных или
отдельно проверенное восстановление. Восстановление дампа PostgreSQL 18 в 17 не гарантирует откат версии. Сохраняйте оба
тома и копии до явного закрытия окна восстановления оператором.

<a id="disposable-verification"></a>

## Проверка на одноразовых ресурсах

```sh
docker build -f apps/api/Dockerfile -t repovio-api:local .
pnpm test:postgres-upgrade
```

Тест создаёт контейнеры, сеть и тома с уникальными именами; применяет реальные миграции Prisma на обеих версиях;
проверяет чистую инициализацию и теневую базу; отклоняет неверно смонтированный старый том; восстанавливает дамп;
сравнивает все публичные таблицы; расшифровывает синтетические данные доступа, проверяет сохранность после перезапуска и
неизменность старых данных. Очистка удаляет только созданные тестом ресурсы. Существующие контейнеры, тома, базы и
учётные данные не используются. Задайте `REPOVIO_TEST_API_IMAGE` для другого локально собранного образа приложения.
