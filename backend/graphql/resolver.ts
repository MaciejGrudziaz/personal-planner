import { DBClient, FetchParams } from '../db-client/client';
import { Task } from '../data-types/task';
import { Config } from '../data-types/config';

export interface Resolver {
    fetchTasks(args: any): Promise<Task[] | null>;
    createTask(args: any): Promise<number | null>;
    updateTask(args: any): Promise<boolean>;
    deleteTask(args: any): Promise<boolean>;
    config(): Promise<Config | null>;
    updateCalendarMonthViewFontSize(args: any): Promise<boolean>;
}

function getResolver(db: DBClient): Resolver {
    return {
        fetchTasks: async (args: any): Promise<Task[] | null> => {
            return await db.fetchTasks({year: args.year, month: args.month, id: args.id});
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
        updateCalendarMonthViewFontSize: async (args: any): Promise<boolean> => {
            return await db.updateConfig("calendarMonthView_fontSize", args.size);
        },
    };
}

export default getResolver;

