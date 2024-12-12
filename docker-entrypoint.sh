#!/bin/sh

# Wait for the database to be ready
echo "Waiting for database to be ready..."
npx wait-on tcp:db:5432

# Run database migrations
echo "Running database migrations..."
npx prisma migrate dev --name init
npx prisma migrate deploy
npx prisma db seed

# Execute the main container command
exec "$@"