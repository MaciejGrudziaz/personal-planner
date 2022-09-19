import React, {useEffect, useState} from 'react';
import { TodoTicket as TodoTicketState } from '../../store/todos';
import { Position } from '../calendar/task';
import './todo-ticket.scss';

interface Props {
    val: TodoTicketState
    mousePos?: Position;
    mouseDown: ()=>void;
    mouseUp: ()=>void;
}

function TodoTicket(props: Props) {
    const [isGrabbed, setIsGrabbed] = useState(false);
    const [toggle, setToggle] = useState(false);

    useEffect(()=>{
        if(toggle && props.mousePos === undefined) {
            setIsGrabbed(false);
            setToggle(false);
        }
    });

    if(isGrabbed && props.mousePos !== undefined) {
        if(!toggle) { setToggle(true); }
        return (
            <div className="todo-ticket" style={{
                position: "absolute",
                top: props.mousePos.y,
                left: props.mousePos.x,
            }}>
                {props.val.text}
            </div>
        );
    }

    return (
        <div className="todo-ticket" style={{display: "flex", alignItems: "center"}} 
            onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
                setIsGrabbed(true);
                props.mouseDown();
            }}
            onMouseUp={(e: React.MouseEvent<HTMLDivElement>)=> {
                props.mouseUp();
            }}
        >
            {props.val.text}
            <button type="button" style={{width: "1.5rem", height: "1.5rem", marginLeft: "auto"}}>x</button>
        </div>
    );
}

export default TodoTicket;

