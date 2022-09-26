import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import TodoGroup from '../views/side-menu/todo-group';

export interface TodoTicket {
    priority: number;
    id: string;
    content: string;
    done: boolean;
}

export interface TodoGroup {
    ordinal: number;
    id: string;
    name: string;
    tickets: TodoTicket[];
}

export interface TodoState {
    content: TodoGroup[];
}

export function sortTickets(tickets: TodoTicket[]): TodoTicket[] {
    return [...tickets].sort((lhs: TodoTicket, rhs: TodoTicket) => lhs.priority - rhs.priority);
}

export function sortGroups(groups: TodoGroup[]): TodoGroup[] {
    return [...groups].sort((lhs: TodoGroup, rhs: TodoGroup) => lhs.ordinal - rhs.ordinal);
}

const initialState = { content: [] } as TodoState;

interface Args {
    groupId?: string;
    ordinal?: number;
    name?: string;
    ticketId?: string;
    priority?: number;
    content?: string;
    done?: boolean;
    direction?: "up" | "down";
}

export const todosSlice = createSlice({
    name: "todos",
    initialState,
    reducers: {
        setGroups: (state: TodoState, action: PayloadAction<TodoGroup[]>) => {
            return {content: action.payload};
        },
        createGroup: (state: TodoState, action: PayloadAction<Args>) => {
            const groupId = action.payload.groupId;
            const groupOrdinal = action.payload.ordinal;
            const groupName = action.payload.name;
            if(groupId === undefined || groupOrdinal === undefined || groupName === undefined) {
                return state;
            }
            return {content: state.content.concat([{id: groupId, ordinal: groupOrdinal, name: groupName, tickets: []}])};
        },
        modifyGroup: (state: TodoState, action: PayloadAction<Args>) => {
            const groupId = action.payload.groupId;
            const name = action.payload.name;
            const ordinal = action.payload.ordinal;
            if(groupId === undefined || (name === undefined && ordinal === undefined)) {
                return state;
            }
            return {content: state.content.map((val: TodoGroup) => {
                    if(val.id !== groupId) {
                        return val;
                    }
                    return {...val,
                        name: (name !== undefined) ? name : val.name,
                        ordinal: (ordinal !== undefined) ? ordinal : val.ordinal
                    };
                }
            )};
        },
        deleteGroup: (state: TodoState, action: PayloadAction<Args>) => {
            const groupId = action.payload.groupId;
            if(groupId === undefined) {
                return state;
            }
            return {content: state.content.filter((val: TodoGroup) => val.id !== groupId)};
        },
        createTicket: (state: TodoState, action: PayloadAction<Args>) => {
            const content = action.payload.content;
            const priority = action.payload.priority;
            const ticketId = action.payload.ticketId;
            const groupId = action.payload.groupId;
            if(groupId === undefined || ticketId === undefined) {
                return state;
            }
            return {
                content: state.content.map((val: TodoGroup) => {
                    if(val.id !== groupId) {
                        return val;
                    }
                    return {...val, 
                        tickets: val.tickets.concat([{
                            id: ticketId,
                            content: (content !== undefined) ? content : "",
                            priority: (priority !== undefined) ? priority : 0,
                            done: false
                        }])
                    };
                })
            };
        },
        modifyTicket: (state: TodoState, action: PayloadAction<Args>) => {
            const ticketId = action.payload.ticketId;
            const content = action.payload.content;
            const done = action.payload.done;
            const priority = action.payload.priority;
            if(ticketId === undefined || (content === undefined && done === undefined && priority === undefined)) {
                return state;
            }
            return {
                content: state.content.map((val: TodoGroup) => {
                    const idx = val.tickets.findIndex((ticket: TodoTicket) => ticket.id === ticketId);
                    if(idx === -1) {
                        return val;
                    }
                    return {...val, tickets: val.tickets.map((ticket: TodoTicket) => {
                        if(ticket.id !== ticketId) {
                            return ticket;
                        }
                        return {...ticket, 
                            content: (content !== undefined) ? content : ticket.content, 
                            done: (done !== undefined) ? done : ticket.done,
                            priority: (priority !== undefined) ? priority : ticket.priority
                        };
                    })};
                })
            };
        },
        deleteTicket: (state: TodoState, action: PayloadAction<Args>) => {
            const ticketId = action.payload.ticketId;
            if(ticketId === undefined) {
                return state;
            }
            return {
                content: state.content.map((val: TodoGroup) => {
                    const idx = val.tickets.findIndex((ticket: TodoTicket) => ticket.id === ticketId);
                    if(idx === -1) {
                        return val;
                    }
                    return {...val, tickets: val.tickets.filter((ticket: TodoTicket) => ticket.id !== ticketId)};
                })
            };
        }
    }
});

export const { setGroups, createGroup, modifyGroup, deleteGroup, createTicket, modifyTicket, deleteTicket } = todosSlice.actions;

export default todosSlice.reducer;

