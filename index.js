const main = () => {
    console.log("index.js loaded");
    const canvas = $("canvas#gamecanvas");
    console.log(canvas);
}

$(document).ready(main);