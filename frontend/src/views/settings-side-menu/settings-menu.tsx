import React, {useEffect, useState} from "react";
import {useDispatch, useStore} from "react-redux";
import {Category, updateBackgroundColor, updateBorderColor, updateName, createCategory} from "../../store/categories";
import {getDefaultBackgroundColor, getDefaultBorderColor} from "../../views/calendar/task/task";
import {RootState} from "../../store/store";
import TaskInput from '../../views/calendar/task/task-input';
import "../popup-menu/edit-menu.scss";
import "./settings-menu.scss";

function SettingsMenu() {
    const [isInitialized, init] = useState(false);
    const [isOpened, setOpen] = useState(false);
    const [categories, setCategories] = useState([] as Category[]);
    const dispatch = useDispatch();
    const store = useStore();

    useEffect(()=>{
        if(isInitialized) {
            return;
        }
        store.subscribe(fetchCategories);
        fetchCategories();
        init(true);
    });

    const fetchCategories = () => {
        setCategories((store.getState() as RootState).categoryState);
    }

    if(!isOpened) {
        return (
            <button className="open-btn" style={{top: "0.5rem", left: "1rem"}}
                onClick={()=>setOpen(true)}>&gt;&gt;</button>
        );
    }

    const categoriesView = categories.map((val: Category, index: number) => (
        <div key={index} className="category-row">
            <div className="category-row-header">
                <TaskInput style={{height: "4rem", maxHeight: "4rem", lineHeight: "4rem"}} initValue={val.name}
                    setValue={(name: string) => {
                        dispatch(updateName({oldName: val.name, newName: name}));
                    }}
                />
            </div>
            <div className="category-bckg-select" style={{backgroundColor: val.backgroundColor}}>
                <TaskInput style={{height: "4rem", maxHeight: "4rem", lineHeight: "4rem"}} initValue={val.backgroundColor} maxCharacterCount={7} regexAllow={"#[0-9a-fA-F]*"}
                    setValue={(color: string) => {
                        if(color.length !== 7) {
                            return;
                        }
                        dispatch(updateBackgroundColor({name: val.name, color: color}));
                    }}
                />
            </div>
            <div className="category-border-select" style={{backgroundColor: val.borderColor}}>
                <TaskInput style={{height: "4rem", maxHeight: "4rem", lineHeight: "4rem"}} initValue={val.borderColor} maxCharacterCount={7} regexAllow={"#[0-9a-fA-F]*"}
                    setValue={(color: string)=>{
                        if(color.length !== 7) {
                            return;
                        }
                        dispatch(updateBorderColor({name: val.name, color: color}));
                    }}
                />
            </div>
        </div>
    ));

    return (
        <div className="side-menu" style={{display: "flex", flexFlow: "column", left: "-0.5rem"}}>
            <button className="open-btn" style={{position: "absolute", right: "1rem"}} onClick={()=>setOpen(false)}>&lt;&lt;</button>
            <h3 style={{margin: "1rem auto"}}>Categories:<button className="add-category-btn"
                onClick={()=>{
                    dispatch(createCategory({name: "", backgroundColor: getDefaultBackgroundColor(), borderColor: getDefaultBorderColor()}));
                }}
            >+</button></h3>
            <div className="category-row">
                <div className="category-row-header"><b>name:</b></div>
                <div className="category-bckg-select"><b>background color:</b></div>
                <div className="category-border-select"><b>border color:</b></div>
            </div>
            {categoriesView}
        </div>
    );
}

export default SettingsMenu;

