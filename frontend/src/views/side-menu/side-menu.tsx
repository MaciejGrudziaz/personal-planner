import React, {useEffect, useState, useRef, RefObject} from 'react';
import {useStore, useDispatch} from 'react-redux';
import {RootState} from '../../store/store';
import {TodoGroup as TodoGroupState, TodoTicket as TodoTicketState, sortGroups, createGroup} from '../../store/todos';
import {Position} from '../calendar/task';
import TodoGroup from './todo-group';
import FloatingTextInput from './floating-text-input';
import './side-menu.scss';

function SideMenu() {
    const [isOpened, setOpen] = useState(false);
    const [isInitialized, setInit] = useState(false);
    const [todoGroups, setTodoGroups] = useState([] as TodoGroupState[]);
    const [showGroupInput, setShowGroupInput] = useState(false);
    const menuRef = useRef() as RefObject<HTMLDivElement>;
    const headerRef = useRef() as RefObject<HTMLDivElement>;
    const store = useStore();
    const dispatch = useDispatch();

    useEffect(()=>{
        if(isInitialized) { return; }

        const el = menuRef.current;
        if(el === undefined || el === null) { return; }

        store.subscribe(fetchTodos);
        fetchTodos();

        setInit(true);
    });

    const fetchTodos = () => {
        console.log("fetch todo groups");
        setTodoGroups(sortGroups((store.getState() as RootState).todosState.content));
    };

    const groups = ()=> todoGroups.map((todo: TodoGroupState)=>(
        <TodoGroup key={todo.ordinal} val={todo} />
    ));

    if(!isOpened) {
        return (
            <button className="open-btn" style={{position: "fixed", top: "1rem", right: "1rem"}}
                onClick={()=>setOpen(true)}>&lt;&lt;</button>
        );
    }

    const groupFloatingInput = ()=>{
        const el = headerRef.current;
        if(!showGroupInput || el === undefined || el === null) {
            return (<></>);
        }

        const boundingRect = el.getBoundingClientRect();
        let x = boundingRect.left;
        let y = boundingRect.top + 0.75 * boundingRect.height;

        return (
            <FloatingTextInput x={x} y={y} width={"calc(25% - 4.5rem)"} marginLeft={"2rem"} marginRight={"2rem"}
                close={()=>setShowGroupInput(false)}
                save={(val: string)=>{
                    const ordinal = (todoGroups.length === 0) ? 0 : todoGroups[todoGroups.length - 1].ordinal + 1;
                    dispatch(createGroup({groupId: Date.now().toFixed(),  ordinal: ordinal, name: val}));
                }}
            />
        );
    };

    return (
        <div className="side-menu" ref={menuRef}>
            <button className="open-btn" onClick={()=>setOpen(false)}>&gt;&gt;</button>
            <div style={{display: "flex"}} ref={headerRef}>
                <div style={{margin: "auto", display: "flex", alignItems: "center"}}>
                    <h3>todo:</h3>
                    <button type="button" style={{width: "1.5rem", height: "1.5rem", marginLeft: "1rem"}} onClick={()=>setShowGroupInput(true)}>+</button>
                </div>
            </div>
            {groups()}
            {groupFloatingInput()}
        </div>
    );
}

export default SideMenu;

