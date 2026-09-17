export const safeArray = (arr) => {
    if (!arr)
        return [];
    let result = arr;
    if (typeof result === "string") {
        try {
            result = JSON.parse(result);
        }
        catch {
            try {
                result = JSON.parse(result.trim().replace(/,$/, ""));
            }
            catch {
                return [];
            }
        }
    }
    if (!Array.isArray(result))
        return [];
    const flattened = [];
    const walk = (item) => {
        if (Array.isArray(item)) {
            item.forEach(walk);
        }
        else if (item) {
            flattened.push(item);
        }
    };
    walk(result);
    return flattened;
};
export const safeObject = (obj, fallback) => {
    if (!obj)
        return fallback;
    let result = obj;
    if (typeof result === "string") {
        try {
            result = JSON.parse(result);
        }
        catch {
            return fallback;
        }
    }
    return result && typeof result === "object" && !Array.isArray(result) ? result : fallback;
};
