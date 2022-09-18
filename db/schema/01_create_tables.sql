CREATE TABLE tasks
(
    id serial,
    start_time time,
    end_time time,
    date date not null,
    basic_info varchar(50),
    description varchar(250),
    category int not null,
    PRIMARY KEY(id)
);

CREATE TABLE config
(
    name varchar(50),
    val_s varchar(100),
    val_i integer,
    PRIMARY KEY(name)
);

