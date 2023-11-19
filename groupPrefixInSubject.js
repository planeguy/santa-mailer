export function groupPrefixInSubject(originalSubject="", prefix=""){
    if(originalSubject.indexOf(`[${prefix}]`)>=0) return originalSubject;
    return `[${prefix}] ${originalSubject}`;
}