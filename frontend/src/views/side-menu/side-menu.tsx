import React, {useEffect, useState, useRef, RefObject} from 'react';
import {useStore} from 'react-redux';
import {RootState} from '../../store/store';
import {TodoGroup as TodoGroupState, TodoTicket as TodoTicketState, sortGroups} from '../../store/todos';
import {useFetchTodoGroups} from '../../gql-client/todos/fetch';
import { useCreateTodoGroup } from '../../gql-client/todos/create';
import { useDeleteTodoGroup } from '../../gql-client/todos/delete';
import TodoGroup from './todo-group';
import FloatingTextInput from './floating-text-input';
import PopupMessage, { PopupMessageInfo } from '../../components/popup-message';
import './side-menu.scss';

function SideMenu() {
    const [isOpened, setOpen] = useState(false);
    const [isInitialized, setInit] = useState(false);
    const [todoGroups, setTodoGroups] = useState([] as TodoGroupState[]);
    const [showGroupInput, setShowGroupInput] = useState(false);
    const [popupMsgInfo, setPopupMsgInfo] = useState({msg: "", show: false} as PopupMessageInfo);
    const menuRef = useRef() as RefObject<HTMLDivElement>;
    const headerRef = useRef() as RefObject<HTMLDivElement>;
    const fetchTodos = useFetchTodoGroups();
    const createTodoGroup = useCreateTodoGroup();
    const deleteTodoGroup = useDeleteTodoGroup();
    const store = useStore();

    useEffect(()=>{
        if(isInitialized) { return; }

        const el = menuRef.current;
        if(el === undefined || el === null) { return; }

        store.subscribe(fetchTodosFromStore);
        fetchTodos().then(() => fetchTodosFromStore());

        setInit(true);
    });

    const resetPopupMessageState = () => {
        setPopupMsgInfo({msg: "", show: false});
    };

    const fetchTodosFromStore = () => {
        setTodoGroups(sortGroups((store.getState() as RootState).todosState.content));
    };

    const groups = ()=> todoGroups.map((todo: TodoGroupState)=>(
        <TodoGroup key={todo.ordinal} val={todo} 
            deleteGroup={(id: string) => {
                setPopupMsgInfo({msg: "Do you want to delete the full todo group?", show: true,
                    options: [
                        {name: "ok", callback: () => { 
                            deleteTodoGroup(id);
                            resetPopupMessageState();
                        }},
                        {name: "cancel", callback: resetPopupMessageState}
                    ]
                });
            }}
        />
    ));

    if(!isOpened) {
        return (
            <button className="open-btn" style={{position: "fixed", top: "0.5rem", right: "1rem"}}
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
                    createTodoGroup(val, ordinal);
                }}
            />
        );
    };

    return (
        <>
        <div className="side-menu" style={{right: "-0.5rem"}} ref={menuRef}>
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
        <PopupMessage
            message={popupMsgInfo.msg}
            show={popupMsgInfo.show}
            options={popupMsgInfo.options}
            hide={resetPopupMessageState}
        />
        </>
    );
}

export default SideMenu;

