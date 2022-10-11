import React, {RefObject, useEffect, useState, useRef} from 'react';
import { TodoTicket as TodoTicketState } from '../../store/todos';
import { useDeleteTodoTicket } from '../../gql-client/todos/delete';
import { useUpdateTicket } from '../../gql-client/todos/update';
import EditMenu from '../popup-menu/edit-menu';
import { Position } from '../calendar/task/task';
import './todo-ticket.scss';

interface Props {
    val: TodoTicketState;
    groupId: string;
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
    const deleteTodoTicket = useDeleteTodoTicket();
    const updateTicket = useUpdateTicket();

    const doneTaskBckgColor = "#adc178";
    const standardTaskBckgColor = "#fff";

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
                position: "fixed",
                top: props.mousePos.y + 1,
                left: props.mousePos.x + 1,
                width: "10%",
                overflow: "hidden",
                backgroundColor: (props.val.done) ? doneTaskBckgColor : standardTaskBckgColor,
                border: "1px solid black"
            }}>
                {props.val.content}
            </div>
        );
    }

    const editMenu = ()=>{
        if(!isEditMenuOpened || editMenuPos === undefined) {
            return (<></>);
        }
        return (
            <EditMenu x={editMenuPos.x} y={editMenuPos.y} 
                close={()=>{
                    setEditMenuOpen(false);
                    setEditMenuPos(undefined);
                }}
                edit={()=>{
                    setEdit(true);
                }}
                delete={()=>{
                    if(todo === undefined) return;
                    deleteTodoTicket(todo.id);
                }}
            />
        );
    }

    const ticketContent = () => {
        if(isEdit && todo !== undefined) {
            return (
                <input value={todo.content} autoFocus={true} className="todo-ticket"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>)=>{
                        setTodo({...todo, content: e.target.value});
                    }}
                    onBlur={()=> setEdit(false)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>)=>{
                        if(e.key === "Escape" || e.key === "Tab") {
                            setEdit(false);
                            setTodo(props.val);
                            return;
                        }
                        if(e.key === "Enter") {
                            updateTicket(todo.id, todo.content, todo.done);
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
                    setEditMenuOpen(true);
                    const pos = new Position(e.clientX, e.clientY);
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
                {props.val.content}
            </div>
        );
    };

    return (
        <>
            <div style={{display: "flex", backgroundColor: (todo && todo.done) ? doneTaskBckgColor : standardTaskBckgColor, border: "1px solid black"}}>
                <input type="checkbox"
                    style={{margin: "auto"}}
                    checked={(todo) ? todo.done : false}
                    onChange={()=>{
                        if(todo === undefined) return;
                        setTodo({...todo, done: !todo.done});
                        updateTicket(todo.id, todo.content, !todo.done);
                    }}
                />
                {ticketContent()}
                <button type="button" style={{width: "1.5rem", height: "1.5rem", margin: "auto"}}
                    onClick={() => {
                        if(todo === undefined) return;
                        deleteTodoTicket(todo.id);
                    }}
                >x</button>
            </div>
            {editMenu()}
        </>
    );
}

export default TodoTicket;

