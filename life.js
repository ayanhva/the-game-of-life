/*
    CSCI 2408 Computer Graphics Fall 2022 
    (c)2022 by Ayan Hashimova
    Submitted in partial fulfillment of the requirements of the course.
*/
var interval;
var fileInput;
var fileContent;
window.onload = init;
window.addEventListener("contextmenu", e => e.preventDefault());
const NUM_ROWS = 50;
const NUM_COLUMNS = 50;
const MAX_AGE = 21;
const COLOR_DEAD = "#FFFFFF";
const YOUNGEST_ALIVE_COLOR = "#5e4fa2";
const OLDEST_ALIVE_COLOR = "#f79459";

function init() {
    // Get reference to the 2D context of the canvas
    // eventFunctions();
    canvas = document.getElementById("gl-canvas");
    context = canvas.getContext("2d");
    let draw = new Draw(canvas, context, COLOR_DEAD, YOUNGEST_ALIVE_COLOR, OLDEST_ALIVE_COLOR);
    let gameState = new GameActions(canvas,context, YOUNGEST_ALIVE_COLOR, OLDEST_ALIVE_COLOR, COLOR_DEAD);
    draw.initializeGrid();
}

// a cell class initialized in order to fill the grid later on
class Cell {
    constructor(canvas, gridX, gridY) {
        this.width = canvas.clientWidth / NUM_COLUMNS;
        this.height = canvas.clientHeight / NUM_ROWS;

        // store the position of this cell in the grid
        this.gridX = gridX;
        this.gridY = gridY;

        // an indicator if the cell is dead or alive
        this.alive = false;

        // add an indicator if it was EVER alive for the next task
        this.everAlive = false;

        // add an indicator of age
        this.age = 0;
    }
}

// class for drawing operations
class Draw {
    constructor(canvas, context, deadColor, youngestAliveColor, oldestAliveColor) {
        this.canvas = canvas;
        this.context = context;
        this.deadColor = deadColor;
        this.youngestAliveColor = youngestAliveColor;
        this.oldestAliveColor = oldestAliveColor;
    }

    // function to update local youngest color
    updateYoungestColor(newYoungColor) {
        this.youngestAliveColor = newYoungColor;
    }

    // function to update local oldest color
    updateOldestColor(newOldestColor) {
        this.oldestAliveColor = newOldestColor;
    }

    // function to update local dead color
    updateDeadColor(newDeadColor) {
        this.deadColor = newDeadColor;
    }

    // draw each cell
    drawCell(cell, color) {
        // assign a color
        context.fillStyle = color;
        //fill the pixel
        context.fillRect(cell.gridX * cell.width + 1, cell.gridY * cell.height + 1, cell.width - 2, cell.height - 2);
    }

    // function to initialize and draw the grid
    initializeGrid() {
        this.context.fillStyle = "white";
        // fill the grid
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.context.strokeStyle = "black";
        this.context.lineWidth = 2;

        // draw the vertical lines
        let x = 0;
        let resolutionX = this.canvas.clientWidth / NUM_COLUMNS;


        while (x <= this.canvas.clientWidth) {
            this.drawLine(x, 0, x, this.canvas.clientHeight);
            x = x + resolutionX;
        }

        // draw the horizontal lines
        let y = 0;
        let resolutionY = this.canvas.clientWidth / NUM_ROWS;

        while (y <= this.canvas.clientHeight) {
            this.drawLine(0, y, this.canvas.clientWidth, y);
            y = y + resolutionY;
        }
    }

    // simple function to draw a line from one coordinate to another
    drawLine(x0, y0, x1, y1) {
        this.context.beginPath();
        this.context.moveTo(x0, y0);
        this.context.lineTo(x1, y1);
        this.context.stroke();
    }

    // function to iterate over the grid and color the pixels according to its feature (colors, age, etc.)
    drawGrid(someGrid) {
        someGrid.map(x => {
            x.map(cell => {
                let color = this.chooseRightColor(cell);
                this.drawCell(cell, color);
            })
        });
    }

