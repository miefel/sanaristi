const puzzleElement = document.getElementById("puzzle");

let puzzles = [];
let currentPuzzle = null;
let selectedCell = null;
let keyboardInput = null;


/*
============================================================
ASETUKSET
============================================================
*/

const START_DATE = new Date("2026-09-02T00:00:00");

const STORAGE_KEY = "sanaristi_peli";

let hintCount = 0;


/*
============================================================
PÄIVÄN NUMERO
============================================================
*/

function getDayNumber() {

    const today = new Date();

    const todayDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );

    const startDate = new Date(
        START_DATE.getFullYear(),
        START_DATE.getMonth(),
        START_DATE.getDate()
    );

    const difference =
        todayDate.getTime() - startDate.getTime();

    return Math.floor(
        difference / (1000 * 60 * 60 * 24)
    );
}

function updateDateInfo() {

    const dateInfo =
        document.getElementById("dateInfo");

    const today =
        new Date();

    const options = {
        day: "numeric",
        month: "long",
        year: "numeric"
    };

    const dateText =
        today.toLocaleDateString(
            "fi-FI",
            options
        );

    const puzzleNumber =
        getDayNumber() + 1;

    dateInfo.textContent =
        `${dateText} · #${puzzleNumber}`;
}

/*
============================================================
PÄIVÄN SANARISTI
============================================================
*/

function selectDailyPuzzle() {

    const dayNumber = getDayNumber();

    const puzzleIndex =
        ((dayNumber % puzzles.length) + puzzles.length)
        % puzzles.length;

    currentPuzzle =
        puzzles[puzzleIndex];

    createGrid();

    loadSavedGame();

    updateDateInfo();
}


/*
============================================================
PUZZLEN LATAUS
============================================================
*/

async function loadPuzzles() {

    try {

        const response =
            await fetch("sanaristit/sanaristit.json");

        if (!response.ok) {

            throw new Error(
                "HTTP-virhe: " + response.status
            );
        }

        puzzles =
            await response.json();

        if (!puzzles.length) {

            throw new Error(
                "sanaristit.json on tyhjä."
            );
        }

        selectDailyPuzzle();

    } catch (error) {

        console.error("VIRHE:", error);

        document.getElementById("message").textContent =
            "Ristikon lataaminen epäonnistui.";
    }
}


/*
============================================================
RUUDUKON LUONTI
============================================================
*/

function createGrid() {

    puzzleElement.innerHTML = "";

    currentPuzzle.grid.forEach(
        (row, rowIndex) => {

            [...row].forEach(
                (value, columnIndex) => {

                    const cell =
                        document.createElement("div");

                    cell.classList.add("cell");

                    cell.dataset.row =
                        rowIndex;

                    cell.dataset.column =
                        columnIndex;


                    if (value === "-") {

                        cell.classList.add(
                            "no-border"
                        );

                    } else if (value === ".") {

                        cell.classList.add(
                            "input"
                        );

                        cell.addEventListener(
                            "click",
                            () => selectCell(cell)
                        );

                    } else {

                        cell.textContent =
                            value.toUpperCase();
                    }

                    puzzleElement.appendChild(cell);
                }
            );
        }
    );
}


/*
============================================================
TALLENNA PELI
============================================================
*/

function saveGame() {

    if (!currentPuzzle) {
        return;
    }

    const cells =
        [...document.querySelectorAll(".cell.input")];

    const values = {};

    cells.forEach(cell => {

        const key =
            `${cell.dataset.row},${cell.dataset.column}`;

        values[key] = {
            value: cell.dataset.value || "",
            hint: cell.classList.contains("hint")
        };
    });


    const gameData = {

        puzzleId:
            currentPuzzle.id,

        values:
            values,

        solved:
            document
                .getElementById("message")
                .classList.contains("correct")
    };


    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(gameData)
    );
}


/*
============================================================
LATAA TALLENNETTU PELI
============================================================
*/

function loadSavedGame() {

    const saved =
        localStorage.getItem(STORAGE_KEY);

    if (!saved) {
        return;
    }

    try {

        const gameData =
            JSON.parse(saved);


        if (
            gameData.puzzleId !==
            currentPuzzle.id
        ) {
            return;
        }


        const cells =
            [...document.querySelectorAll(".cell.input")];

        hintCount = 0;

        cells.forEach(cell => {

            const key =
                `${cell.dataset.row},${cell.dataset.column}`;

            const savedCell =
                gameData.values[key];

            if (savedCell) {

                if (typeof savedCell === "string") {

                    cell.dataset.value =
                        savedCell;

                    cell.textContent =
                        savedCell.toUpperCase();

                } else if (savedCell.value) {

                    cell.dataset.value =
                        savedCell.value;

                    cell.textContent =
                        savedCell.value.toUpperCase();

                    if (savedCell.hint) {

                        cell.classList.add("hint");
                        hintCount++;
                    }
                }
            }

        });



        if (gameData.solved) {

            cells.forEach(cell => {

                cell.classList.add(
                    "correct"
                );
            });

            const message =
                document.getElementById("message");

            message.textContent =
                "Oikein! 🎉";

            message.className =
                "correct";
        }

    } catch (error) {

        console.error(
            "Tallennetun pelin lataaminen epäonnistui:",
            error
        );
    }
}


