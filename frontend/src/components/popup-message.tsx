import React, {useEffect, useState} from 'react';
import './popup-message.scss';

export interface Option {
    name: string;
    callback?: (props?: any)=>void;
    props?: any;
}

interface Props {
    show: boolean;
    message: string;
    component?(): JSX.Element;
    options?: Option[];
    hide?(): void;
}

export interface PopupMessageInfo {
    msg: string;
    component?():  JSX.Element;
    options?: Option[];
    show: boolean;
}

function PopupMessage(props: Props) {
    useEffect(()=>{
        window.addEventListener('keydown', hideWindowEvent);
        return ()=>{
            window.removeEventListener('keydown', hideWindowEvent);
        };
    });

    const hideWindowEvent = (e: globalThis.KeyboardEvent) => {
        if(!props.show) {
            return;
        }
        if(e.key !== "Escape") {
            return;
        }
        if(props.hide) {
            props.hide();
        }
    }

    const message = props.message.split("\n").map((line: string, index: number) => (
        <div key={index} style={{textAlign: "center", margin: "auto"}}>{line}</div>
    ));

    const option = (msg?: string, callback?: (props?: any)=>void, props?: any) => {
        if(msg === undefined) {
            return (<></>);
        }
        return (
            <button className="popup-message-btn" onClick={()=>{
                if(callback) {
                    callback(props);
                }
            }}>{msg}</button>
        );
    }

    const renderOptions = () => {
        if(props.options === undefined) {
            return (<></>);
        }
        return props.options.map((val: Option, index: number) => (
            <div key={index}>
                {option(val.name, val.callback, val.props)}
            </div>
        ));
    }

    const renderComponent = () => {
        if(props.component === undefined) {
            return (<></>);
        }
        return props.component();
    }

    if(!props.show) {
        return (<></>);
    }

    return (
        <>
            <div className="popup-message">
                <div className="popup-message-message">
                    {message}
                    {renderComponent()}
                </div>
                <div className="popup-message-btn-row">
                    {renderOptions()}
                </div>
            </div>
            <div className="popup-msg-bckg-diffusion" 
                onClick={()=>{
                    if(props.hide) {
                        props.hide();
                    }
                }}
            />
        </>
    );
}

export default PopupMessage;

