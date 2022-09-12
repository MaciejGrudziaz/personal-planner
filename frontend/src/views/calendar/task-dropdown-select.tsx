import React from 'react';
import './task-dropdown-select.scss';


interface Props {
    options: string[];
    initValue: string;
    label: string;
    select?(val: string): void;
}

function TaskDropdownSelect(props: Props) {
    const options = () => {
        return props.options.map((val: string) => (
            <option value={val}>{val}</option>
        ));
    }

    return (
        <form action="#">
            <label className="task-dropdown-label">{props.label}:</label>
            <select value={props.initValue} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>{
                if(props.select) {
                    props.select(e.target.value);
                }
            }}>
                {options()}
            </select>
        </form>
    );
}

export default TaskDropdownSelect;