    // funtion chooses the needed color for coloring the pixel
    // if the cell is alive then interpolation of oldest and youngest colors occurs and a color gets assigned
    // else if the cell is dead but it has ever been alive then the shade of the color changes by a specific amount
    // in case dead color is white or black, then specific colors are assigned by me as shading is not clearly observable for them
    chooseRightColor(cell) {
        let color = this.deadColor;
        if (cell.alive) {
            color = this.interpolate(cell.age);
        }
        else if (!cell.alive && cell.everAlive) {
            // add check for white color, as it does not become a shade lighter or darker
            if (this.deadColor == "white") color = "#D3D3D3";
            else if (this.deadColor == "#000000") color = "#1D1E1E"
            else color = this.changeColor(this.deadColor, 50);
        }

        return color;
    }

    // function to change shade of the color by amount, which is done by finding rgb value of hex 
    // and then parsing the r, g, b codes to get the color with amount increased or decreased
    // depending on whether we are making the cell darker or lighter 
    changeColor(color, amount) {
        let rgbColor = this.hexToRgb(color);

        // parse colors with additing of percentage change 
        let redCode = parseInt(rgbColor.r * (100 + amount) / 100);
        let greenCode = parseInt(rgbColor.g * (100 + amount) / 100);
        let blueCode = parseInt(rgbColor.b * (100 + amount) / 100);

        // check if code is more than 255, as rgb values are on a scale of (0, 255) then just assign 255 to it 
        redCode = (redCode < 255) ? redCode : 255;
        greenCode = (greenCode < 255) ? greenCode : 255;
        blueCode = (blueCode < 255) ? blueCode : 255;

        // in case red, blue, or green codes are 1 in length append 0 to the start to make them all 2 for further result
        let RR = ((redCode.toString(16).length == 1) ? "0" + redCode.toString(16) : redCode.toString(16));
        let GG = ((greenCode.toString(16).length == 1) ? "0" + greenCode.toString(16) : greenCode.toString(16));
        let BB = ((blueCode.toString(16).length == 1) ? "0" + blueCode.toString(16) : blueCode.toString(16));

        return "#" + RR + GG + BB;
    }

    // function interpolates the 2 colors based on cell's age and outputs a resulting color
    // after rgb values of hex colors(oldest and youngest) are found, 
    // firstly age is checked it its more than the max indicated assign to max
    // finding the difference between colors (contrast) and multilying it to (proportion of age to max age)
    // and then adding the value to youngest value so that the color changes
    // lastly converting the result back to hex and returning it 
    interpolate(age) {
        let youngestColor = this.hexToRgb(this.youngestAliveColor);
        let oldestColor = this.hexToRgb(this.oldestAliveColor);

        // check if max age is overpassed and assign it to the age if so
        if (age >= MAX_AGE) {
            age = MAX_AGE;
        }

        // find from youngest color to oldest one step by step (age by age)
        let rr = (oldestColor.r - youngestColor.r) * (age / MAX_AGE) + youngestColor.r;
        let rg = (oldestColor.g - youngestColor.g) * (age / MAX_AGE) + youngestColor.g;
        let rb = (oldestColor.b - youngestColor.b) * (age / MAX_AGE) + youngestColor.b;

        return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
    }

    // convext hex color to rgb for interpolation and color shade changing purpose
    // by getting substrings of a hex code string and parsing 
    // the corresponding strings for each r, g, and b codes and 
    // returning all of them in an array like format for further usage
    hexToRgb(hex) {
        let result = [];

        // get r bit
        let red = hex.substr(1, 2);
        // get g bit
        let green = hex.substr(3, 2);
        //get b bit
        let blue = hex.substr(5, 2);

        result.push(red);
        result.push(green);
        result.push(blue);

        // return an array with r, g, b values
        return result ? {
            r: parseInt(result[0], 16),
            g: parseInt(result[1], 16),
            b: parseInt(result[2], 16),
        } : null;
    }
}

