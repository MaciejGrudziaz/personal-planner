import { DBClient } from "../../../../db-client/client";
import { Task } from "../../../../data-types/task";
import { fetchTasks } from "../../../../graphql/tasks/fetch";
import { QueryConfig } from "pg";

interface QueryResult {
    rows: any[];
}

class MockClient {
    async query(query: QueryConfig<any>): Promise<QueryResult> {
        if(query.name === "select-tasks-by-month") {
            return {
                rows: [{
                    id: 0,
                    category: 0,
                    date: new Date("2022-01-01"),
                    start_time: "12:00",
                    end_time: "14:00",
                    basic_info: "repetitive task",
                    description: "description"
                }]
            };
        }
        if(query.name === "fetch-repetitive-tasks-query") {
            return {
                rows: [{
                    id: 123,
                    type: 0,
                    count: 12,
                    start_date: new Date("2022-01-01"),
                    end_date: null
                }]
            };
        }
        if(query.name === "select-task-by-id") {
            return {
                rows: [{
                    id: 123,
                    category: 0,
                    date: new Date("2022-01-01"),
                    start_time: "12:00",
                    end_time: "14:00",
                    basic_info: "repetitive task",
                    description: "repetitive task description"
                }]
            };
        }
        return { rows: []};
    }

    release() {}
}

function createDBClient(): DBClient {
    return new DBClient({user: "user", password: "pass", database: "db"});
}

jest.mock("../../../../db-client/client");

describe("graphql::repetitive-tasks::fetch::fetchRepetitiveTasks", () => {
    afterAll(() => {
        jest.resetAllMocks();
    });
    it("fetch tasks with repetition", () => {
        const connectFn = jest.fn().mockResolvedValue(new MockClient());
        jest.spyOn(DBClient.prototype, "connect").mockImplementation(connectFn);

        fetchTasks(createDBClient(), 2022, 1).then((tasks: Task[] | null) => {
            expect(tasks).toBeDefined();
            expect(tasks!).toEqual([
                {
                  id: 0,
                  start_time: { hour: 12, minute: 0 },
                  end_time: { hour: 14, minute: 0 },
                  date: { year: 2022, month: 1, day: 1 },
                  basic_info: 'repetitive task',
                  description: 'description',
                  category: 'simple',
                  repetition: null
                },
                {
                  id: 123,
                  start_time: { hour: 12, minute: 0 },
                  end_time: { hour: 14, minute: 0 },
                  date: { year: 2022, month: 1, day: 1 },
                  basic_info: 'repetitive task',
                  description: 'repetitive task description',
                  category: 'simple',
                  repetition: { type: 'daily', count: 12, end_date: null }
                },
                {
                  id: 123,
                  start_time: { hour: 12, minute: 0 },
                  end_time: { hour: 14, minute: 0 },
                  date: { year: 2022, month: 1, day: 13 },
                  basic_info: 'repetitive task',
                  description: 'repetitive task description',
                  category: 'simple',
                  repetition: { type: 'daily', count: 12, end_date: null }
                },
                {
                  id: 123,
                  start_time: { hour: 12, minute: 0 },
                  end_time: { hour: 14, minute: 0 },
                  date: { year: 2022, month: 1, day: 25 },
                  basic_info: 'repetitive task',
                  description: 'repetitive task description',
                  category: 'simple',
                  repetition: { type: 'daily', count: 12, end_date: null }
                }
            ]);
        });
    });
});

