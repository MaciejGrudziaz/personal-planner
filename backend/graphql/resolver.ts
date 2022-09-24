import { DBClient, FetchParams } from '../db-client/client';
import { Task } from '../data-types/task';
import { ToDo, ToDoGroup } from '../data-types/todo';
import { Config } from '../data-types/config';

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
    createTodo(args: any): Promise<number | null>;
    modifyTodo(args: any): Promise<boolean>;
    deleteTodo(args: any): Promise<boolean>;
    updateCalendarMonthViewFontSize(args: any): Promise<boolean>;
}

function getResolver(db: DBClient): Resolver {
    return {
        fetchTasks: async (args: any): Promise<Task[] | null> => {
            return await db.fetchTasks(args.year, args.month, args.id);
        },
        createTask: async (args: any): Promise<number | null> => {
            return await db.insertTask({
                id: -1,
                start_time: (args.start_time === undefined) ? null : args.start_time,
                end_time: (args.end_time === undefined) ? null : args.end_time,
                date: args.date,
                basic_info: (args.basic_info === undefined) ? null : args.basic_info,
                description: (args.description === undefined) ? null : args.description,
                category: args.category
            });
        },
        fetchTodos: async (args: any): Promise<ToDo[] | null> => {
            return await db.fetchTodos(args.id, args.priority);
        },
        fetchTodoGroups: async (args: any): Promise<ToDoGroup[] | null> => {
            return await db.fetchTodoGroups(args.id);
        },
        updateTask: async (args: any): Promise<boolean> => {
            return await db.updateTask({
                id: args.id,
                start_time: (args.start_time === undefined) ? null : args.start_time,
                end_time: (args.end_time === undefined) ? null : args.end_time,
                date: args.date,
                basic_info: (args.basic_info === undefined) ? null : args.basic_info,
                description: (args.description === undefined) ? null : args.description,
                category: args.category
            });
        },
        deleteTask: async (args: any): Promise<boolean> => {
            return await db.deleteTask(args.id);
        },
        config: async (): Promise<Config | null> => {
            return await db.fetchConfig();
        },
        createTodoGroup: async (args: any): Promise<number | null> => {
            return await db.insertTodoGroup(args.name, args.ordinal);
        },
        modifyTodoGroup: async (args: any): Promise<boolean> => {
            return await db.updateTodoGroup(args.id, args.name, args.ordinal);
        },
        deleteTodoGroup: async (args: any): Promise<boolean> => {
            return await db.deleteTodoGroups(args.id);
        },
        createTodo: async (args: any): Promise<number | null> => {
            return await db.insertTodo(args.group_id, args.content, args.priority);
        },
        modifyTodo: async (args: any): Promise<boolean> => {
            return await db.updateTodo(args.id, args.content, args.priority, args.group_id, args.done);
        },
        deleteTodo: async (args: any): Promise<boolean> => {
            return await db.deleteTodo(args.id);
        },
        updateCalendarMonthViewFontSize: async (args: any): Promise<boolean> => {
            return await db.updateConfig("calendarMonthView_fontSize", args.size);
        },
    };
}

export default getResolver;

