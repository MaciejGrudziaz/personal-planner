import React, {RefObject, useEffect, useState, useRef} from 'react';
import { TodoGroup as TodoGroupState, TodoTicket as TodoTicketState, sortTickets } from '../../store/todos';
import { useMoveTicket, useMoveTodoGroup, useRenameTodoGroup } from '../../gql-client/todos/update';
import { useCreateTodoTicket } from '../../gql-client/todos/create';
import { useDeleteTodoGroup } from '../../gql-client/todos/delete';
import TodoTicket from './todo-ticket';
import FloatingTextInput from './floating-text-input';
import EditMenu from '../popup-menu/edit-menu';
import { Position } from '../calendar/task/task';
import './todo-group.scss';

interface Props {
    val: TodoGroupState;
    mousePos?: Position;
}

function TodoGroup(props: Props) {
    const [mousePos, setMousePos] = useState(undefined as Position | undefined);
    const [grabbedTicket, setGrabbedTicket] = useState(undefined as string | undefined);
    const [showTicketInput, setShowTicketInput] = useState(false);
    const [isEditMenuOpen, setEditMenuOpen] = useState(false);
    const [editMenuPos, setEditMenuPos] = useState(undefined as Position | undefined);
    const [isTextEdit, setTextEdit] = useState(false);
    const [group, setGroup] = useState(undefined as TodoGroupState | undefined);
    const [isInitialized, setInit] = useState(false);
    const groupHeaderRef = useRef() as RefObject<HTMLDivElement>;
    const moveTicket = useMoveTicket();
    const createTicket = useCreateTodoTicket();
    const renameTodoGroup = useRenameTodoGroup();
    const deleteTodoGroup = useDeleteTodoGroup();
    const moveTodoGroup = useMoveTodoGroup();

    useEffect(()=>{
        if(isInitialized)  return;
        setGroup(props.val);
        setInit(true);
    });

    useEffect(()=>{
        setGroup(props.val);
    }, [props.val]);

    if(group === undefined) {
        return (<></>);
    }

    const tickets = () => sortTickets(group.tickets).map((ticket: TodoTicketState) => (
        <TodoTicket key={ticket.id} 
            val={ticket}
            mousePos={mousePos} 
            groupId={group.id}
            mouseDown={()=>{
                setGrabbedTicket(ticket.id);
            }}
            mouseUp={()=>{
                setMousePos(undefined);
                if(grabbedTicket === undefined) { return; }
                moveTicket(grabbedTicket, ticket.id);
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
        let x = boundingRect.x + boundingRect.width;
        let y = boundingRect.y;

        return (
            <FloatingTextInput x={x} y={y} width={"15%"} marginLeft={"4rem"}
                close={()=>setShowTicketInput(false)} 
                save={(val: string)=>{
                    const tickets = group.tickets;
                    const priority = (tickets.length === 0) ? 0 : tickets[tickets.length - 1].priority + 1;
                    createTicket({id: "", content: val, done: false, priority: priority}, group.id);
                }}
            />
        );
    };

    const groupNameContent = () => {
        if(isTextEdit) {
            return (
                <input className="todo-group-header" value={group.name} autoFocus={true}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>)=>{
                        setGroup({...group, name: e.target.value});
                    }}
                    onBlur={()=>setTextEdit(false)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>)=>{
                        if(e.key === "Escape" || e.key === "Tab") {
                            setTextEdit(false);
                            setGroup(props.val);
                            return;
                        }
                        if(e.key === "Enter") {
                            renameTodoGroup(group.id, group.name);
                            setTextEdit(false);
                            return;
                        }
                    }}
                />
            );
        }
        return (
            <div className="todo-group-header" ref={groupHeaderRef} 
                onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => {
                    e.preventDefault();
                    setEditMenuOpen(true);
                    const pos = new Position(e.clientX, e.clientY);
                    setEditMenuPos(pos);
                }}
            >{group.name}</div>
        );
    }

    const editMenu = () => {
        if(!isEditMenuOpen || editMenuPos === undefined) {
            return (<></>);
        }
        return (
            <EditMenu x={editMenuPos.x} y={editMenuPos.y}
                close={()=>{
                    setEditMenuOpen(false);
                    setEditMenuPos(undefined);
                }}
                edit={()=>{
                    setTextEdit(true);
                }}
                delete={()=>{
                    deleteTodoGroup(props.val.id);
                }}
            />
        );
    }

    return (
        <>
            <div className="todo-group"
                onMouseMove={(e: React.MouseEvent<HTMLDivElement>)=>{
                    if(e.buttons === 0) {
                        setMousePos(undefined);
                        return;
                    }
                    const pos = new Position(e.clientX, e.clientY);
                    setMousePos(pos);
                }}
                onMouseUp={()=>{
                    setMousePos(undefined);
                }}
            >
                <div style={{display: "flex", alignItems: "center"}}>
                    <div className="todo-group-priority-btn-grid">
                        <button className="todo-group-priority-btn"
                            onClick={() => moveTodoGroup(props.val.id, "up")}
                        >+</button>
                        <button className="todo-group-priority-btn"
                            onClick={() => moveTodoGroup(props.val.id, "down")}
                        >-</button>
                    </div>
                    {groupNameContent()}
                    <button type="button" style={{marginLeft: "1rem", width: "1.5rem", height: "1.5rem"}}
                        onClick={() => setShowTicketInput(true)}
                    >+</button>
                    {ticketFloatingInput()}
                    <button type="button" style={{marginLeft: "auto", marginRight: "0.5rem", width: "1.5rem", height: "1.5rem"}}
                        onClick={() => deleteTodoGroup(props.val.id)}
                    >x</button>
                </div>
                {tickets()}
            </div>
            {editMenu()}
        </>
    );
}

export default TodoGroup;

