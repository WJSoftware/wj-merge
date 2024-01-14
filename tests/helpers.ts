export async function tryCatchError(fn: Function) {
    try {
        await fn();
    }
    catch (e) {
        return e;
    }
    return null;
}
