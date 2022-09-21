import React, {RefObject, useEffect, useState, useRef} from 'react';
import { TodoTicket as TodoTicketState, modifyTicket, deleteTicket } from '../../store/todos';
import { useDispatch } from 'react-redux';
import EditMenu from '../popup-menu/edit-menu';
import { Position } from '../calendar/task';
import './todo-ticket.scss';

interface Props {
    val: TodoTicketState;
    groupId: string;
    sideMenuBasePos?: Position;
    sideMenuBaseSize?: Position;
    mousePos?: Position;
    mouseDown: ()=>void;
    mouseUp: ()=>void;
}

function TodoTicket(props: Props) {
    const [isGrabbed, setIsGrabbed] = useState(false);
    const [toggle, setToggle] = useState(false);
    const [isEditMenuOpened, setEditMenuOpen] = useState(false);
    const [editMenuPos, setEditMenuPos] = useState(undefined as Position | undefined);
    const [todo, setTodo] = useState(undefined as TodoTicketState | undefined);
    const [isEdit, setEdit] = useState(false);
    const [isInitialized, setInit] = useState(false);
    const ticketRef = useRef() as RefObject<HTMLDivElement>;
    const dispatch = useDispatch();

    useEffect(()=>{
        if(toggle && props.mousePos === undefined) {
            setIsGrabbed(false);
            setToggle(false);
        }
        if(isInitialized) return;
        setTodo(props.val);
        setInit(true);
    });

    useEffect(()=>{
        setTodo(props.val);
    }, [props.val]);

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

    const editMenu = ()=>{
        if(!isEditMenuOpened || editMenuPos === undefined) {
            return (<></>);
        }
        return (
            <EditMenu x={editMenuPos.x} y={editMenuPos.y} 
                menuWidth={(props.sideMenuBaseSize) ? props.sideMenuBaseSize.x : undefined}
                menuHeight={(props.sideMenuBaseSize) ? props.sideMenuBaseSize.y : undefined}
                close={()=>{
                    setEditMenuOpen(false);
                    setEditMenuPos(undefined);
                }}
                edit={()=>{
                    setEdit(true);
                }}
                delete={()=>{
                    if(todo === undefined) return;
                    dispatch(deleteTicket({groupId: props.groupId, ticketId: todo.id}));
                }}
            />
        );
    }

    const ticketContent = () => {
        if(isEdit && todo !== undefined) {
            return (
                <input value={todo.text} autoFocus={true} className="todo-ticket"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>)=>{
                        setTodo({...todo, text: e.target.value});
                    }}
                    onBlur={()=> setEdit(false)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>)=>{
                        if(e.key === "Escape" || e.key === "Tab") {
                            setEdit(false);
                            return;
                        }
                        if(e.key === "Enter") {
                            dispatch(modifyTicket({groupId: props.groupId, ticket: todo}));
                            setEdit(false);
                            return;
                        }
                    }}
                />
            );
        }
        return (
            <div ref={ticketRef} className="todo-ticket"
                onContextMenu={(e: React.MouseEvent<HTMLDivElement>)=> {
                    e.preventDefault();
                    if(props.sideMenuBasePos === undefined) { return; }
                    setEditMenuOpen(true);
                    const pos = new Position(e.clientX - props.sideMenuBasePos.x, e.clientY - props.sideMenuBasePos.y);
                    setEditMenuPos(pos);
                }}
                onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
                    if(e.button !== 0) { return; }
                    setIsGrabbed(true);
                    props.mouseDown();
                    e.stopPropagation();
                }}
                onMouseUp={(e: React.MouseEvent<HTMLDivElement>)=> {
                    props.mouseUp();
                }}
            >
                {props.val.text}
            </div>
        );
    };

    return (
        <>
            <div style={{display: "flex"}}>
                <input type="checkbox"
                    style={{margin: "auto"}}
                    checked={(todo) ? todo.done : false}
                    onChange={()=>{
                        if(todo === undefined) return;
                        setTodo({...todo, done: !todo.done});
                        dispatch(modifyTicket({groupId: props.groupId, ticket: {...todo, done: !todo.done}}));
                    }
                } />
                {ticketContent()}
                <button type="button" style={{width: "1.5rem", height: "1.5rem", margin: "auto"}}
                    onClick={() => {
                        if(todo === undefined) return;
                        dispatch(deleteTicket({groupId: props.groupId, ticketId: todo.id}));
                    }}
                >x</button>
            </div>
            {editMenu()}
        </>
    );
}

export default TodoTicket;

