import { DBClient } from "../../../../db-client/client";
import { RepetitiveTask } from "../../../../graphql/repetitive-tasks/types";
import { fetchRepetitiveTasks, calcRepetitiveTasksDatesForDateRange, TaskRepetitonSummary } from "../../../../graphql/repetitive-tasks/fetch";
import { QueryConfig, PoolClient } from "pg";

interface QueryRow {
    id: number;
    type?: number;
    count?: number;
    start_date?: Date;
    end_date?: Date | null;
    date?: Date;
}

interface QueryResult {
    rows: QueryRow[];
}

class MockClient {
    async query(query: QueryConfig<any>): Promise<QueryResult> {
        if(query.name === "fetch-repetitive-tasks-query") {
            return {
                rows: [{
                    id: 123,
                    type: 0,
                    count: 4,
                    start_date: new Date("2022-01-01"),
                    end_date: null
                }]
            };
        }
        if(query.name === "fetch-excluded-repetitive-tasks-query") {
            return {
                rows: [
                    {id: 123, date: new Date("2021-12-01")},
                    {id: 123, date: new Date("2022-01-05")},
                    {id: 123, date: new Date("2022-01-25")},
                    {id: 456, date: new Date("2022-01-09")},
                ]
            };
        }
        return {
            rows: []
        };
    }

    release() {}
}

jest.mock("../../../../db-client/client");

describe("graphql::repetitive-tasks::fetch::fetchRepetitiveTasks", () => {
    afterAll(() => {
        jest.resetAllMocks();
    });
    it("simple fetch test", () => {
        const connectFn = jest.fn().mockResolvedValue(new MockClient());
        jest.spyOn(DBClient.prototype, "connect").mockImplementation(connectFn);

        fetchRepetitiveTasks(new DBClient({user: "user", password: "pass", database: "db"}), new Date("2022-01-01"), new Date("2022-02-01")).then((tasks: TaskRepetitonSummary[] | null) => {
            expect(tasks).toEqual([
               {
                 id: 123,
                 date: new Date("2022-01-01"),
                 type: 'daily',
                 count: 4
               },
               {
                 id: 123,
                 date: new Date("2022-01-09"),
                 type: 'daily',
                 count: 4
               },
               {
                 id: 123,
                 date: new Date("2022-01-13"),
                 type: 'daily',
                 count: 4
               },
               {
                 id: 123,
                 date: new Date("2022-01-17"),
                 type: 'daily',
                 count: 4
               },
               {
                 id: 123,
                 date: new Date("2022-01-21"),
                 type: 'daily',
                 count: 4
               },
               {
                 id: 123,
                 date: new Date("2022-01-29"),
                 type: 'daily',
                 count: 4
               }
            ]);
        });
    });
});

test("graphql::repetitive-tasks::fetch::excludedTasks", () => {
});

test("graphql::repetitive-tasks::fetch::calcRepetitiveTasksDatesForDateRange-daily", () => {
    const startDate = new Date("2022-01-01");
    const endDate = new Date("2022-02-01");
    const repetitiveTasks = [
        {id: 0, type: "daily", count: 7, start_date: new Date("2021-01-01"), end_date: null},
        {id: 1, type: "daily", count: 10, start_date: new Date("2020-08-23"), end_date: new Date("2022-08-12")},
        {id: 2, type: "daily", count: 8, start_date: new Date("2022-01-12"), end_date: null}
    ] as RepetitiveTask[];
    const tasks = calcRepetitiveTasksDatesForDateRange(startDate, endDate, repetitiveTasks);
    expect(tasks.length).toEqual(10);
    expect(tasks).toEqual([
        { id: 0, date: new Date("2022-01-07"), type: "daily", count: 7 },
        { id: 0, date: new Date("2022-01-14"), type: "daily", count: 7 },
        { id: 0, date: new Date("2022-01-21"), type: "daily", count: 7 },
        { id: 0, date: new Date("2022-01-28"), type: "daily", count: 7 },
        { id: 1, date: new Date("2022-01-05"), type: "daily", count: 10 },
        { id: 1, date: new Date("2022-01-15"), type: "daily", count: 10 },
        { id: 1, date: new Date("2022-01-25"), type: "daily", count: 10 },
        { id: 2, date: new Date("2022-01-12"), type: "daily", count: 8 },
        { id: 2, date: new Date("2022-01-20"), type: "daily", count: 8 },
        { id: 2, date: new Date("2022-01-28"), type: "daily", count: 8 }
      ]
    );
});

