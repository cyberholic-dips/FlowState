export const getFloatingTabBarStyle = (theme) => ({
    position: 'absolute',
    bottom: 22,
    left: 16,
    right: 16,
    elevation: 6,
    backgroundColor: theme.tabBar,
    borderRadius: 30,
    height: 70,
    shadowColor: theme.mode === 'dark' ? '#000' : '#475569',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderTopWidth: 1,
    borderTopColor: theme.glassBorder,
});

export const TAB_BAR_ITEM_STYLE = {
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
};
