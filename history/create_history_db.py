from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

from server.secrets import POSTGRES_DB
from history.util import get_history_db_connection, HISTORY_DB_SCHEMA


def create_history_db():
    cxn = get_history_db_connection(False)
    cxn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = cxn.cursor()
    cur.execute(f"CREATE DATABASE {POSTGRES_DB}")
    cxn.close()
    cxn = get_history_db_connection()
    cxn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = cxn.cursor()
    cur.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
    cur.execute(HISTORY_DB_SCHEMA)


if __name__ == "__main__":
    create_history_db()
