FROM postgres:alpine
COPY schema/*.sql /docker-entrypoint-initdb.d/
RUN chmod a+r /docker-entrypoint-initdb.d/*
EXPOSE 5432