import React, {useEffect, useReducer, useState} from "react";
import {useDispatch, useStore} from "react-redux";
import {Category} from "../../store/categories";
import {getDefaultBackgroundColor, getDefaultBorderColor} from "../../views/calendar/task/task";
import {RootState} from "../../store/store";
import TaskInput from '../../views/calendar/task/task-input';
import PopupMessage, {PopupMessageInfo, Option} from "../../components/popup-message";
import TaskDropdownSelect from "../../views/calendar/task/task-dropdown-select";
import { useFetchCategories } from "../../gql-client/task-category/fetch";
import { useCreateCategory } from "../../gql-client/task-category/create";
import { useUpdateCategory, useChangeCategory } from "../../gql-client/task-category/update";
import { useDeleteCategory } from "../../gql-client/task-category/delete";
import "../popup-menu/edit-menu.scss";
import "./settings-menu.scss";

interface Action {
    type: "set" | "reset" | "update-props";
}

interface SetAction extends Action {
    payload: PopupMessageInfo;
}
interface ResetAction extends Action {}
interface UpdatePropsAction extends Action {
    payload: {name: string, props: any}
}

function getSetAction(popupMessageInfo: PopupMessageInfo): SetAction {
    return {type: "set", payload: popupMessageInfo};
}

function getResetAction(): ResetAction {
    return {type: "reset"};
}

function getUpdatePropsAction(name: string, props: any): UpdatePropsAction {
    return {type: "update-props", payload: {name: name, props: props}};
}

function isSetAction(action: Action): action is SetAction {
    return action.type === "set";
}

function isResetAction(action: Action): action is ResetAction {
    return action.type === "reset";
}

function isUpdatePropsAction(action: Action): action is UpdatePropsAction {
    return action.type === "update-props";
}

function popupMsgReducer(state: PopupMessageInfo, action: Action): PopupMessageInfo {
    if(isSetAction(action)) {
        return action.payload;
    }
    if(isUpdatePropsAction(action)) {
        const val = action.payload;
        if(val === undefined) {
            return state;
        }
        const options = (state.options === undefined)
            ? undefined
            : state.options.map((option: Option) => {
                if(option.name !== val.name || option.props === undefined) {
                    return option;
                }
                return {...option, props: {...option.props, ...val.props}}
            });
        return {...state, options: options};

    }
    if(isResetAction(action)) {
        return {msg: "", show: false};
    }
    return state;
}

