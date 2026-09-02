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
}


/*
============================================================
PUZZLEN LATAUS
============================================================
*/

async function loadPuzzles() {

    try {

        const response =
            await fetch("../sanaristit/sanaristit.json");

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

        values[key] =
            cell.dataset.value || "";
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

        cells.forEach(cell => {

            const key =
                `${cell.dataset.row},${cell.dataset.column}`;

            const value =
                gameData.values[key];

            if (value) {

                cell.dataset.value =
                    value;

                cell.textContent =
                    value.toUpperCase();
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

        /*
        Pidetään input visuaalisesti
        näkymättömänä mutta aktiivisena.
        */

        keyboardInput.style.position = "fixed";
        keyboardInput.style.left = "50%";
        keyboardInput.style.bottom = "10px";

        keyboardInput.style.width = "1px";
        keyboardInput.style.height = "1px";

        keyboardInput.style.opacity = "0.01";

        keyboardInput.style.zIndex = "-1";

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

    keyboardInput.value = "";

    keyboardInput.focus();
}


/*
============================================================
KIRJAIMEN SYÖTTÖ
============================================================
*/

function handleKeyboardInput(event) {

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

    if (
        index !== -1 &&
        index + 1 < cells.length
    ) {

        selectCell(
            cells[index + 1]
        );
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


        const cells =
            [...document.querySelectorAll(".cell.input")];

        const index =
            cells.indexOf(selectedCell);

        if (index > 0) {

            const previousCell =
                cells[index - 1];

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
