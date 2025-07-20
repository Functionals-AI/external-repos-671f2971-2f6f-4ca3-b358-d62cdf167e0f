# OpsStore Stack

## Tasks

### OpsStore-task

**IMPORTANT NOTE**: Scripts can be found in [../../../ops/bin](ops/bin) to run migrations which start the ECS task given the **domaon**. For exmaple:

```
./ops/bin/run-migrations-prd.sh telenutrition
```

Utilizes [dbmate](https://github.com/amacneil/dbmate) in order to run migrations on the **foodsmart** DB. Migrations are found in the ```./common-store/migrations``` folder. Migrations are segregated by **domain**: ```./common-store/migrations/<domain>```. In order to run migrations for a particular domain, override the container COMMAND, with the following options:

  * --migrations-table <schena / table of dbmate's migrations table>: Each domain has its own migrations table, in a **dbmate** schema. For example, for the **telenutrition** domain it is: dbmate.telenutrition_migrations.
  * --migrations-dir, -d <path to migrations directory>: Note, the Dockerfile copies all source dirs under /app. So, to run migrations in **common-store/migrations/foodcards/schema**, add **--migrations-dir /app/common-store/foodcards/schema**. This is a global **dbmate** option.
  * up | down: The command to run.

For example:

  * telenutrition migrations:

```
	["--migrations-table","dbmate.telenutrition_migrations","--migrations-dir","/app/common-store/migrations/telenutrition/schema","up"]
```
  * foodcards migrations:

```
[ "--migrations-dir", "/app/common-store/migrations/foodcards/schema", "up"]
```
Note, the ECS console encloses the arguments in the **[ ]** construct, and quotes the elements. So, in the ECS console simply provide an unquoted list of arguments, ie:
```
--migrations-dir,/app/common-store/migrations/foodcards/schema,up
```
.

## References

  * [dbmate](https://github.com/amacneil/dbmate)