function SettingsMenu() {
    const [isInitialized, init] = useState(false);
    const [isOpened, setOpen] = useState(false);
    const [categories, setCategories] = useState([] as Category[]);
    const [popupMsgInfo, dispatchPopupMsg] = useReducer(popupMsgReducer, {msg: "", show: false} as PopupMessageInfo);
    const gqlFetchCategories = useFetchCategories();
    const gqlCreateCategory = useCreateCategory();
    const gqlUpdateCategory = useUpdateCategory();
    const gqlChangeCategory = useChangeCategory();
    const gqlDeleteCategory = useDeleteCategory();
    const store = useStore();

    useEffect(()=>{
        if(isInitialized) {
            return;
        }
        store.subscribe(fetchCategories);
        gqlFetchCategories();
        init(true);
    });

    const resetPopupMessageState = () => {
        dispatchPopupMsg(getResetAction());
    }

    const fetchCategories = () => {
        setCategories((store.getState() as RootState).categoryState);
    }

    const updateCategory = (category: Category) => {
        gqlUpdateCategory(category);
    }

    if(!isOpened) {
        return (
            <button className="open-btn" style={{top: "0.5rem", left: "1rem"}} onClick={()=>setOpen(true)}>
                &gt;&gt;
            </button>
        );
    }

    const changeCategoryCallback = (props?: {srcId: string, srcName: string, dest: string}) => {
        if(props === undefined) {
            return;
        }
        gqlChangeCategory(props.srcName, props.dest).then((res: boolean) => {
            if(!res) return;
            gqlDeleteCategory(props.srcId, props.srcName);
        });
        resetPopupMessageState();
    }

    const changeCategory = (id: string, src: string, options: string[]) => {
        if(options.length === 0) {
            cannotChangeCategory();
            return;
        }
        dispatchPopupMsg(getSetAction({msg: `Choose the category to which the events from category '${src}' will be assigned to?`, show: true,
            options: [
                {name: "change", callback: changeCategoryCallback, props: {srcId: id, srcName: src, dest: options[0]}},
                {name: "cancel", callback: resetPopupMessageState}
            ],
            component: () => (
                <TaskDropdownSelect style={{margin: "auto"}} options={options}
                    select={(val: string) => dispatchPopupMsg(getUpdatePropsAction("change", {dest: val}))}
                />
            )
        }));
    }

    const cannotChangeCategory = () => {
        dispatchPopupMsg(getSetAction({msg: "Cannot change category", show: true,
            options: [{name: "ok", callback: resetPopupMessageState}]
        }));
    }

    const categoriesView = categories.map((val: Category, index: number) => (
        <div key={index} className="category-row">
            <div className="category-row-header">
                <TaskInput style={{width: "%", height: "4rem", maxHeight: "4rem", lineHeight: "4rem"}} initValue={val.name}
                    setValue={(name: string) => {
                        updateCategory({...val, name: name});
                    }}
                />
            </div>
            <div className="category-bckg-select" style={{backgroundColor: val.backgroundColor}}>
                <TaskInput style={{width: "100%", height: "4rem", maxHeight: "4rem", lineHeight: "4rem"}} initValue={val.backgroundColor.toUpperCase()} maxCharacterCount={7} regexAllow={"#[0-9a-fA-F]*"}
                    setValue={(color: string) => {
                        if(color.length !== 7) {
                            return;
                        }
                        updateCategory({...val, backgroundColor: color.toUpperCase()});
                    }}
                />
            </div>
            <div className="category-border-select" style={{backgroundColor: val.borderColor}}>
                <TaskInput style={{width: "100%", height: "4rem", maxHeight: "4rem", lineHeight: "4rem"}} initValue={val.borderColor.toUpperCase()} maxCharacterCount={7} regexAllow={"#[0-9a-fA-F]*"}
                    setValue={(color: string)=>{
                        if(color.length !== 7) {
                            return;
                        }
                        updateCategory({...val, borderColor: color.toUpperCase()});
                    }}
                />
            </div>
            <div className="category-delete-btn-column">
                <button className="category-delete-btn"
                    onClick={() => {
                        dispatchPopupMsg(getSetAction({
                            msg: `Do you want to delete this category with all corresponding events
                                  or
                                  do you want to change the category of all of the assigned events and then delete the empty category?`,
                            show: true,
                            options: [
                                {name: "delete all", callback: ()=>{
                                    gqlDeleteCategory(val.id, val.name);
                                    resetPopupMessageState();
                                }},
                                {name: "change and delete", callback: () => {
                                    changeCategory(val.id, val.name, categories.map((val: Category)=>val.name).filter((name: string)=>name !== val.name));
                                }},
                                {name: "cancel", callback: resetPopupMessageState},
                            ]
                        }));
                    }}
                >X</button>
            </div>
        </div>
    ));

    return (
        <>
        <div className="side-menu" style={{display: "flex", flexFlow: "column", left: "-0.5rem"}}>
            <button className="open-btn" style={{position: "absolute", right: "1rem"}} onClick={()=>setOpen(false)}>&lt;&lt;</button>
            <h3 style={{margin: "1rem auto"}}>Categories:<button className="add-category-btn"
                onClick={()=>{
                    gqlCreateCategory({id: "", name: "", backgroundColor: getDefaultBackgroundColor(), borderColor: getDefaultBorderColor()});
                }}
            >+</button></h3>
            <div className="category-row">
                <div className="category-row-header"><b>name:</b></div>
                <div className="category-bckg-select"><b>background color:</b></div>
                <div className="category-border-select"><b>border color:</b></div>
            </div>
            {categoriesView}
        </div>
        <PopupMessage show={popupMsgInfo.show} message={popupMsgInfo.msg}
            component={popupMsgInfo.component}
            options={popupMsgInfo.options}
            hide={()=>resetPopupMessageState()}
        />
        </>
    );
}

export default SettingsMenu;

