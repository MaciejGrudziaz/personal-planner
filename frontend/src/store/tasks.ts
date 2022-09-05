import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TaskState {
    id: string;
    day: string;
    startTime: string;
    endTime: string;
    basicInfo: string;
    description: string;
    category: string;
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

function findTask(id: string, year: number, month: number, state: TasksState): TaskState | undefined {
    const yearTasks = state.years.find((value: YearTasks) => value.year === year);
    if(yearTasks === undefined) { return undefined; }
    const monthTasks = yearTasks.months.find((value: MonthTasks) => value.month === month);
    if(monthTasks === undefined) { return undefined; }
    return monthTasks.tasks.find((value: TaskState) => value.id === id);
}

export function findTasksForWeek(dayInTheWeek: Date, state: TasksState): TaskState[] {
    let day = dayInTheWeek.getDay();
    day = (day - 1 < 0) ? day = 6 : day - 1;
    const msInDay = 1000 * 60 * 60 * 24;
    const startDate = new Date(dayInTheWeek.getTime() - (day * msInDay));
    const endDate = new Date(dayInTheWeek.getTime() + ((6 - day) * msInDay));

    const yearTasks = state.years.find((value: YearTasks) => value.year === dayInTheWeek.getFullYear());
    if(yearTasks === undefined) { return []; }
    const monthTasks = yearTasks.months.find((value: MonthTasks) => value.month === dayInTheWeek.getMonth());
    if(monthTasks === undefined) { return []; }

    return monthTasks.tasks.filter((value: TaskState) => {
        const taskDate = new Date(value.day);
        return taskDate >= startDate && taskDate <= endDate;
    });
}

function insertTask(state: TasksState, task: TaskState) {
    const taskDate = new Date(task.day);
    const year = taskDate.getFullYear();
    const month = taskDate.getMonth();
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
                month: 7,
                tasks: [
                    {id: "task1", day: "2022-08-29", startTime: "12:00", endTime: "14:00", basicInfo: "task 1 basic info", description: "task 1 description", category: "red"},
                    {id: "task2", day: "2022-08-31", startTime: "10:30", endTime: "11:35", basicInfo: "task 2 basic info", description: "task 2 description", category: "yellow"},
                    {id: "task3", day: "2022-08-30", startTime: "14:30", endTime: "18:39", basicInfo: "task 3 basicInfo", description: "task 3 description", category: "blue"},
                    {id: "task4", day: "2022-08-29", startTime: "14:30", endTime: "18:39", basicInfo: "task 4 basic info", description: "task 4 description", category: "green"},
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
            const taskDate = new Date(newTask.day);
            const year = taskDate.getFullYear();
            const month = taskDate.getMonth();
            let currentTask = findTask(newTask.id, year, month, state);
            if(currentTask === undefined) {
                insertTask(state, newTask);
                return;
            }
            currentTask = newTask;
            return;
        }
    }
})

export const { updateTask } = tasksSlice.actions;

export default tasksSlice.reducer;

