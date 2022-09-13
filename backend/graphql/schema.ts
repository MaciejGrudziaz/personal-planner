import { graphqlHTTP, Options } from "express-graphql";
import { buildSchema } from "graphql";

type Middleware = (request: Request, response: Response) => Promise<void>;

const schema = buildSchema(`
    type Task {
        id: Int
        # start_time: String
        # end_time: String
        # date: String
        # basic_info: String
        # description: String
        # category: String
    }
    type Query {
        fetchTasks(month: Int, year: Int): Task
        # task(id: Int): Task
    }
    type Mutation {
        # createTask(start_time: String, end_time: String, date: String, basic_info: String, description: String, category: String): Int
        # updateTask(start_time: String, end_time: String, date: String, basic_info: String, description: String, category: String): Boolean
        deleteTask(id: Int): Boolean
    }
`)

const root = {
    tasksForMonth: (args: any) => {
        const year = args.year as number;
        const month = args.month as number;
        let result = 0;
        if(year !== undefined && year !== null) {
            result += year;
        }
        if(month !== undefined && month !== null) {
            result += month;
        }
        return { id: result };
    },
    deleteTask: (id: number) => 1,
};

export function getGraphQLSchema(): Options {
    return {
        schema: schema,
        rootValue: root,
        graphiql: true,
    };
}

