import React from 'react';
import './task-dropdown-select.scss';


interface Props {
    options: string[];
    initValue: string;
    label?: string;
    select?(val: string): void;
}

function TaskDropdownSelect(props: Props) {
    const options = () => {
        return props.options.map((val: string, id: number) => (
            <option key={id} value={val}>{val}</option>
        ));
    }

    const label = () => {
        if(props.label === undefined) {
            return (<></>);
        }
        return (
            <label className="task-dropdown-label">{props.label}:</label>
        );
    }

    return (
        <form action="#">
            {label()}
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

