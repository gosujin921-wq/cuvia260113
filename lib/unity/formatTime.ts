export function formatCustomTimestamp(timestamp: string): string {
    // 예: 20260227T143150.052

    if (!timestamp || !timestamp.includes("T")) {
        throw new Error("Invalid timestamp format");
    }

    const [datePart, timePartWithMs] = timestamp.split("T");

    const year = datePart.slice(0, 4);
    const month = datePart.slice(4, 6);
    const day = datePart.slice(6, 8);

    const timePart = timePartWithMs.split(".")[0]; // 밀리초 제거

    const hour = timePart.slice(0, 2);
    const minute = timePart.slice(2, 4);
    const second = timePart.slice(4, 6);

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}
