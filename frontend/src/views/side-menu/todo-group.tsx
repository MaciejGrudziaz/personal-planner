import React, {RefObject, useEffect, useState, useRef} from 'react';
import { useDispatch } from 'react-redux';
import { TodoGroup as TodoGroupState, TodoTicket as TodoTicketState, sortTickets, moveTicket, createTicket, deleteGroup, moveGroup} from '../../store/todos';
import TodoTicket from './todo-ticket';
import FloatingTextInput from './floating-text-input';
import { Position } from '../calendar/task';
import './todo-group.scss';

interface Props {
    val: TodoGroupState;
    basePos?: Position;
    baseSize?: Position;
    mousePos?: Position;
}

function TodoGroup(props: Props) {
    const [mousePos, setMousePos] = useState(undefined as Position | undefined);
    const [grabbedTicket, setGrabbedTicket] = useState(undefined as string | undefined);
    const [showTicketInput, setShowTicketInput] = useState(false);
    const groupHeaderRef = useRef() as RefObject<HTMLDivElement>;
    const dispatch = useDispatch();

    const tickets = () => sortTickets(props.val.tickets).map((ticket: TodoTicketState) => (
        <TodoTicket key={ticket.id} 
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

    const ticketFloatingInput = () => {
        const el = groupHeaderRef.current;
        if(!showTicketInput || el === undefined || el === null) {
            return (<></>);
        }

        const boundingRect = el.getBoundingClientRect();
        let x = boundingRect.x;
        let y = boundingRect.y + 0.75 * boundingRect.height;
        if(props.basePos) {
            x -= props.basePos.x;
            y -= props.basePos.y;
        }

        return (
            <FloatingTextInput x={x} y={y} width={"75%"}
                close={()=>setShowTicketInput(false)} 
                save={(val: string)=>{
                    const tickets = props.val.tickets;
                    const priority = (tickets.length === 0) ? 0 : tickets[tickets.length - 1].priority + 1;
                    dispatch(createTicket({groupId: props.val.id, ticket: {id: Date.now().toFixed(), text: val, done: false, priority: priority}}));
                }}
            />
        );
    };

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
            <div ref={groupHeaderRef} style={{display: "flex", alignItems: "center"}}>
                <div className="todo-group-priority-btn-grid">
                    <button className="todo-group-priority-btn"
                        onClick={()=>{
                            dispatch(moveGroup({groupId: props.val.id, direction: "up"}));
                        }}
                    >+</button>
                    <button className="todo-group-priority-btn"
                        onClick={()=>{
                            dispatch(moveGroup({groupId: props.val.id, direction: "down"}));
                        }}
                    >-</button>
                </div>
                <h4 className="todo-group-header">{props.val.name}</h4>
                <button type="button" style={{marginLeft: "1rem", width: "1.5rem", height: "1.5rem"}}
                    onClick={()=>setShowTicketInput(true)}
                >+</button>
                {ticketFloatingInput()}
                <button type="button" style={{marginLeft: "auto", marginRight: "0.5rem", width: "1.5rem", height: "1.5rem"}}
                    onClick={()=>dispatch(deleteGroup({groupId: props.val.id}))}
                >x</button>
            </div>
            {tickets()}
        </div>
    );
}

export default TodoGroup;