test("graphql::repetitive-tasks::fetch::calcRepetitiveTasksDatesForDateRange-weekly", () => {
    const startDate = new Date("2022-01-01");
    const endDate = new Date("2022-03-01");
    const repetitiveTasks = [
        {id: 0, type: "weekly", count: 2, start_date: new Date("2021-05-17"), end_date: null},
        {id: 1, type: "weekly", count: 7, start_date: new Date("2020-09-23"), end_date: new Date("2022-08-12")},
        {id: 2, type: "weekly", count: 4, start_date: new Date("2022-01-12"), end_date: null}
    ] as RepetitiveTask[];
    const tasks = calcRepetitiveTasksDatesForDateRange(startDate, endDate, repetitiveTasks);
    expect(tasks.length).toEqual(7);
    expect(tasks).toEqual([
        { id: 0, date: new Date("2022-01-10"), type: "weekly", count: 2 },
        { id: 0, date: new Date("2022-01-24"), type: "weekly", count: 2 },
        { id: 0, date: new Date("2022-02-07"), type: "weekly", count: 2 },
        { id: 0, date: new Date("2022-02-21"), type: "weekly", count: 2 },
        { id: 1, date: new Date("2022-01-26"), type: "weekly", count: 7 },
        { id: 2, date: new Date("2022-01-12"), type: "weekly", count: 4 },
        { id: 2, date: new Date("2022-02-09"), type: "weekly", count: 4 }
    ]);
});

test("graphql::repetitive-tasks::fetch::calcRepetitiveTasksDatesForDateRange-monthly", () => {
    const startDate = new Date("2022-01-01");
    const endDate = new Date("2022-12-01");
    const repetitiveTasks = [
        {id: 0, type: "monthly", count: 3, start_date: new Date("2021-05-17"), end_date: null},
        {id: 1, type: "monthly", count: 2, start_date: new Date("2020-09-23"), end_date: new Date("2022-08-12")},
        {id: 2, type: "monthly", count: 7, start_date: new Date("2022-01-12"), end_date: null}
    ] as RepetitiveTask[];
    const tasks = calcRepetitiveTasksDatesForDateRange(startDate, endDate, repetitiveTasks);
    expect(tasks.length).toEqual(12);
    expect(tasks).toEqual([
        { id: 0, date: new Date("2022-02-17"), type: "monthly", count: 3 },
        { id: 0, date: new Date("2022-05-17"), type: "monthly", count: 3 },
        { id: 0, date: new Date("2022-08-17"), type: "monthly", count: 3 },
        { id: 0, date: new Date("2022-11-17"), type: "monthly", count: 3 },
        { id: 1, date: new Date("2022-01-23"), type: "monthly", count: 2 },
        { id: 1, date: new Date("2022-03-23"), type: "monthly", count: 2 },
        { id: 1, date: new Date("2022-05-23"), type: "monthly", count: 2 },
        { id: 1, date: new Date("2022-07-23"), type: "monthly", count: 2 },
        { id: 1, date: new Date("2022-09-23"), type: "monthly", count: 2 },
        { id: 1, date: new Date("2022-11-23"), type: "monthly", count: 2 },
        { id: 2, date: new Date("2022-01-12"), type: "monthly", count: 7 },
        { id: 2, date: new Date("2022-08-12"), type: "monthly", count: 7 }
    ])
});

test("graphql::repetitive-tasks-tasks::fetch::calcRepetitiveTasksDatesForDateRange-yearly", () => {
    const startDate = new Date("2022-01-01");
    const endDate = new Date("2025-12-01");
    const repetitiveTasks = [
        {id: 0, type: "yearly", count: 1, start_date: new Date("2023-05-17"), end_date: null}
    ] as RepetitiveTask[];
    const tasks = calcRepetitiveTasksDatesForDateRange(startDate, endDate, repetitiveTasks);
    expect(tasks.length).toEqual(3);
    expect(tasks).toEqual([
        { id: 0, date: new Date("2023-05-17"), type: "yearly", count: 1 },
        { id: 0, date: new Date("2024-05-17"), type: "yearly", count: 1 },
        { id: 0, date: new Date("2025-05-17"), type: "yearly", count: 1 }
    ]);
});


