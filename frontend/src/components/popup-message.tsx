import React, {useEffect, useState} from 'react';
import './popup-message.scss';

interface Props {
    show: boolean;
    message: string;
    option1?: string;
    option2?: string;
    option3?: string;

    callback1?: ()=>void;
    callback2?: ()=>void;
    callback3?: ()=>void;

    hide?(): void;
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
        <div key={index} style={{textAlign: "center"}}>{line}</div>
    ));

    const option = (msg?: string, callback?: ()=>void) => {
        if(msg === undefined) {
            return (<></>);
        }
        return (
            <button className="popup-message-btn" onClick={()=>{
                if(callback) {
                    callback();
                }
            }}>{msg}</button>
        );
    }

    if(!props.show) {
        return (<></>);
    }

    return (
        <>
            <div className="popup-message">
                <div className="popup-message-message">
                    {message}
                </div>
                <div className="popup-message-btn-row">
                    {option(props.option1, props.callback1)}
                    {option(props.option2, props.callback2)}
                    {option(props.option3, props.callback3)}
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

