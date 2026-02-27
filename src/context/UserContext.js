import React, { createContext, useState, useEffect, useContext } from 'react';
import { storage } from '../utils/storage';

const UserContext = createContext();
const AVATAR_SOURCES = {
    1: require('../../assets/avatars/avatar-1.png'),
    2: require('../../assets/avatars/avatar-2.png'),
    3: require('../../assets/avatars/avatar-3.png'),
    4: require('../../assets/avatars/avatar-4.png'),
    5: require('../../assets/avatars/avatar-5.png'),
    6: require('../../assets/avatars/avatar-6.png'),
    7: require('../../assets/avatars/avatar-7.png'),
    8: require('../../assets/avatars/avatar-8.png'),
    9: require('../../assets/avatars/avatar-9.png'),
    10: require('../../assets/avatars/avatar-10.png'),
    11: require('../../assets/avatars/avatar-11.png'),
    12: require('../../assets/avatars/avatar-12.png'),
    13: require('../../assets/avatars/avatar-13.png'),
    14: require('../../assets/avatars/avatar-14.png'),
    15: require('../../assets/avatars/avatar-15.png'),
    16: require('../../assets/avatars/avatar-16.png'),
};

const DEFAULT_AVATAR_ID = 1;

const getAvatarSource = (avatarId) => AVATAR_SOURCES[avatarId] || AVATAR_SOURCES[DEFAULT_AVATAR_ID];

export const AVATAR_OPTIONS = Object.keys(AVATAR_SOURCES).map((key) => {
    const id = Number(key);
    return { id, source: AVATAR_SOURCES[id] };
});

export const UserProvider = ({ children }) => {
    const [userData, setUserData] = useState({
        name: 'Alex',
        avatarId: DEFAULT_AVATAR_ID,
        profileImage: getAvatarSource(DEFAULT_AVATAR_ID),
    });
    const [isUserLoading, setIsUserLoading] = useState(true);
    const [userError, setUserError] = useState(null);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        setIsUserLoading(true);
        setUserError(null);
        try {
            const settings = await storage.getSettings();
            if (settings && settings.user) {
                const avatarId = settings.user.avatarId || DEFAULT_AVATAR_ID;
                setUserData(prev => ({
                    ...prev,
                    ...settings.user,
                    avatarId,
                    profileImage: getAvatarSource(avatarId),
                }));
            }
        } catch (error) {
            setUserError('Could not load profile data.');
        } finally {
            setIsUserLoading(false);
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
                avatarId: newData.avatarId || DEFAULT_AVATAR_ID,
            }
        });
    };

    const updateAvatar = async (avatarId) => {
        const nextAvatarId = AVATAR_SOURCES[avatarId] ? avatarId : DEFAULT_AVATAR_ID;
        const newData = {
            ...userData,
            avatarId: nextAvatarId,
            profileImage: getAvatarSource(nextAvatarId),
        };
        setUserData(newData);

        const settings = await storage.getSettings() || {};
        await storage.saveSettings({
            ...settings,
            user: {
                name: newData.name,
                avatarId: nextAvatarId,
            }
        });
    };

    return (
        <UserContext.Provider value={{ userData, updateName, updateAvatar, avatarOptions: AVATAR_OPTIONS, isUserLoading, userError, reloadUser: loadUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
