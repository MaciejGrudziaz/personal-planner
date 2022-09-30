import { DBClient } from "../../db-client/client";
import { RepetitiveTask, parseRepetitiveTask } from "../../graphql/repetitive-tasks/types";
import { fetchRepetitiveTasks, calcRepetitiveTasksDatesForDateRange } from "../../graphql/repetitive-tasks/fetch";

jest.mock("../../db-client/client");

test("RepetitiveTask correct parsing from json object", () => {
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
        type: 0,
        count: 100,
        start_date: new Date("2022-01-01"),
        end_date: new Date("2022-02-01")
    });
});

test("RepetitiveTask parsing with null end_date", () => {
    const val = {
        id: 111,
        type: 89,
        count: -1,
        start_date: new Date("2011-08-01"),
        end_date: null
    };

    const task = parseRepetitiveTask(val);
    expect(task).toBeDefined();
    expect(task).toEqual({
        id: 111,
        type: 89,
        count: -1,
        start_date: new Date("2011-08-01"),
        end_date: null
    });
});

test("RepetitiveTask parsing for undefined data fields", () => {
    const val = {
        random: "string val",
        abc: 99.9,
        some_value: 88
    };

    const task = parseRepetitiveTask(val);
    expect(task).toBeUndefined();
});

test("RepetitiveTask with extra fields", () => {
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
        type: 2,
        count: 3,
        start_date: new Date("1999-01-08"),
        end_date: new Date("1989-08-01")
    });
});

test("RepetitiveTask with wrong type field", () => {
    const val = {
        id: "string id",
        type: 8123,
        count: 11,
        start_date: new Date("2009-08-11"),
        end_date: new Date("2010-08-21")
    };

    const task = parseRepetitiveTask(val);
    expect(task).toBeUndefined();
});

