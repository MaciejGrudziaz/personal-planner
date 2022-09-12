import { createSlice, current, PayloadAction } from '@reduxjs/toolkit';

export interface TaskTime {
    hour: number;
    minute: number;
}

export function parseTimeToStr(time: TaskTime): string {
    return `${(time.hour < 10) ? '0'+time.hour.toFixed() : time.hour}:${(time.minute < 10) ? '0'+time.minute.toFixed() : time.minute}`;
}

export interface TaskDate {
    day: number;    // 1 - 31
    month: number;  // 0 - 11
    year: number;   // 4 digit
}

export function parseDateToStr(date: TaskDate): string {
    return `${date.year}-${(date.month < 9) ? '0'+(date.month + 1).toFixed() : (date.month + 1)}-${(date.day < 10) ? '0'+date.day.toFixed() : date.day}`;
}

export function parseDateToBuiltin(date: TaskDate): Date {
    return new Date(date.year, date.month, date.day);
}

export interface TaskCategory {
    value: "simple" | "important";
}

export interface TaskState {
    id: string;
    date: TaskDate;
    startTime: TaskTime;
    endTime: TaskTime;
    basicInfo: string;
    description: string;
    category: TaskCategory;
}

interface MonthTasks {
    month: number;
    tasks: TaskState[];
}

interface YearTasks {
    year: number;
    months: MonthTasks[];
}

interface TasksState {
    years: YearTasks[];
}

function findTask(id: string, state: TasksState): TaskState | undefined {
    for(let i = 0; i < state.years.length; i += 1) {
        for(let j = 0; j < state.years[i].months.length; j += 1) {
            const found = state.years[i].months[j].tasks.find((val: TaskState) => val.id === id);
            if(found !== undefined) {
                return found;
            }
        }
    }
    return undefined;
}

export function findTasksForWeek(date: Date, state: TasksState): TaskState[] {
    let day = date.getDay();
    day = (day === 0) ? day = 6 : day - 1;
    const msInDay = 1000 * 60 * 60 * 24;
    const startDate = new Date(date.getTime() - (day * msInDay));
    startDate.setHours(0)
    startDate.setMinutes(0);
    startDate.setSeconds(0);
    startDate.setMilliseconds(0);
    const endDate = new Date(date.getTime() + ((6 - day) * msInDay));
    endDate.setHours(23);
    endDate.setMinutes(59);
    endDate.setSeconds(59);
    endDate.setMilliseconds(999);

    const yearTasks = state.years.find((value: YearTasks) => value.year === date.getFullYear());
    if(yearTasks === undefined) { return []; }
    const monthTasks = yearTasks.months.find((value: MonthTasks) => value.month === date.getMonth());
    if(monthTasks === undefined) { return []; }

    return monthTasks.tasks.filter((value: TaskState) => {
        const taskDate = parseDateToBuiltin(value.date);
        const testValue = taskDate >= startDate && taskDate <= endDate;
        return testValue;
    });
}

function generateId(task: TaskState): string {
    const id = task.date.year ^ task.date.month ^ task.date.day ^ task.startTime.hour ^ task.startTime.minute ^ task.endTime.hour ^ task.endTime.minute;
    console.log(id);
    return id.toFixed();
}

function insertTask(state: TasksState, task: TaskState) {
    // const taskDate = parseDateToBuiltin(task.date);
    const year = task.date.year;
    const month = task.date.month;
    const yearTasks = state.years.find((value: YearTasks) => value.year === year);
    if(yearTasks === undefined) {
        state.years.push({year: year, months: [{month: month, tasks: [task]}]});
        return;
    }
    const monthTasks = yearTasks.months.find((value: MonthTasks) => value.month === month);
    if(monthTasks === undefined) {
        yearTasks.months.push({month: month, tasks: [task]});
        return;
    }
    let existingTask = monthTasks.tasks.find((value: TaskState) => value.id === task.id);
    if(existingTask === undefined) {
        monthTasks.tasks.push(task);
        return;
    }
    existingTask = task;
}

const initialState: TasksState  = {
    years: [{
        year: 2022,
        months: [
            {
                month: 8,
                tasks: [
                    {id: "task1", date: {year: 2022, month: 8, day: 12}, startTime: {hour: 12, minute: 0}, endTime: {hour: 14, minute:0}, basicInfo: "task 1 basic info", description: "task 1 description", category: {value: "important"}},
                    {id: "task2", date: {year: 2022, month: 8, day: 13}, startTime: {hour: 10, minute: 30}, endTime: {hour: 11, minute: 35}, basicInfo: "task 2 basic info", description: "task 2 description", category: {value: "simple"}},
                    {id: "task3", date: {year: 2022, month: 8, day: 14}, startTime: {hour: 14, minute: 30}, endTime: {hour: 18, minute: 30}, basicInfo: "task 3 basicInfo", description: "task 3 description", category: {value: "simple"}},
                    {id: "task4", date: {year: 2022, month: 8, day: 15}, startTime: {hour: 14, minute: 30}, endTime: {hour: 18, minute: 39}, basicInfo: "task 4 basic info", description: "task 4 description", category: {value: "simple"}},
                ]
            }
        ]
    }]
}

export const tasksSlice = createSlice({
    name: "tasks",
    initialState,
    reducers: {
        updateTask: (state, action: PayloadAction<TaskState>) => {
            console.log("store tasks update");
            const newTask = action.payload;
            if(newTask.id === "") {
                newTask.id = generateId(newTask);
            }
            const currentTask = findTask(newTask.id, state);
            if(currentTask === undefined) {
                insertTask(state, newTask);
                return state;
            }
            currentTask.date = newTask.date;
            currentTask.startTime = newTask.startTime;
            currentTask.endTime = newTask.endTime;
            currentTask.basicInfo = newTask.basicInfo;
            currentTask.description = newTask.description;
            currentTask.category = newTask.category;
            return state;
        }
    }
})

export const { updateTask } = tasksSlice.actions;

export default tasksSlice.reducer;

