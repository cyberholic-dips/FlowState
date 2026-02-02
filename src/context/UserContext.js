import React, { createContext, useState, useEffect, useContext } from 'react';
import { storage } from '../utils/storage';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [userData, setUserData] = useState({
        name: 'Alex',
        profileImage: require('../../assets/image.png')
    });

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const settings = await storage.getSettings();
        if (settings && settings.user) {
            setUserData(prev => ({
                ...prev,
                ...settings.user
            }));
        }
    };

    const updateName = async (name) => {
        const newData = { ...userData, name };
        setUserData(newData);

        // Persist
        const settings = await storage.getSettings() || {};
        await storage.saveSettings({
            ...settings,
            user: {
                name: name,
                // We aren't persisting the image path in settings nicely yet if it's dynamic, 
                // but for now it's just the name we are changing.
            }
        });
    };

    return (
        <UserContext.Provider value={{ userData, updateName }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
