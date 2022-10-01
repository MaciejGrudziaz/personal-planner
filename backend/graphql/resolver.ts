import { DBClient, FetchParams } from '../db-client/client';
import { Task } from '../data-types/task';
import { fetchTasks } from './tasks/fetch';
import { Config } from '../data-types/config';
import { ToDo } from './todo/types';
import { createTodo } from './todo/create';
import { deleteTodos } from './todo/delete';
import { fetchTodos } from './todo/fetch';
import { modifyTodo } from './todo/modify';
import { moveTodo, TodoPriority } from './todo/move';
import { ToDoGroup } from './todo-group/types';
import { createTodoGroup } from './todo-group/create';
import { deleteTodoGroups } from './todo-group/delete';
import { fetchTodoGroups } from './todo-group/fetch';
import { modifyTodoGroup } from './todo-group/modify';
import { moveTodoGroup, TodoGroupOrdinal } from './todo-group/move';

export interface Resolver {
    fetchTasks(args: any): Promise<Task[] | null>;
    fetchTodos(args: any): Promise<ToDo[] | null>;
    fetchTodoGroups(args: any): Promise<ToDoGroup[] | null>;
    createTask(args: any): Promise<number | null>;
    updateTask(args: any): Promise<boolean>;
    deleteTask(args: any): Promise<boolean>;
    config(): Promise<Config | null>;
    createTodoGroup(args: any): Promise<number | null>;
    modifyTodoGroup(args: any): Promise<boolean>;
    deleteTodoGroup(args: any): Promise<boolean>;
    moveTodoGroup(args: any): Promise<TodoGroupOrdinal[] | null>;
    createTodo(args: any): Promise<number | null>;
    modifyTodo(args: any): Promise<boolean>;
    deleteTodo(args: any): Promise<boolean>;
    moveTodo(args: any): Promise<TodoPriority[] | null>;
    updateCalendarMonthViewFontSize(args: any): Promise<boolean>;
}

function getResolver(db: DBClient): Resolver {
    return {
        fetchTasks: async (args: any): Promise<Task[] | null> => {
            return await fetchTasks(db, args.year, args.month, args.id);
        },
        createTask: async (args: any): Promise<number | null> => {
            return await db.insertTask({
                id: -1,
                start_time: (args.start_time === undefined) ? null : args.start_time,
                end_time: (args.end_time === undefined) ? null : args.end_time,
                date: args.date,
                basic_info: (args.basic_info === undefined) ? null : args.basic_info,
                description: (args.description === undefined) ? null : args.description,
                category: args.category,
                repetition: args.repetition
            });
        },
        fetchTodos: async (args: any): Promise<ToDo[] | null> => {
            return await fetchTodos(db, args.id);
        },
        fetchTodoGroups: async (args: any): Promise<ToDoGroup[] | null> => {
            return await fetchTodoGroups(db, args.id);
        },
        updateTask: async (args: any): Promise<boolean> => {
            return await db.updateTask({
                id: args.id,
                start_time: (args.start_time === undefined) ? null : args.start_time,
                end_time: (args.end_time === undefined) ? null : args.end_time,
                date: args.date,
                basic_info: (args.basic_info === undefined) ? null : args.basic_info,
                description: (args.description === undefined) ? null : args.description,
                category: args.category,
                repetition: args.repetition
            });
        },
        deleteTask: async (args: any): Promise<boolean> => {
            return await db.deleteTask(args.id);
        },
        config: async (): Promise<Config | null> => {
            return await db.fetchConfig();
        },
        createTodoGroup: async (args: any): Promise<number | null> => {
            return await createTodoGroup(db, args.name, args.ordinal);
        },
        modifyTodoGroup: async (args: any): Promise<boolean> => {
            return await modifyTodoGroup(db, args.id, args.name, args.ordinal);
        },
        deleteTodoGroup: async (args: any): Promise<boolean> => {
            return await deleteTodoGroups(db, args.id);
        },
        moveTodoGroup: async (args: any): Promise<TodoGroupOrdinal[] | null> => {
            return await moveTodoGroup(db, args.id, args.up, args.down);
        },
        createTodo: async (args: any): Promise<number | null> => {
            return await createTodo(db, args.group_id, args.content, args.priority);
        },
        modifyTodo: async (args: any): Promise<boolean> => {
            return await modifyTodo(db, args.id, args.content, args.priority, args.group_id, args.done);
        },
        deleteTodo: async (args: any): Promise<boolean> => {
            return await deleteTodos(db, args.id);
        },
        moveTodo: async (args: any): Promise<TodoPriority[] | null> => {
            return await moveTodo(db, args.id, args.target_id);
        },
        updateCalendarMonthViewFontSize: async (args: any): Promise<boolean> => {
            return await db.updateConfig("calendarMonthView_fontSize", args.size);
        },
    };
}

export default getResolver;

