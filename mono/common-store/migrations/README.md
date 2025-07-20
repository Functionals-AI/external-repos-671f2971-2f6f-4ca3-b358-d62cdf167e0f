
# Create schema migration files
```
docker run --rm -it --network=host -v "$(pwd)/schema:/db" amacneil/dbmate new create_athena_api_auth_table
```

# Create seed migration files
```
docker run --rm -it --network=host -v "$(pwd)/seeds:/db" amacneil/dbmate new create_athena_api_auth_seed
```