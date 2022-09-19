import React, {useEffect, useState} from 'react';
import { TodoTicket as TodoTicketState } from '../../store/todos';
import { Position } from '../calendar/task';
import './todo-ticket.scss';

interface Props {
    val: TodoTicketState
    mousePos?: Position;
}

interface MoveStatus {
    isGrabbed: boolean;
    position?: Position;
}

function TodoTicket(props: Props) {
    const [isGrabbed, setIsGrabbed] = useState(false);

    if(isGrabbed) {
        return (
            <div className="todo-ticket" style={{
                position: "absolute", 
            }}>
                {props.val.text}
            </div>
        );
    }

    return (
        <div className="todo-ticket" style={{display: "flex", alignItems: "center"}} 
            onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
                setIsGrabbed(true);
            }}
        >
            {props.val.text}
            <button type="button" style={{width: "1.5rem", height: "1.5rem", marginLeft: "auto"}}>x</button>
        </div>
    );
}

export default TodoTicket;

