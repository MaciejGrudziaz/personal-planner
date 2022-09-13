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

