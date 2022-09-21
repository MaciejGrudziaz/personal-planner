import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import TodoGroup from '../views/side-menu/todo-group';

export interface TodoTicket {
    priority: number;
    id: string;
    text: string;
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

const initialState = {
    content: [
        {ordinal: 0, id: "todo0", name: "tasks", tickets: [
            {priority: 0, id: "ticket0", text: "first ticket", done: false},
            {priority: -1, id: "ticket2", text: "other ticket", done: false}
        ]}, 
        {ordinal: 1, id: "todo1", name: "job", tickets: [
            {priority: 0, id: "ticket1", text: "second ticket", done: false},
        ]}
    ]
} as TodoState;

interface Args {
    groupId?: string;
    ordinal?: number;
    name?: string;
    ticketId?: string;
    priority?: number;
    ticket?: TodoTicket;
    direction?: "up" | "down";
}

export const todosSlice = createSlice({
    name: "todos",
    initialState,
    reducers: {
        createGroup: (state: TodoState, action: PayloadAction<Args>) => {
            const groupId = action.payload.groupId;
            const groupOrdinal = action.payload.ordinal;
            const groupName = action.payload.name;
            if(groupId === undefined || groupOrdinal === undefined || groupName === undefined) {
                return state;
            }
            return {content: state.content.concat([{id: groupId, ordinal: groupOrdinal, name: groupName, tickets: []}])};
        },
        moveGroup: (state: TodoState, action: PayloadAction<Args>) => {
            console.log("moveGroup action");
            const groupId = action.payload.groupId;
            const direction = action.payload.direction;
            if(groupId === undefined || direction === undefined) {
                return state;
            }
            const sortedGroups = [...state.content].sort((lhs: TodoGroup, rhs: TodoGroup) => lhs.ordinal - rhs.ordinal);
            const id = sortedGroups.findIndex((val: TodoGroup) => val.id === groupId);
            if(id === -1) {
                return state;
            }
            if((direction === "up" && id === 0) || (direction === "down" && id === sortedGroups.length - 1)) {
                return state;
            }
            const newOrdinal = (direction === "up") ? sortedGroups[id - 1].ordinal - 1 : sortedGroups[id + 1].ordinal + 1;
            return {content: state.content.map((val: TodoGroup) => {
                if(val.id === groupId) {
                    return {...val, ordinal: newOrdinal};
                }
                if(direction === "up" && val.ordinal <= newOrdinal) {
                    return {...val, ordinal: val.ordinal - 1};
                }
                if(direction === "down" && val.ordinal >= newOrdinal) {
                    return {...val, ordinal: val.ordinal + 1};
                }
                return val;
            })};
        },
        renameGroup: (state: TodoState, action: PayloadAction<Args>) => {
            const groupId = action.payload.groupId;
            const name = action.payload.name;
            if(groupId === undefined || name === undefined) {
                return state;
            }
            return {content: state.content.map((val: TodoGroup) => (val.id !== groupId) ? val : {...val, name: name})};
        },
        deleteGroup: (state: TodoState, action: PayloadAction<Args>) => {
            const groupId = action.payload.groupId;
            if(groupId === undefined) {
                return state;
            }
            return {content: state.content.filter((val: TodoGroup) => val.id !== groupId)};
        },
        createTicket: (state: TodoState, action: PayloadAction<Args>) => {
            const ticket = action.payload.ticket;
            const groupId = action.payload.groupId;
            if(groupId === undefined || ticket === undefined || ticket.id === "") {
                return state;
            }
            return {
                content: state.content.map((val: TodoGroup) => {
                    if(val.id !== groupId) {
                        return val;
                    }
                    return {...val, tickets: val.tickets.concat([ticket])};
                })
            };
        },
        moveTicket: (state: TodoState, action: PayloadAction<Args>) => {
            const ticketId = action.payload.ticketId;
            const priority = action.payload.priority;
            const groupId = action.payload.groupId;

            if(ticketId === undefined || priority === undefined || groupId === undefined) {
                return state;
            }

            return {
                content: state.content.map((val: TodoGroup) => {
                    if(val.id !== groupId) {
                        return val;
                    }
                    return {...val, tickets: val.tickets.map((ticket: TodoTicket) => {
                        if(ticket.id === ticketId) {
                            return {...ticket, priority: priority };
                        }
                        if(ticket.priority <= priority) {
                            return {...ticket, priority: ticket.priority - 1};
                        }
                        return ticket;
                    })}
                })
            };
        },
        modifyTicket: (state: TodoState, action: PayloadAction<Args>) => {
            const modifiedTicket = action.payload.ticket;
            const groupId = action.payload.groupId;
            if(modifiedTicket === undefined || groupId === undefined) {
                return state;
            }
            console.log("delete ticket");
            return {
                content: state.content.map((val: TodoGroup) => {
                    if (val.id !== groupId) {
                        return val;
                    }
                    return {...val, tickets: val.tickets.map((ticket: TodoTicket) => {
                        if(ticket.id !== modifiedTicket.id) {
                            return ticket;
                        }
                        return modifiedTicket;
                    })};
                })
            };
        },
        deleteTicket: (state: TodoState, action: PayloadAction<Args>) => {
            const groupId = action.payload.groupId;
            const ticketId = action.payload.ticketId;
            if(groupId === undefined || ticketId === undefined) {
                return state;
            }
            return {
                content: state.content.map((val: TodoGroup) => {
                    if(val.id !== groupId) {
                        return val;
                    }
                    return {...val, tickets: val.tickets.filter((ticket: TodoTicket) => ticket.id !== ticketId)};
                })
            };
        }
    }
});

export const { createGroup, moveGroup, renameGroup, deleteGroup, createTicket, moveTicket, modifyTicket, deleteTicket } = todosSlice.actions;

export default todosSlice.reducer;