/*
============================================================
RUUDUN VALINTA
============================================================
*/

function selectCell(cell) {

    if (!cell.classList.contains("input")) {
        return;
    }
    if (cell.classList.contains("hint")) {
        return;
    }
    document
        .querySelectorAll(".cell.input")
        .forEach(cell => {

            cell.classList.remove("active");
        });

    selectedCell = cell;

    selectedCell.classList.add("active");

    focusKeyboard();
}


/*
============================================================
NÄPPÄIMISTÖ
============================================================
*/

function focusKeyboard() {

    if (!keyboardInput) {

        keyboardInput =
            document.createElement("input");

        keyboardInput.type = "text";

        keyboardInput.autocomplete = "off";
        keyboardInput.autocorrect = "off";
        keyboardInput.autocapitalize = "none";
        keyboardInput.spellcheck = false;

        keyboardInput.inputMode = "text";

        keyboardInput.style.position = "absolute";
        keyboardInput.style.left = "0";
        keyboardInput.style.top = "0";

        keyboardInput.style.width = "1px";
        keyboardInput.style.height = "1px";

        keyboardInput.style.opacity = "0";

        keyboardInput.style.pointerEvents = "none";




        document.body.appendChild(
            keyboardInput
        );


        keyboardInput.addEventListener(
            "input",
            handleKeyboardInput
        );

        keyboardInput.addEventListener(
            "keydown",
            handleKeyDown
        );
    }


    /*
    Näppäimistö on jo aktiivinen.

    Älä kohdista fokusta uudelleen jokaisen
    kirjaimen jälkeen.
    */

    if (
        document.activeElement ===
        keyboardInput
    ) {
        return;
    }


    /*
    Tallennetaan nykyinen sivun paikka.
    */

    keyboardInput.value = "";

    keyboardInput.focus({
        preventScroll: true
    });

}


/*
============================================================
KIRJAIMEN SYÖTTÖ
============================================================
*/

function handleKeyboardInput(event) {

    if (
        selectedCell &&
        selectedCell.classList.contains("hint")
    ) {
        event.target.value = "";
        return;
    }

    if (!selectedCell) {
        return;
    }

    const value =
        event.target.value.toLowerCase();

    if (!value) {
        return;
    }

    const characters =
        [...value];

    const character =
        characters[characters.length - 1];


    if (!/^[a-zåäö]$/i.test(character)) {

        event.target.value = "";

        return;
    }


    selectedCell.dataset.value =
        character;

    selectedCell.textContent =
        character.toUpperCase();


    selectedCell.classList.remove(
        "correct"
    );

    selectedCell.classList.remove(
        "wrong"
    );


    event.target.value = "";

    saveGame();

    moveNext();

}



/*
============================================================
SEURAAVA RUUTU
============================================================
*/

function moveNext() {

    const cells =
        [...document.querySelectorAll(".cell.input")];

    const index =
        cells.indexOf(selectedCell);

    let nextIndex =
        index + 1;

    while (nextIndex < cells.length) {

        const nextCell =
            cells[nextIndex];

        if (!nextCell.classList.contains("hint")) {

            selectCell(nextCell);

            return;
        }

        nextIndex++;
    }
}


/*
============================================================
NÄPPÄIMISTÖN NÄPPÄIMET
============================================================
*/

function handleKeyDown(event) {

    if (!selectedCell) {
        return;
    }


    if (event.key === "Backspace") {

        event.preventDefault();


        /*
        Vihjeruutua ei voi muuttaa.
        */

        if (selectedCell.classList.contains("hint")) {
            return;
        }


        /*
        Jos nykyisessä ruudussa on kirjain,
        poistetaan se.
        */

        if (selectedCell.dataset.value) {

            delete selectedCell.dataset.value;

            selectedCell.textContent = "";

            selectedCell.classList.remove(
                "correct"
            );

            selectedCell.classList.remove(
                "wrong"
            );

            saveGame();

            return;
        }


        /*
        Nykyinen ruutu on tyhjä.
        Etsitään edellinen normaali ruutu.
        */

        const cells =
            [...document.querySelectorAll(".cell.input")];

        let index =
            cells.indexOf(selectedCell);

        index--;


        while (index >= 0) {

            const previousCell =
                cells[index];


            /*
            Ohitetaan vihjeruudut.
            */

            if (
                !previousCell.classList.contains("hint")
            ) {

                selectCell(previousCell);

                delete previousCell.dataset.value;

                previousCell.textContent = "";

                previousCell.classList.remove(
                    "correct"
                );

                previousCell.classList.remove(
                    "wrong"
                );

                saveGame();

                return;
            }

            index--;
        }

        return;
    }


    if (event.key === "ArrowLeft") {

        event.preventDefault();

        moveHorizontal(-1);

        return;
    }


    if (event.key === "ArrowRight") {

        event.preventDefault();

        moveHorizontal(1);

        return;
    }


    if (event.key === "ArrowUp") {

        event.preventDefault();

        moveVertical(-1);

        return;
    }


    if (event.key === "ArrowDown") {

        event.preventDefault();

        moveVertical(1);

        return;
    }
}


