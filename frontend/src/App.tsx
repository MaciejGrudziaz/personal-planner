import React, {useState} from 'react';
import Calendar from './views/calendar/calendar';

const getFirstDayOfTheWeek = (date: Date): Date => {
    let day = date.getDay();
    day = (day === 0) ? 6 : day - 1;
    const msInDay = 1000 * 60 * 60 * 24;
    return new Date(date.getTime() - (day * msInDay));
}


function App() {
    const [weekStartDate, setWeekStartDate] = useState(getFirstDayOfTheWeek(new Date(Date.now())));

    return (
        <Calendar weekStartDate={weekStartDate} changeWeek={(baseDate: Date)=>setWeekStartDate(baseDate)} />
    );
}

export default App;
