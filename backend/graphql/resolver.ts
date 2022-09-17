import { DBClient, Task, FetchParams, taskDateToString, taskTimeToString } from '../db-client/client';

export interface Resolver {
    fetchTasks(args: any): Promise<Task[] | null>;
    createTask(args: any): Promise<number | null>;
    updateTask(args: any): Promise<boolean>;
    deleteTask(args: any): Promise<boolean>;
}

function getResolver(db: DBClient): Resolver {
    return {
        fetchTasks: async (args: any): Promise<Task[] | null> => {
            const tasks = await db.fetchTasks({year: args.year, month: args.month, id: args.id});
            if(tasks === undefined) {
                return null;
            }
            return tasks;
        },
        createTask: async (args: any): Promise<number | null> => {
            const id = await db.insertTask({
                id: -1,
                start_time: (args.start_time === undefined) ? null : args.start_time,
                end_time: (args.end_time === undefined) ? null : args.end_time,
                date: args.date,
                basic_info: (args.basic_info) ? null : args.basic_info,
                description: (args.description) ? null : args.description,
                category: args.category
            });
            if(id === undefined) {
                return null;
            }
            return id;
        },
        updateTask: async (args: any): Promise<boolean> => {
            return await db.updateTask({
                id: args.id,
                start_time: (args.start_time === undefined) ? null : args.start_time,
                end_time: (args.end_time === undefined) ? null : args.end_time,
                date: args.date,
                basic_info: (args.basic_info) ? null : args.basic_info,
                description: (args.description) ? null : args.description,
                category: args.category
            });
        },
        deleteTask: async (args: any): Promise<boolean> => {
            return await db.deleteTask(args.id);
        },
    };
}

export default getResolver;

