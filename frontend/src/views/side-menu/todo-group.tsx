import React, {useEffect, useState} from 'react';
import { useDispatch } from 'react-redux';
import { TodoGroup as TodoGroupState, TodoTicket as TodoTicketState, sortTickets, moveTicket, createTicket, createGroup} from '../../store/todos';
import TodoTicket from './todo-ticket';
import { Position } from '../calendar/task';
import './todo-group.scss';

interface Props {
    val: TodoGroupState;
    basePos?: Position;
    baseSize?: Position;
}

function TodoGroup(props: Props) {
    const [mousePos, setMousePos] = useState(undefined as Position | undefined);
    const [grabbedTicket, setGrabbedTicket] = useState(undefined as string | undefined);
    const dispatch = useDispatch();

    const tickets = () => sortTickets(props.val.tickets).map((ticket: TodoTicketState) => (
        <TodoTicket key={ticket.priority} 
            val={ticket}
            mousePos={mousePos} 
            sideMenuBasePos={props.basePos} 
            sideMenuBaseSize={props.baseSize}
            groupId={props.val.id}
            mouseDown={()=>{
                setGrabbedTicket(ticket.id);
            }}
            mouseUp={()=>{
                setMousePos(undefined);
                if(grabbedTicket === undefined) { return; }
                dispatch(moveTicket({ticketId: grabbedTicket, priority: ticket.priority - 1, groupId: props.val.id}));
                setGrabbedTicket(undefined);
            }}
        />
    ));

    return (
        <div className="todo-group"
            onMouseMove={(e: React.MouseEvent<HTMLDivElement>)=>{
                if(props.basePos === undefined || e.buttons === 0) {
                    setMousePos(undefined);
                    return;
                }
                const pos = new Position(e.clientX - props.basePos.x, e.clientY - props.basePos.y);
                setMousePos(pos);
            }}
            onMouseUp={()=>{
                setMousePos(undefined);
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

