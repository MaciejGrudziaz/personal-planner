import { Client, QueryConfig, QueryArrayConfig } from 'pg';

interface TaskTime {
    hour: number;
    minute: number;
}

function fromString(time: string): TaskTime | null {
    const splits = time.split(":");
    if(splits.length < 2) {
        console.log(`wrong time format ${time} (expected: hh:mm[:ss])`);
        return null;
    }
    const hour = parseInt(splits[0]);
    const minute = parseInt(splits[1]);
    if(isNaN(hour) || isNaN(minute)) {
        console.log(`wrong data format of time field: ${time}`);
        return null;
    }
    return {hour: hour, minute: minute};
}

interface TaskDate {
    year: number;
    month: number;
    day: number;
}

function fromDate(date: Date): TaskDate {
    return {year: date.getFullYear(), month: date.getMonth(), day: date.getDate()};
}

interface Task {
    id: string;
    startTime: TaskTime | null;
    endTime: TaskTime | null;
    date: TaskDate;
    basicInfo: string;
    description: string;
    category: Category;
}

type Category = "simple" | "important";

function mapCategory(category: number): Category | undefined {
    switch(category) {
        case 0: return "simple";
        case 1: return "important";
    }
    return undefined;
}

function exists(val: any): boolean {
    return val !== null && val !== undefined;
}

function parseTask(value: any): Task | undefined {
    const id = value["id"] as number;
    const categoryId = value["category"] as number;
    const date = value["date"] as Date;
    if(!exists(id) || !exists(categoryId) || !exists(date)) {
        console.log("One of mandatory values ('id', 'category', 'date') is null or undefined");
        return undefined;
    }

    const category = mapCategory(categoryId);
    if(category === undefined) {
        console.log(`Unrecognized category '${categoryId}'`);
        return undefined;
    }

    return {
        id: id.toFixed(),
        startTime: (exists(value["start_time"])) ? fromString(value["start_time"]) : null,
        endTime: (exists(value["end_time"])) ? fromString(value["end_time"]) : null,
        date: fromDate(date),
        basicInfo: (exists(value["basic_info"])) ? value["basic_info"] : "",
        description: (exists(value["description"])) ? value["description"] : "",
        category: category,
    };
}

interface FetchParams {
    year?: number;
    month?: number;
    id?: number;
}

export class DBClient {
    client: Client;

    constructor(user: string, password: string, database: string, host: string, port: number) {
        this.client = new Client({user: user, password: password, database: database, host: host, port: port});
    }
    async connect(): Promise<void> {
        await this.client.connect();
    }

    async fetchTasks(params: FetchParams): Promise<Task[] | undefined> {
        if(params.month === undefined || params.year === undefined) {
            return undefined;
        }
        try {
            const result = await this.client.query(this.singleMonthQuery(params.month, params.year));
            return result.rows
                .map((val: any)=>parseTask(val))
                .filter((val: Task | undefined) => val !== undefined)
                .map((val: Task | undefined) => val!);
        } catch(err: any) {
            console.error(err.stack);
        }
        return undefined;
    }

    singleMonthQuery(month: number, year: number): QueryConfig {
        const lower = `${year}-${month}-01`;
        const upper = `${(month === 12) ? year + 1 : year}-${(month === 12) ? 1 : month + 1}-01`;
        return {
            name: "select-tasks-by-month",
            text: "SELECT * FROM tasks where date >= $1 and date < $2",
            values: [lower, upper],
        };
    }
}

export async function initDBClient(user: string, password: string, host: string, retryCounter?: number): Promise<DBClient | undefined> {
    if(retryCounter === undefined) {
        retryCounter = 2;
    }

    const client = new DBClient(user, password, "personalplanner", host, 5432);
    let isOk = true;
    await client.connect().catch((err) => {
        console.error(`error connecting to database on ${host}\n`, err.stack);
        isOk = false;
    });

    if(isOk) {
        return client;
    }

    if(retryCounter > 0) {
        console.log("retrying...");
        return initDBClient(user, password, host, retryCounter - 1);
    }

    return undefined;
}



