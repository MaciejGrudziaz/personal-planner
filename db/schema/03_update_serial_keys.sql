SELECT setval('tasks_id_seq', (SELECT id FROM tasks ORDER BY id DESC LIMIT 1) + 1);

