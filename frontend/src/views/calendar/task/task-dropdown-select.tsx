import React, {useState, useEffect} from 'react';
import './task-dropdown-select.scss';


interface Props {
    options: string[];
    initValue?: string;
    label?: string;
    select?(val: string): void;
    style?: any;
}

function TaskDropdownSelect(props: Props) {
    const [value, setValue] = useState("");

    useEffect(()=>{
        if(props.initValue !== undefined) {
            setValue(props.initValue);
        }
    }, [props.initValue]);

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
        <form style={props.style} action="#">
            {label()}
            <select value={value} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>{
                setValue(e.target.value);
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

