import { DBClient } from "../../../../db-client/client";
import { RepetitiveTask, parseRepetitiveTask } from "../../../../graphql/repetitive-tasks/types";

jest.mock("../../../../db-client/client");

test("graphql::repetitive-tasks::types::correctParsingFromJson", () => {
    const val = {
        id: 123,
        type: 0,
        count: 100,
        start_date: new Date("2022-01-01"),
        end_date: new Date("2022-02-01")
    };

    const task = parseRepetitiveTask(val);
    expect(task).toBeDefined();
    expect(task).toEqual({
        id: 123,
        type: "daily",
        count: 100,
        start_date: new Date("2022-01-01"),
        end_date: new Date("2022-02-01")
    });
});

test("graphql::repetitive-tasks::types::parsingWithNullEndDate", () => {
    const val = {
        id: 111,
        type: 1,
        count: -1,
        start_date: new Date("2011-08-01"),
        end_date: null
    };

    const task = parseRepetitiveTask(val);
    expect(task).toBeDefined();
    expect(task).toEqual({
        id: 111,
        type: "weekly",
        count: -1,
        start_date: new Date("2011-08-01"),
        end_date: null
    });
});

test("graphql::repetitive-tasks::types::parsingForUndefinedDataFields", () => {
    const val = {
        random: "string val",
        abc: 99.9,
        some_value: 88
    };

    const task = parseRepetitiveTask(val);
    expect(task).toBeUndefined();
});

test("graphql::repetitive-tasks::types::parsingWithExtraDataFields", () => {
    const val = {
        id: 1,
        type: 2,
        count: 3,
        start_date: new Date("1999-01-08"),
        end_date: new Date("1989-08-01"),
        additional_field: "test"
    };

    const task = parseRepetitiveTask(val);
    expect(task).toBeDefined();
    expect(task).toEqual({
        id: 1,
        type: "monthly",
        count: 3,
        start_date: new Date("1999-01-08"),
        end_date: new Date("1989-08-01")
    });
});

test("graphql::repetitive-tasks::types::parsingRepetitionTypes", () => {
    const tasks = [
        {id: 123, type: 0, count: 1, start_date: new Date("2022-01-01"), end_date: null},
        {id: 123, type: 1, count: 1, start_date: new Date("2022-01-01"), end_date: null},
        {id: 123, type: 2, count: 1, start_date: new Date("2022-01-01"), end_date: null},
        {id: 123, type: 3, count: 1, start_date: new Date("2022-01-01"), end_date: null},
        {id: 123, type: 4, count: 1, start_date: new Date("2022-01-01"), end_date: null},
        {id: 123, type: 5, count: 1, start_date: new Date("2022-01-01"), end_date: null},
        {id: 123, type: -1, count: 1, start_date: new Date("2022-01-01"), end_date: null}
    ];

    const parsedTasks = tasks.map((val: any) => parseRepetitiveTask(val));

    expect(parsedTasks.length).toEqual(7);
    expect(parsedTasks[0]).toBeDefined();
    expect(parsedTasks[0]!.type).toEqual("daily");
    expect(parsedTasks[1]).toBeDefined();
    expect(parsedTasks[1]!.type).toEqual("weekly");
    expect(parsedTasks[2]).toBeDefined();
    expect(parsedTasks[2]!.type).toEqual("monthly");
    expect(parsedTasks[3]).toBeDefined();
    expect(parsedTasks[3]!.type).toEqual("yearly");
    expect(parsedTasks[4]).toBeDefined();
    expect(parsedTasks[4]!.type).toEqual("day-of-week");
    expect(parsedTasks[5]).toBeUndefined();
    expect(parsedTasks[6]).toBeUndefined();
});

test("graphql::repetitive-tasks::types::parsingWithWrongDataTypeField", () => {
    const val = {
        id: "string id",
        type: 0,
        count: 11,
        start_date: new Date("2009-08-11"),
        end_date: new Date("2010-08-21")
    };

    const task = parseRepetitiveTask(val);
    expect(task).toBeUndefined();
});

