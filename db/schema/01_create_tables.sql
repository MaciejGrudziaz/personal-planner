CREATE TABLE task_category
(
    id serial,
    name varchar(50) not null unique,
    background_color char(7) not null,
    border_color char(7) not null,
    PRIMARY KEY(id)
);

CREATE TABLE tasks
(
    id serial,
    start_time time,
    end_time time,
    date date not null,
    basic_info varchar(50),
    description varchar(250),
    category integer,
    PRIMARY KEY(id),
    FOREIGN KEY(category) REFERENCES task_category(id) ON DELETE CASCADE
);

-- repetitive_tasks.type:
--   0 - every <n> days
--   1 - every <n> weeks
--   2 - same date every <n> months
--   3 - same date every <n> years
-- repetitive_tasks.count = <n>

CREATE TABLE repetitive_tasks
(
    id integer,
    type integer not null,
    count integer not null,
    end_date date,
    PRIMARY KEY(id),
    FOREIGN KEY(id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE excluded_repetitive_tasks 
(
    id integer,
    date date not null,
    FOREIGN KEY(id) REFERENCES repetitive_tasks(id) ON DELETE CASCADE
);

CREATE TABLE changed_repetitive_tasks
(
    id integer,
    date date not null,
    start_time time,
    end_time time,
    PRIMARY KEY(id, date),
    FOREIGN KEY(id) REFERENCES repetitive_tasks(id) ON DELETE CASCADE
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

