import React, {useState} from 'react';
import Calendar from './views/calendar/calendar';

const getFirstDayOfTheWeek = (date: Date): Date => {
    let day = date.getDay();
    day = (day === 0) ? 6 : day - 1;
    const msInDay = 1000 * 60 * 60 * 24;
    const startDate = new Date(date.getTime() - (day * msInDay));
    startDate.setHours(0);
    startDate.setMinutes(0);
    startDate.setSeconds(0);
    startDate.setMilliseconds(0);
    return startDate;
}


function App() {
    const [weekStartDate, setWeekStartDate] = useState(getFirstDayOfTheWeek(new Date(Date.now())));

    return (
        <Calendar weekStartDate={weekStartDate} changeWeek={(baseDate: Date)=>setWeekStartDate(baseDate)} />
    );
}

export default App;
