import { createContext, useContext } from 'react';

export const AppDataContext = createContext();

export const useMockData = () => useContext(AppDataContext);

export default AppDataContext;
