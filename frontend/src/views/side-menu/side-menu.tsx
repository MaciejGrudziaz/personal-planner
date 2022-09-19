import React, {useEffect, useState} from 'react';
import {useStore, useDispatch} from 'react-redux';
import {RootState} from '../../store/store';
import {TodoGroup as TodoGroupState, sortGroups} from '../../store/todos';
import TodoGroup from './todo-group';
import './side-menu.scss';

function SideMenu() {
    const [isOpened, setOpen] = useState(false);
    const store = useStore();

    const groups = sortGroups((store.getState() as RootState).todosState.content).map((todo: TodoGroupState)=>(
        <TodoGroup key={todo.ordinal} val={todo} />
    ));

    if(!isOpened) {
        return (
            <button className="open-btn" style={{position: "fixed", top: "1rem", right: "1rem"}}
                onClick={()=>setOpen(true)}>&lt;&lt;</button>
        );
    }

    return (
        <div className="side-menu">
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

