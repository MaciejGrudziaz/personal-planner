import React, {useEffect, useState} from 'react';
import { TodoGroup as TodoGroupState, TodoTicket as TodoTicketState, sortTickets} from '../../store/todos';
import TodoTicket from './todo-ticket';
import { Position } from '../calendar/task';
import './todo-group.scss';

interface Props {
    val: TodoGroupState;
}

function TodoGroup(props: Props) {
    const [mousePos, setMousePos] = useState(undefined as Position | undefined);
    const tickets = () => sortTickets(props.val.tickets).map((ticket: TodoTicketState) => (
        <TodoTicket key={ticket.priority} val={ticket} mousePos={mousePos} />
    ));

    return (
        <div className="todo-group"
            onMouseMove={(e: React.MouseEvent<HTMLDivElement>)=>{
                const pos = new Position(e.clientX, e.clientY);
                console.log(`move pos: ${pos.x}, ${pos.y}`);
                setMousePos(pos);
            }}
        >
            <div style={{display: "flex", alignItems: "center"}}>
                <h4>{props.val.name}</h4>
                <button type="button" style={{marginLeft: "1rem", width: "1.5rem", height: "1.5rem"}}>+</button>
                <button type="button" style={{marginLeft: "auto", marginRight: "0.5rem", width: "1.5rem", height: "1.5rem"}}>x</button>
            </div>
            {tickets()}
        </div>
    );
}

export default TodoGroup;

