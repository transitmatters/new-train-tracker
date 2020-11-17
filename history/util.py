import psycopg2

import server.secrets as secrets

HISTORY_TABLE_NAME = "newtrains_history"

HISTORY_DB_SCHEMA = """
CREATE TABLE IF NOT EXISTS newtrains_history (
    id UUID DEFAULT uuid_generate_v4(),
    is_new BOOLEAN NOT NULL,
    line VARCHAR(255) NOT NULL,
    car VARCHAR(5) NOT NULL,
    seen_start TIMESTAMP WITH TIME ZONE NOT NULL,
    seen_end TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id)
);
""".strip()


def get_history_db_connection(with_db_name=True):
    dbname = secrets.POSTGRES_DB if with_db_name else None
    return psycopg2.connect(user=secrets.POSTGRES_USER, dbname=dbname)
