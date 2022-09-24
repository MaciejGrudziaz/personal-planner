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

CREATE TABLE todo_groups
(
    id serial,
    name varchar(150),
    ordinal integer,
    PRIMARY KEY(id)
);

CREATE TABLE todo_tasks
(
    id serial,
    group_id integer not null,
    content varchar(150),
    priority integer not null,
    PRIMARY KEY(id),
    FOREIGN KEY(group_id) REFERENCES todo_groups(id) ON DELETE CASCADE
);

CREATE TABLE done_tasks
(
    task_id integer,
    PRIMARY KEY(task_id),
    FOREIGN KEY(task_id) REFERENCES todo_tasks(id) ON DELETE CASCADE
);