/*
============================================================
VAAKASUUNTAINEN LIIKE
============================================================
*/

function moveHorizontal(direction) {

    if (!selectedCell) {
        return;
    }

    const row =
        Number(selectedCell.dataset.row);

    const column =
        Number(selectedCell.dataset.column);

    let newColumn =
        column + direction;

    while (
        newColumn >= 0 &&
        newColumn < 8
    ) {

        const cell =
            document.querySelector(
                `.cell.input[data-row="${row}"][data-column="${newColumn}"]`
            );

        if (cell) {

            selectCell(cell);

            return;
        }

        newColumn += direction;
    }
}


/*
============================================================
PYSTYSUUNTAINEN LIIKE
============================================================
*/

function moveVertical(direction) {

    if (!selectedCell) {
        return;
    }

    const row =
        Number(selectedCell.dataset.row);

    const column =
        Number(selectedCell.dataset.column);

    let newRow =
        row + direction;

    while (
        newRow >= 0 &&
        newRow < 8
    ) {

        const cell =
            document.querySelector(
                `.cell.input[data-row="${newRow}"][data-column="${column}"]`
            );

        if (cell) {

            selectCell(cell);

            return;
        }

        newRow += direction;
    }
}


/*
============================================================
TARKISTA RATKAISU
============================================================
*/

function checkPuzzle() {

    const inputCells =
        [...document.querySelectorAll(".cell.input")];

    let allCorrect = true;
    let allFilled = true;


    inputCells.forEach(cell => {

        const row =
            Number(cell.dataset.row);

        const column =
            Number(cell.dataset.column);

        const actual =
            (cell.dataset.value || "")
                .toLowerCase();

        let expected = null;


        if (
            row >= 2 &&
            row <= 5 &&
            column >= 2 &&
            column <= 5
        ) {

            const verticalIndex =
                column - 2;

            const letterIndex =
                row;

            expected =
                currentPuzzle.vertical[
                    verticalIndex
                ][letterIndex].toLowerCase();
        }


        if (!actual) {

            allFilled = false;
            allCorrect = false;

            cell.classList.remove(
                "correct"
            );

            cell.classList.remove(
                "wrong"
            );

            return;
        }


        if (actual === expected) {

            cell.classList.remove(
                "wrong"
            );

            cell.classList.add(
                "correct"
            );

        } else {

            cell.classList.remove(
                "correct"
            );

            cell.classList.add(
                "wrong"
            );

            allCorrect = false;
        }
    });


    const message =
        document.getElementById("message");


    if (!allFilled) {

        message.textContent =
            "Täytä kaikki ruudut.";

        message.className =
            "wrong";

        saveGame();

        return;
    }


    if (allCorrect) {

        message.textContent =
            "Oikein! 🎉";

        message.className =
            "correct";

    } else {

        message.textContent =
            "Jotkin kirjaimet ovat väärin.";

        message.className =
            "wrong";
    }


    saveGame();
}


/*
============================================================
TARKISTA-NAPPI
============================================================
*/

document
    .getElementById("checkButton")
    .addEventListener(
        "click",
        checkPuzzle
    );


/*
============================================================
ALOITA
============================================================
*/

loadPuzzles();

/*
============================================================
AUTOMAATTINEN PÄIVÄN VAIHTUMINEN
============================================================
*/

let currentDay = getDayNumber();

setInterval(() => {

    const newDay = getDayNumber();

    if (newDay !== currentDay) {

        currentDay = newDay;

        selectDailyPuzzle();
    }

}, 30000);


/*
============================================================
VIHJE
============================================================
*/

function giveHint() {

    const emptyCells =
        [...document.querySelectorAll(".cell.input")]
            .filter(cell => !cell.dataset.value);

    if (emptyCells.length === 0) {
        return;
    }

    const randomIndex =
        Math.floor(
            Math.random() * emptyCells.length
        );

    const hintCell =
        emptyCells[randomIndex];


    const row =
        Number(hintCell.dataset.row);

    const column =
        Number(hintCell.dataset.column);


    let expected = null;


    if (
        row >= 2 &&
        row <= 5 &&
        column >= 2 &&
        column <= 5
    ) {

        const verticalIndex =
            column - 2;

        const letterIndex =
            row;

        expected =
            currentPuzzle.vertical[
                verticalIndex
            ][letterIndex].toLowerCase();
    }


    if (!expected) {
        return;
    }


    hintCell.dataset.value =
        expected;

    hintCell.textContent =
        expected.toUpperCase();

    hintCell.classList.add("hint");

    hintCount++;

    saveGame();

}

document
    .getElementById("hintButton")
    .addEventListener(
        "click",
        giveHint
    );

document
    .getElementById("helpButton")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById("helpOverlay")
                .classList.add("open");
        }
    );


document
    .getElementById("closeHelpButton")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById("helpOverlay")
                .classList.remove("open");
        }
    );

