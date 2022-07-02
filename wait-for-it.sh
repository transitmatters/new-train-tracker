#!/bin/sh
until ping -c 1 postgres >/dev/null 2>&1; do echo "not up"; done

if [ "$NEW_BUILD" = true ]; then
    npm run create-history-db 
else
    echo "old build"
fi 

/root/.local/bin/poetry run gunicorn -b localhost:5001 -w 1 server.application:application
