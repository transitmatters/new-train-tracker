export const getInitialDataByKey = (key) => {
    const { __NTT_INITIAL_DATA__ } = window;
    if (__NTT_INITIAL_DATA__ && __NTT_INITIAL_DATA__[key]) {
        return __NTT_INITIAL_DATA__[key];
    }
    return null;
};
