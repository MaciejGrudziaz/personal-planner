import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import tasksReducer from './tasks';
import configReducer from './config';
import todosReducer from './todos';
import categoriesReducer from './categories';

export const store = configureStore({
  reducer: {
    tasksState: tasksReducer,
    configState: configReducer,
    todosState: todosReducer,
    categoryState: categoriesReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