// this class is for all the game actions
class GameActions {
    constructor(canvas, context, youngestAliveColor, oldestAliveColor, deadColor) {
        this.timer = false;
        this.oldestAliveColor = oldestAliveColor;
        this.youngestAliveColor = youngestAliveColor;
        this.deadColor = deadColor;
        this.delayTime = 300;
        this.draw = new Draw(canvas, context, deadColor, youngestAliveColor, oldestAliveColor);
        this.grid = this.createGrid();
        this.canvas = canvas;
        this.context = context;

        this.bindingFunctions();
        this.assignFunctions();
    }

    // function assigns events to functions 
    assignFunctions() {
        document.getElementById("young-alive-cell-color").addEventListener("input", this.setYoungAliveCellColor);
        document.getElementById("old-alive-cell-color").addEventListener("input", this.setOldAliveCellColor);
        document.getElementById("dead-cell-color").addEventListener("input", this.setDeadCellColor);
        document.getElementById("time").addEventListener("input", this.setDelayTime);
        this.canvas.addEventListener("mouseup", this.onCLick);
        document.querySelector('input[type="file"]').addEventListener("change", this.uploadFile);
        document.getElementById("show-on-grid").addEventListener("click", this.showOnGrid);
        document.getElementById("download-file").addEventListener("click", this.downloadFile);
        document.getElementById("start").addEventListener("click", this.startTheGame);
        document.getElementById("next").addEventListener("click", this.takeTheNextStep);
        document.getElementById("stop").addEventListener("click", this.stopTheGame);
        document.getElementById("clear").addEventListener("click", this.clearTheGrid);
    }

    // function binds each function to the class for functionality
    bindingFunctions() {
        this.setDeadCellColor = this.setDeadCellColor.bind(this)
        this.setYoungAliveCellColor = this.setYoungAliveCellColor.bind(this);
        this.setOldAliveCellColor = this.setOldAliveCellColor.bind(this);
        this.setDelayTime = this.setDelayTime.bind(this);
        this.onCLick = this.onCLick.bind(this);
        this.uploadFile = this.uploadFile.bind(this);
        this.showOnGrid = this.showOnGrid.bind(this);
        this.downloadFile = this.downloadFile.bind(this);
        this.startTheGame = this.startTheGame.bind(this);
        this.takeTheNextStep = this.takeTheNextStep.bind(this);
        this.stopTheGame = this.stopTheGame.bind(this);
        this.clearTheGrid = this.clearTheGrid.bind(this);
    }

    // initializes, created the greed of size NUM_COLUMNS and NUM_ROWS by filling each index in with a cell
    createGrid() {
        console.log("Log: createGrid start.");
    
        // make an array or arrays being [49][49] and fill them in with dead cells
        let arr = new Array(NUM_COLUMNS)
            .fill(null)
            .map((_, colIndex) => new Array(NUM_ROWS)
                .fill(null)
                .map((_, rowIndex) => new Cell(canvas, colIndex, rowIndex)));
    
        console.log("Log: createGrid end.");
    
        return arr;
    }    

    // set the color of the youngest alive cell
    setYoungAliveCellColor(e) {
        console.log("Log: setYoungAliveCellColor start.");

        this.youngestAliveColor = e.target.value;
        // call the draw class and update color there as well for correct coloring later on
        this.draw.updateYoungestColor(this.youngestAliveColor);
        this.draw.drawGrid(this.grid);
        
        console.log("Log: setYoungAliveCellColor start.");
    }

    // set the color of the oldest alive cell
    setOldAliveCellColor(e) {
        console.log("Log: setOldAliveCellColor start.");

        this.oldestAliveColor = e.target.value;
        // call the draw class and update color there as well for correct coloring later on
        this.draw.updateOldestColor(this.oldestAliveColor);
        this.draw.drawGrid(this.grid);

        console.log("Log: setOldAliveCellColor start.");
    }

    // set the dead color of a cell
    setDeadCellColor(e) {
        console.log("Log: setDeadCellColor start.");

        this.deadColor = e.target.value;
        // call the draw class and update color there as well for correct coloring later on
        this.draw.updateDeadColor(this.deadColor);
        this.draw.drawGrid(this.grid);

        console.log("Log: setDeadCellColor start.");
    }

