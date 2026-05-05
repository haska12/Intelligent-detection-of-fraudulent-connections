FROM apache/hive:4.1.0

# Download PostgreSQL JDBC driver into Hive's lib directory
USER root
RUN curl -L https://jdbc.postgresql.org/download/postgresql-42.7.3.jar \
    -o /opt/hive/lib/postgresql-42.7.3.jar

USER hive


