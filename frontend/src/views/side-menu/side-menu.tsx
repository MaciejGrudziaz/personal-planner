import React, {useEffect, useState, useRef, RefObject} from 'react';
import {useStore, useDispatch} from 'react-redux';
import {RootState} from '../../store/store';
import {TodoGroup as TodoGroupState, sortGroups} from '../../store/todos';
import {Position} from '../calendar/task';
import TodoGroup from './todo-group';
import './side-menu.scss';

function SideMenu() {
    const [isOpened, setOpen] = useState(false);
    const [basePos, setBasePos] = useState(undefined as Position | undefined);
    const [isInitialized, setInit] = useState(false);
    const [todoGroups, setTodoGroups] = useState([] as TodoGroupState[]);
    const ref = useRef() as RefObject<HTMLDivElement>;
    const store = useStore();

    useEffect(()=>{
        if(isInitialized) { return; }

        const el = ref.current;
        if(el === undefined || el === null) { return; }
        setBasePos(new Position(el.offsetLeft, el.offsetTop));

        store.subscribe(fetchTodos);
        fetchTodos();

        setInit(true);
    });

    const fetchTodos = () => {
        setTodoGroups(sortGroups((store.getState() as RootState).todosState.content));
    };

    const groups = todoGroups.map((todo: TodoGroupState)=>(
        <TodoGroup key={todo.ordinal} val={todo} basePos={basePos} />
    ));

    if(!isOpened) {
        return (
            <button className="open-btn" style={{position: "fixed", top: "1rem", right: "1rem"}}
                onClick={()=>setOpen(true)}>&lt;&lt;</button>
        );
    }

    return (
        <div className="side-menu" ref={ref}>
            <button className="open-btn" onClick={()=>setOpen(false)}>&gt;&gt;</button>
            <div style={{display: "flex"}}>
                <div style={{margin: "auto", display: "flex", alignItems: "center"}}>
                    <h3>todo:</h3>
                    <button type="button" style={{width: "1.5rem", height: "1.5rem", marginLeft: "1rem"}}>+</button>
                </div>
            </div>
            {groups}
        </div>
    );
}

export default SideMenu;

