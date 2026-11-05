-- Quote the configured database name before creating the independent Prisma shadow database.
\getenv database POSTGRES_DB
SELECT format('CREATE DATABASE %I', :'database' || '_shadow') \gexec
