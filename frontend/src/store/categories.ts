import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Category {
    id: string;
    name: string;
    backgroundColor: string;
    borderColor: string;
}

const initialState = [
//    {name: "simple", backgroundColor: "#e9c46a", borderColor: "#926F16"},
//    {name: "important", backgroundColor: "#e76f51", borderColor: "#621E0D"}
] as Category[];

export const categoriesSlice = createSlice({
    name: "categories",
    initialState,
    reducers: {
        setCategories: (state, action: PayloadAction<Category[]>) => {
            return action.payload;
        },
        updateCategory: (state, action: PayloadAction<Category>) => {
            const category = action.payload;
            return state.map((val: Category) => {
                if(val.id !== category.id) {
                    return val;
                }
                return category;
            });
        },
        addCategory: (state, action: PayloadAction<Category>) => {
            const category = action.payload;
            return state.concat([category]);
        },
        deleteCategory: (state, action: PayloadAction<{id?: string, name?: string}>) => {
            const id = action.payload.id;
            const name = action.payload.name;
            return state.filter((val: Category) => {
                if(id !== undefined) {
                    return val.id !== id;
                }
                if(name !== undefined) {
                    return val.name !== name;
                }
                return true;
            });
        }
    }
});

export const { setCategories, updateCategory, addCategory, deleteCategory } = categoriesSlice.actions;

export default categoriesSlice.reducer;

