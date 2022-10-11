import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Category {
    name: string;
    backgroundColor: string;
    borderColor: string;
}

const initialState = [
    {name: "simple", backgroundColor: "#e9c46a", borderColor: "#926F16"},
    {name: "important", backgroundColor: "#e76f51", borderColor: "#621E0D"}
] as Category[];

export const categoriesSlice = createSlice({
    name: "categories",
    initialState,
    reducers: {
        updateBackgroundColor: (state, action: PayloadAction<{name: string, color: string}>) => {
            const name = action.payload.name;
            const color = action.payload.color;
            return state.map((val: Category) => {
                if(val.name === name) {
                    return {...val, backgroundColor: color};
                }
                return val;
            });
        },
        updateBorderColor: (state, action: PayloadAction<{name: string, color: string}>) => {
            const name = action.payload.name;
            const color = action.payload.color;
            return state.map((val: Category) => {
                if(val.name === name) {
                    return {...val, borderColor: color};
                }
                return val;
            });
        },
        updateName: (state, action: PayloadAction<{oldName: string, newName: string}>) => {
            const oldName = action.payload.oldName;
            const newName = action.payload.newName;
            return state.map((val: Category) => {
                if(val.name === oldName) {
                    return {...val, name: newName};
                }
                return val;
            });
        },
        createCategory: (state, action: PayloadAction<{name: string, backgroundColor: string, borderColor: string}>) => {
            return state.concat([{name: action.payload.name, backgroundColor: action.payload.backgroundColor, borderColor: action.payload.borderColor}]);
        }
    }
});

export const { updateBackgroundColor, updateBorderColor, updateName, createCategory } = categoriesSlice.actions;

export default categoriesSlice.reducer;