    // set the delay time between ticks to the indicated one
    setDelayTime(e) {
        console.log("Log: setDelayTime start.");

        this.delayTime = e.target.value;

        // in case the game is in action then change the speed while the game is on
        // else the effect of the change of delay time will be shown when the game starts 
        if(this.timer) {
            this.stopTheGame();
            this.startTheGame();
        }

        console.log("Log: setDelayTime end.");
    }

    // convert grid information to text by checking whether 
    // cells are alive or dead and concatenating corresponding '+' and '-' to the string
    gridToTextFormat() {
        var text = "";

        for (var i = 0; i < this.grid.length; i++) {
            for (var j = 0; j < this.grid[i].length; j++) {
                if (this.grid[j][i].alive) text = text.concat("+");
                else text = text.concat("-");
            }
            text = text.concat('\n');
        }

        return text;
    }

    // creating a txt file, writing down the 
    // content that was geenrated from the grid info and loading it
    downloadFile() {
        console.log("Log: downloadFile start.");

        // get text format got from grid information
        let textString = this.gridToTextFormat();

        // create a file name
        let fileName = "game_of_life.txt";

        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(textString));
        element.setAttribute('download', fileName);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
        
        console.log("Log: downloadFile end.");
    }

    // getting the file as an input from the user and reading 
    // every line using split() function and storing in an array
    uploadFile(e) {
        console.log("Log: uploadFile start.");
        var file = e.target;
        var reader = new FileReader();

        // store every line in an array as we read
        reader.onload = function () {
            fileContent = reader.result.split("\n");
        }
        reader.readAsText(file.files[0]);
        
        console.log("Log: uploadFile end.");
    }

    // showing the read array on the grid, by looping through it 
    // and checking if the characters are '+', meaning alive or '-' meaning dead cells
    showOnGrid() {
        this.clearTheGrid();
        for (var i = 0; i < fileContent.length; i++) {
            let line = fileContent[i];
            for (var j = 0; j < line.length; j++) {
                if (line.charAt(j) == '-') this.grid[j][i].alive = false;
                else if (line.charAt(j) == '+') {
                    this.grid[j][i].alive = true;
                    this.grid[j][i].everAlive = true;
                    this.grid[j][i].age = 1;
                }
            }
        }
        this.draw.drawGrid(this.grid);
    }

    // stops the game and sets timer to false, so that the start button works again
    stopTheGame() {
        console.log("Log: stopTheGame start.");

        clearInterval(interval);
        this.timer = false;

        console.log("Log: stopTheGame start.");
    }

    // takes 1 step to the next generation
    takeTheNextStep() {
        console.log("Log: takeTheNextStep start.");

        this.grid = this.findNextGeneration(this.grid);
        this.draw.drawGrid(this.grid);

        console.log("Log: takeTheNextStep end.");
    }

    // starts the game, unless times is false, meaning that the game is not ongoing,
    // the game starts and calls finding next generation function recursively
    startTheGame() {
        console.log("Log: startTheGame start.");

        // if its already ongoing, don't start again
        if (!this.timer) {
            interval = setInterval(this.takeTheNextStep, this.delayTime);
            this.timer = true;
        }

        console.log("Log: startTheGame end.");
    }

    // finds the next geenration by first copying the original grid to a new one
    // then by iterating through the original greed, we count the number of neightbours each cell has
    // 1. in case it is alive and has more than 3 or less than 2 cells, then the future generation of this cell will die
    // 2. in case it is dead and neighbour count is 3 exactly, then the cell becomes 
    // alive in the next generation, so we also made everAlive true as well 
    //then we check if the next generation cell is alive we add to its age and if it died then we nullify its age
    findNextGeneration(someGrid) {
        let nextGeneration = JSON.parse(JSON.stringify(someGrid));

        for (let x = 0; x < someGrid.length; x++) {
            for (let y = 0; y < someGrid[x].length; y++) {
                var cell = someGrid[x][y];
                // count neighbors of each cell
                const neightborsCount = this.countNeighbors(cell, someGrid);
                let nextGenerationCell = nextGeneration[x][y];
                // condition 1. mentioned above
                // the rules 1 and 3
                if ((cell.alive && neightborsCount < 2) || (cell.alive && neightborsCount > 3)) {
                    console.log("Alive cell --> dead: " + neightborsCount);
                    nextGenerationCell.alive = false;
                }
                // condition 2 mentioned above
                // the rule 4
                else if (!cell.alive && neightborsCount === 3) {
                    console.log("Dead cell --> alive: " + neightborsCount);
                    nextGenerationCell.everAlive = true;
                    nextGenerationCell.alive = true;
                }
                // the 2nd rule will work as an else clause (no need for any check for it)
                // in order to update age in next generation grid
                if (nextGenerationCell.alive) nextGenerationCell.age++;
                else nextGenerationCell.age = 0;
            }
        }

        return nextGeneration;
    }

    // the countNeighbors function checks for the cases below and counts those being alive
    // nextGeneration[y-1][x-1].alive
    // nextGeneration[y][x-1].alive
    // nextGeneration[y+1][x-1].alive
    // nextGeneration[y-1][x].alive
    // nextGeneration[y+1][x].alive
    // nextGeneration[y-1][x+1].alive
    // nextGeneration[y][x+1].alive
    // nextGeneration[y+1][x+1].alive

    // you can later add a statement into the for loop to increase efficiency -> break if count reached 4 for ex 
    countNeighbors(cell, someGrid) {
        // initialize the count to 0
        let countOfNeighbors = 0;

        // basically forma 3x3 coordinate system where the cell is the middle element [0][0] in the case below
        for (let y = -1; y <= 1; y++) {
            for (let x = -1; x <= 1; x++) {
                // this check is for not counting the cell itself when counting the neighbours
                if (y == 0 && x == y) continue;

                let newY = cell.gridY + y;
                let newX = cell.gridX + x;
                // this check is to handle the edge cells, 
                // as we will can get grid[-1][] or grid[][-1], which is impossible to count and will throw an exception
                if (newX >= 0 && newX < NUM_COLUMNS && newY >= 0 && newY < NUM_ROWS)
                    // check if the grids surrounding are alive; if so increment the count of neighbours
                    if (someGrid[newX][newY].alive) countOfNeighbors++;
            }
        }

        return countOfNeighbors;
    }

    // clears the grid by making all alive cells dead and ever alive boolean false
    clearTheGrid() {
        console.log("Log: clearTheGrid start.");

        // loop through the grid and make all the cells dead
        this.grid.map((col) => col.map(cell => { cell.alive = false; cell.everAlive = false; this.draw.drawCell(cell, this.deadColor); }))

        console.log("Log: clearTheGrid end.");
    }

    // when the cell is clicked, the canvas coordinates and calculated and divided by the size of each cell
    // which then provides us with the cell coordinates
    // then if the click was w a left click then the cell becomes alive, so does everAlive boolean, and age becomes 1
    // in case click was a right click then the cell becomes dead, and everything else nullfies as well
    // lastly the cell gets colored
    onCLick(e) {
        // get coordinates of the mouse within canvas
        let rect = this.canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

        const resY = this.canvas.clientHeight / NUM_ROWS;
        const resX = this.canvas.clientWidth / NUM_COLUMNS;

        // find coordinated within the grid 
        x = Math.floor(x / resX);
        y = Math.floor(y / resY);

        let cell = this.grid[x][y];

        if (e.button == 0) {
            cell.alive = true;

            // indicate that this cell has been alive 
            cell.everAlive = true;

            // make age 1
            cell.age = 1;
        } else if (e.button == 2) {
            cell.alive = false;
            cell.everAlive = false;
            // make age 0 again as the cell dies
            cell.age = 0;
        }

        // choose a color depending on the alive state of the cell
        let color = this.draw.chooseRightColor(cell);

        // color the cell
        this.draw.drawCell(cell, color);
    }
}