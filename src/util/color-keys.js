export function getRGBAKey(r, g, b, a = 255) {
    return `R${r}G${g}B${b}A${a}`;
}

export function getRGBKey(r, g, b) {
    return `R${r}G${g}B${b}`;
}