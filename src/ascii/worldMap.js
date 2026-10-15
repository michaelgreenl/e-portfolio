// Land and sea on a 2° grid, rasterized from Natural Earth's 1:110m land polygons (public domain), with the
// polar cap south of 80°S filled in. Rows run from 90°N to 90°S and columns from 180°W to 180°E; each bit
// is one cell, set for land, in row order from the lowest bit of each byte.
const LAND =
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOA/AP8BAAAA' +
    'AAAAAAAAAAAAAAAAAAD8/////wcAAAAAAAAGAAAAAAAAAAAAgP/4//8PAPAAAAAAwAIAAAAAAAAAQADAh////wAABAAAAABgAAAAAAAAAABw' +
    'ER8A/v8PAAAAAAwA/D8AOAAAAAAA8JHtB8D/fwAAAAAgIPz//wMBAACAAQD4w/4D+P8HAAAcAAD7/////x8APP4HAP9P/v/+////A+AvmAAA' +
    'AAAAAIAPAAAAAOCBB+D//x8ALAAEAAAAAAAAIPz///+f33kfv/P/z////////////wPw/////wAc4AEAAHz+//////////9/gP////8HeAAc' +
    'AADg5////////////ADgAf7/f4AvAAAAAH78////////H0QAAAiA//8f8AcAAIBB4////////38ABwAAAPD//5//AQAAFAT/////////A3AA' +
    'AAAA/P//+T8AAGDz//////////8DAwAAAMD/////AwAA8P//////////LwAAAAAA+P///2EAAAD+//////////8CAAAAAAD///8/AAAA4P//' +
    '////////JwAAAAAA8P///wcAAAD+/uHz/////z8AAAAAAAD///8HAAAA/JgPPP//////MQAAAAAA8P//PwAAAMAH8v/n/////wcBAAAAAAD/' +
    '//8BAAAAPgD7f/7///8xEAAAAAAA4P//DwAAAMBhAP/n////f4YAAAAAAAD8//8AAAAA+AcA//////8jDwAAAAAAgP//AwAAAMD/APD/////' +
    'PwgAAAAAAADw/x8AAAAA/n////////8HAAAAAAAAAPwDAwAAAOD////7////fwAAAAAAAACgHyAAAACA//9/f/7///8DAAAAAAAAAPQBAAAA' +
    'APj//+cv+P//HwAAAAAAAAAAHgAAAADA/////g////8AAAAAAAAAAOAhCAAAAPz//99/4D//AAAAAAAAAAAAPAMEAADA////+Qf84BcAAAAA' +
    'AAAAAAA/AAAAAPz//58fgAf+QAAAAAAAAAAAAA8AAADg////ewA4gA8EAAAAAAAAAADAAAAAAPz///8BgAP4AQAAAAAAAAAAAAgOAADA////' +
    'TwAwAAwAAAAAAAAAAAAA8Q8AAPj///8HAAEIAAEAAAAAAAAAAID/AQAA////fwBAAAEQAAAAAAAAAAAA+P8AAGDh//8DAAA0GAAAAAAAAAAA' +
    'AID/HwAAAPj/HwAAgMIBAAAAAAAAAAAA/P8BAACA//8AAAA4HgAAAAAAAAAAAMD/fwAAAPz/BwAAAOMBAQAAAAAAAAAA/P8/AACA/z8AAABg' +
    'TPABAAAAAAAAAOD//w8AAPD/AwAAAAQAfAAAAAAAAAAA/P//AQAA/z8AAACAA4APAAAAAAAAAID//w8AAOD/AwAAAAAAgAAAAAAAAAAA+P//' +
    'AAAA/j8AAAAAAAAAAAAAAAAAAAD//wcAAPD/QwAAAACAIwAAAAAAAAAA8P9/AAAA/z8EAAAAAD8GAAAAAAAAAAD8/wMAAPD/cQAAAAD4fwAA' +
    'AAAAAAAAgP8/AAAA/w8HAAAAgP8HAAAAAAAAAAD4/wMAAOD/MAAAAAD//wEAAAAAAAAAgP8fAAAA/g8DAAAA+P8fAAAAAAAAAAD4PwAAAOB/' +
    'EAAAAID//wMAAAAAAAAAgP8DAAAA/AMAAAAA+P9/AAAAAAAAAAD8HwAAAMA/AAAAAID//wcAAAAAAAAAwP8BAAAA+AEAAAAA8P8/AAAAAAAA' +
    'AAD8DwAAAIAPAAAAAAAP/gMAAAAAAAAAwB8AAAAAAAAAAAAAAIAfAAAAAAAAAAD+AwAAAAAAAAAAAAAA8AEgAAAAAAAA4AcAAAAAAAAAAAAA' +
    'AAAAAAYAAAAAAAA+AAAAAAAAAAAAAAAAgAAQAAAAAAAA4AMAAAAAAAAAAAAAAAAIgAEAAAAAAAAeAAAAAAAAAAAAAAAAAAAMAAAAAAAA4AEA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAPAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAwAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAB4AGDwn/8HAAAAAAAA' +
    'AAAwAAAAAACA/P/h/////w8AAAAAAAAAwAcAAAD4////z///////PwAAAAAAGAL8AACA//////////////8HAAD4/+///wMAAP7/////////' +
    '////HwAA+P////8BAID///////////////8AAOL/////BwAO////////////////D/D/////////////////////////////////////////' +
    '////////////////////////////////////////////////////////////////////////////////////////////////////////////';

const COLS = 180;
const ROWS = 90;
const bits = Uint8Array.from(atob(LAND), (c) => c.charCodeAt(0));

function cell(col, row) {
    const k = Math.min(ROWS - 1, Math.max(0, row)) * COLS + ((col + COLS) % COLS);
    return (bits[k >> 3] >> (k & 7)) & 1;
}

// Share of land at a latitude and longitude in degrees, 0 to 1, blended from the four nearest cells so
// coasts come out smooth.
export function landAt(lat, lon) {
    const x = (lon + 180) / 2 - 0.5;
    const y = (90 - lat) / 2 - 0.5;
    const col = Math.floor(x);
    const row = Math.floor(y);
    const fx = x - col;
    const fy = y - row;
    const top = cell(col, row) * (1 - fx) + cell(col + 1, row) * fx;
    const bottom = cell(col, row + 1) * (1 - fx) + cell(col + 1, row + 1) * fx;
    return top + (bottom - top) * fy;
}
