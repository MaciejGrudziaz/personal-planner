import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import weekViewReducer from './week-view';

export const store = configureStore({
  reducer: {
    weekViewState: weekViewReducer,
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
