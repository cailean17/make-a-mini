import { useEffect, useState } from "react";
import Cell, { CELL_SIZE, EMPTY_CELL_VALUE, FREEFORM_CELL_VALUE, type CellValue } from "./Cell";
import type { WordOrientation, WordProps } from "./Word";
import Word from "./Word";
import inputStyles from "../styles/input.module.css";
import clueStyles from "../styles/clues.module.css";
import mainStyles from "../styles/main.module.css";
import { decodePuzzle, deserializeClues, encodePuzzle, exportPuzzle } from "../utils/utils";
import Modal from "./Modal";
import Timer from "./Timer";


export interface GridProps {
    widthCells: number
    heightCells: number
    setGridWidth: React.Dispatch<React.SetStateAction<number>>
    setGridHeight: React.Dispatch<React.SetStateAction<number>>
    gridRef: React.RefObject<SVGSVGElement | null>
}


export interface ClueGroup {
    exportNumber: number,
    down: string | undefined
    across: string | undefined
    downTargetLocation: [number, number]
    acrossTargetLocation: [number, number]
    acrossTargetLength: number
    downTargetLength: number
}

export interface Puzzle {
    id: string
    title: string,
    width: number,
    height: number
    grid: CellValue[][],
    clues: ClueGroup[],
}

type UserMode = "edit" | "play" | "freeform";

export default function Grid(gridProps: GridProps) {
    const [mode, setMode] = useState<UserMode>("edit");
    const [gridValues, setGridValues] = useState<CellValue[][]>(
        Array.from({ length: gridProps.heightCells }, () =>
            Array.from({ length: gridProps.widthCells }, () => ({ letter: EMPTY_CELL_VALUE, highlighted: false, sourceHighlighted: false, blocked: false }) as CellValue)
        )
    );
    const [puzzleList, setPuzzleList] = useState<Puzzle[]>([decodePuzzle("N4Ig7glgJgLgFiAXANgDQjgUwgczjJAdnRwCdokBtS0AG0xhk1KRAFER0AjWgewGMA1pihIAZgENaAZ0wBfVHQZMWiEADlOIHgOGjEkmfMUh6jZqwDiWnUJHipshUvOqQAQRt87-w05NmKlZeuvYGjsYuQWoc3N56DkZyALqoNKbKFmohPkgwpACukRmurDkJiPlFziXRIABK5WF-xYFZIACSTb4RNW1u3XmFrZluAPKD4Ump6f2sACqTLX2jrAASS70Bq2oTcaE9Sdulao37uVP-Ue2a5xXLx3UAypvTaddusdrxzVsfZXcwlURicQABVV5XWrtADCkJBdUmwJWoKRwxS72hbhegMOULmak8uMS-J2IDhxMuCPaZ2-BxJ1M-8JRdQAIsyZv81AAZZmPdpo6r8twbSkPLnsPkSwWMgF0i7IzlY1hE-X3P7KtS3NW_I4SgCaUs1IAA6kaCR5zWTDWLeslUiB-LQitIqKBMAAPAAOvFIMHUBQAtlwsgAmdASfikXjSV2nGOYAAEACEJKQuK70FBeGAAHZWci5_hwAC0tAgwi02bz8zTOAY3IEEhgEF4-cQlAADKhQw7I9HY7XSPWYI3-M3W-3KOHOw7q7mhyPuZhczh4EQI1GY9JFw2V2uECgap6fX6A8GsmgQP3t6wALK8ABuEFXibbADpP1Wcwu6w2my2bZUN2s6bgOO5_qOAGTlQaCgSA867qO-7rog3bXlug6Qcuq6ocgx7er6_pBiGqgAMxZj-rAAGLlngMCJs2TC5lAEi5jA0ioImAAKEB8BxXEwrwJZenxvAcd-NbYdBQEdt2ZF9phEHDv-46AVOIFzj-SE4QeG4YeBOkoYenYEaexEXqo6E3rGrAADqmpgEg-rm0iJnA4lcWIpCYEmMC8ImAD6wUhQ5kntiAYxcLmvAeq2BRuWwABq0gAPTJuQtDlmxDFPPwEAri20gMdyEjFYm6gSIGmDhTpMlTjOimGdJakwXJqDwYh2HGUgACsYHbkZuGHvhJgnkR56kUgAAsA22WoawSM-r7SLguYQGIEDjuxiY-XR8VuY-UhFLVLUTrJXYdU1g1nepVCzZ12ndcNSDWUpQ16UeY2EWeJFZP1CFUWo8w-SxACeXGYDgOCJtIcDOSIXGBtAUD0LDxa8LwtCJuWXqJlwUiBqdKlQa1F3dr111YSTY7nRpV2UVJNM9YgFEGTdzMvWhGIgBQagAIyhloLYwPQrAwhIfFObmADkbnqJgYA8QUABeKti3IQA")]);
    const [activePuzzle, setActivePuzzle] = useState<Puzzle>({} as Puzzle);
    const [userProvidedPuzzleCode, setUserProvidedPuzzleCode] = useState<string>("");
    const [clueMap, setClueMap] = useState<Map<number, ClueGroup>>(new Map());

    // editMode
    const [newWord, setNewWord] = useState<WordProps[]>([]);
    const [wordInput, setWordInput] = useState<string>("");
    const [clueInput, setClueInput] = useState<string>("");
    const [saveWordFlag, setSaveWordFlag] = useState<boolean>(false);
    const [showNewPuzzleModal, setShowNewPuzzleModal] = useState(false);
    const [puzzleSolved, setPuzzleSolved] = useState(false);
    const [showSolvedModal, setShowSolvedModal] = useState(false);

    // playMode
    const [selectedCellLocation, setSelectedCellLocation] = useState<[number, number] | null>(null);
    const [activeClue, setActiveClue] = useState<ClueGroup | undefined>(undefined);
    const [typingDirection, setTypingDirection] = useState<WordOrientation>("Horizontal");
    const [autoCheck, setAutoCheck] = useState<boolean>(false);
    const [timerReset, setTimerReset] = useState(false);

    useEffect(() => {
        if (mode !== "play") return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                e.preventDefault();

                setTypingDirection(prev =>
                    prev === "Horizontal" ? "Vertical" : "Horizontal"
                );
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [mode]);

    useEffect(() => {
        if (!selectedCellLocation || mode === "edit") return;
        manageCellClick(selectedCellLocation);
    }, [typingDirection, selectedCellLocation]);

    useEffect(() => {
        if (!puzzleSolved) {
            const solved = gridValues.every(row =>
                row.every(cell => !cell.blocked ? cell.input == cell.letter : true)
            )
            if (solved) {
                setShowSolvedModal(true);
                setPuzzleSolved(true);
            }
        }
    }, [gridValues])

    function createNewPuzzle(title: string, width: number, height: number) {
        gridProps.setGridHeight(height);
        gridProps.setGridWidth(width);
        setActivePuzzle({ title: title, width: width, height: height } as Puzzle)
        setGridValues(Array.from({ length: gridProps.heightCells }, () =>
            Array.from({ length: gridProps.widthCells }, () => ({ letter: EMPTY_CELL_VALUE, highlighted: false, sourceHighlighted: false, blocked: false }) as CellValue)
        ))
    }

    function handleNewPuzzleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);

        const title = formData.get("title") as string;
        const width = Number(formData.get("width"));
        const height = Number(formData.get("height"));

        // Validate
        if (!title || width <= 0 || height <= 0) return;

        createNewPuzzle(title, width, height);
    }

    function clearPuzzle() {
        setGridValues(prev =>
            prev.map(row =>
                row.map(cell => ({ ...cell, input: '' } as CellValue))
            )
        )
    }

    function revealPuzzle() {
        setGridValues(prev =>
            prev.map(row =>
                row.map(cell => ({ ...cell, input: cell.letter } as CellValue))
            )
        )
    }
    function moveInputCursorForward() {
        if (!selectedCellLocation || mode !== "play") return;

        let next: [number, number] | null = null;

        if (typingDirection == "Horizontal") {
            const nc = selectedCellLocation[1] + 1;
            if (nc < gridProps.widthCells && !gridValues[selectedCellLocation[0]][nc].blocked) {
                next = [selectedCellLocation[0], nc];
            }
        } else {
            const nr = selectedCellLocation[0] + 1;
            if (nr < gridProps.heightCells && !gridValues[nr][selectedCellLocation[1]].blocked) {
                next = [nr, selectedCellLocation[1]];
            }
        }

        if (next) setSelectedCellLocation(next);
    }

    function clearSelectedCellAndMoveBackward() {
        if (!selectedCellLocation || mode !== "play") return;

        setGridValues(prev =>
            prev.map((row, i) =>
                row.map((cell, j) =>
                    i == selectedCellLocation[0] && j == selectedCellLocation[1]
                        ? { ...cell, input: "" }
                        : cell
                ))
        )

        let previous: [number, number] | null = null;

        if (typingDirection == "Horizontal") {
            const pc = selectedCellLocation[1] - 1;
            if (pc >= 0 && !gridValues[selectedCellLocation[0]][pc].blocked) {
                previous = [selectedCellLocation[0], pc];
            }
        } else {
            const pr = selectedCellLocation[0] - 1;
            if (pr >= 0 && !gridValues[pr][selectedCellLocation[1]].blocked) {
                previous = [pr, selectedCellLocation[1]];
            }
        }

        if (previous) setSelectedCellLocation(previous);
    }

    useEffect(() => {
        if (!selectedCellLocation || mode === "edit") {
            return;
        }
        const handleUserInput = (e: KeyboardEvent) => {
            if (/^[a-zA-Z]$/.test(e.key)) {
                e.preventDefault();
                setGridValues(prev =>
                    prev.map((row, i) =>
                        row.map((cell, j) =>
                            i == selectedCellLocation[0] && j == selectedCellLocation[1]
                                ? { ...cell, input: e.key.toUpperCase() } as CellValue
                                : cell
                        ))
                )

                moveInputCursorForward();
            }

            if (e.key == "Backspace") {
                e.preventDefault();
                clearSelectedCellAndMoveBackward();
            }
        }
        window.addEventListener("keydown", handleUserInput);
        return () => window.removeEventListener("keydown", handleUserInput);

    }, [mode, typingDirection, selectedCellLocation])


    function loadFreeForm() {
        setGridValues(Array.from({ length: gridProps.heightCells }, () =>
            Array.from({ length: gridProps.widthCells }, () => ({ letter: FREEFORM_CELL_VALUE, highlighted: false, sourceHighlighted: false, blocked: false }) as CellValue)
        ))
        setClueMap(new Map<number, ClueGroup>());
    }
    function loadPuzzleFromCode(encodedPuzzle: string) {
        const loadedPuzzle = decodePuzzle(encodedPuzzle);
        setActivePuzzle(loadedPuzzle);
        gridProps.setGridHeight(loadedPuzzle.height);
        gridProps.setGridWidth(loadedPuzzle.width);
        setGridValues(loadedPuzzle.grid);
        setClueMap(deserializeClues(loadedPuzzle.clues));
        setMode("play");
        setTimerReset(prev => !prev);
    }
    function loadPuzzle(puzzle: Puzzle) {
        setActivePuzzle(puzzle);
        gridProps.setGridHeight(puzzle.height);
        gridProps.setGridWidth(puzzle.width);
        setGridValues(puzzle.grid);
        setClueMap(deserializeClues(puzzle.clues));
        setMode("play");
        setTimerReset(prev => !prev);
    }

    async function sharePuzzle() {
        if (clueMap.size != 0) {

            setGridValues(prev =>
                prev.map(row =>
                    row.map(cell => cell.letter == EMPTY_CELL_VALUE ? ({ ...cell, blocked: true } as CellValue) : cell)
                )
            )
            const encodedPuzzleString = encodePuzzle(exportPuzzle(gridValues, clueMap, gridProps.widthCells, gridProps.heightCells, "12", "Cailean's New Puzzle"));
            console.log("IN HERE " + encodedPuzzleString);
            try {
                await navigator.clipboard.writeText(encodedPuzzleString);
                console.log('Text copied to clipboard successfully');
            } catch (error) {
                console.error('Unable to copy text to clipboard:', error);
            }
        } else {
            alert("CANNOT EXPORT EMPTY PUZZLE. ENSURE THAT YOU HAVE INCLUDED AT LEAST ONE CLUE/WORD");
        }
    }

    function createWord(word: WordProps) {
        setNewWord([word]);
    }
    function resetWord() {
        setWordInput("");
        setClueInput("");
        setNewWord([]);
    }

    function clearCellHighlights() {
        setGridValues(prev =>
            prev.map(row => row.map(cell => cell.highlighted || cell.sourceHighlighted ? { ...cell, highlighted: false, sourceHighlighted: false } as CellValue : cell))
        );
    }
    function onClueHighlight(orientation: WordOrientation, targetRow: number, targetColumn: number, targetLength: number) {
        setGridValues(prev =>
            prev.map((row, r) =>
                row.map((cell, c) => {
                    if (orientation === "Horizontal") {
                        if (r === targetRow && c >= targetColumn && c < targetColumn + targetLength) {
                            if (r === targetRow && c === targetColumn) {
                                return { ...cell, sourceHighlighted: true };
                            }
                            return { ...cell, highlighted: true };
                        }
                    } else {
                        if (c === targetColumn && r >= targetRow && r < targetRow + targetLength) {
                            if (r === targetRow && c === targetColumn) {
                                return { ...cell, sourceHighlighted: true };
                            }
                            return { ...cell, highlighted: true };
                        }
                    }
                    return cell;
                })
            )
        );
    }
    function onClueDismiss(orientation: WordOrientation, targetRow: number, targetColumn: number, targetLength: number) {
        setGridValues(prev =>
            prev.map((row, r) =>
                row.map((cell, c) => {
                    if (orientation === "Horizontal") {
                        if (r === targetRow && c >= targetColumn && c < targetColumn + targetLength) {
                            return { ...cell, highlighted: false, sourceHighlighted: false };
                        }
                    } else {
                        if (c === targetColumn && r >= targetRow && r < targetRow + targetLength) {
                            return { ...cell, highlighted: false, sourceHighlighted: false };
                        }
                    }
                    return cell;
                })
            )
        );
    }
    function addValidatedWord() {
        if (wordInput.length > 0 && wordInput.length <= Math.max(gridProps.heightCells, gridProps.widthCells) && clueInput.length != 0) {
            createWord({ word: wordInput.toUpperCase(), clue: clueInput, orientation: 'Horizontal', gridProps: gridProps, saveWordFlag: saveWordFlag, saveWordFunction: saveWord })
        } else if (wordInput.length == 0) {
            alert("CANNOT ADD EMPTY WORD...");
        } else if (wordInput.length > Math.max(gridProps.heightCells, gridProps.widthCells)) {
            alert("CANNOT ADD WORD LARGER THAN GRID BOUNDS");
        } else {
            alert("CANNOT ADD A WORD WITH EMPTY CLUE...");
        }
    }
    function saveWord(targetRow: number, targetColumn: number, orientation: WordOrientation, clue: string) {
        const word = newWord[0].word;
        const validPlacement =
            word.split("").every((letter, i) => {
                const r = orientation === "Horizontal" ? targetRow : targetRow + i;
                const c = orientation === "Horizontal" ? targetColumn + i : targetColumn;

                return (
                    (gridValues[r][c].letter === EMPTY_CELL_VALUE ||
                        gridValues[r][c].letter === letter) && (!gridValues[r][c].blocked)
                );
            });

        if (!validPlacement) {
            alert("INVALID PLACEMENT: CHECK THAT WORD LETTERS ALLIGN WITH ALREADY PLACED CELLS AND/OR WORD DOES NOT OVERLAP WITH BLOCKED(BLACK) CELLS");
            setSaveWordFlag(false);
            return;
        }

        setClueInput("");
        setWordInput("");
        setClueMap((prev) => {
            const newMap = new Map(prev);
            if (orientation == "Horizontal") {
                const current = newMap.get(targetRow) ?? { down: undefined, acrossTargetLocation: [0, 0], downTargetLocation: [0, 0], acrossTargetLength: 0, downTargetLength: 0 } as ClueGroup;
                current.across = clue;
                current.acrossTargetLocation = [targetRow, targetColumn];
                current.acrossTargetLength = word.length;
                newMap.set(targetRow, current);
            } else {
                const current = newMap.get(targetColumn) ?? { across: undefined, acrossTargetLocation: [0, 0], downTargetLocation: [0, 0], acrossTargetLength: 0, downTargetLength: 0 } as ClueGroup;
                current.down = clue;
                current.downTargetLocation = [targetRow, targetColumn];
                current.downTargetLength = word.length;
                newMap.set(targetColumn, current);
            }
            return newMap;
        }
        )
        setGridValues(prev =>
            prev.map((row, r) =>
                row.map((cell, c) => {
                    if (orientation === "Horizontal") {
                        if (r === targetRow && c >= targetColumn && c < targetColumn + word.length) {
                            return { ...cell, letter: word[c - targetColumn] };
                        }
                        if (r === targetRow && (c >= targetColumn + word.length || c < targetColumn) && gridValues[r][c]?.letter == EMPTY_CELL_VALUE) {
                            return { ...cell, blocked: true }
                        }
                    } else {
                        if (c === targetColumn && r >= targetRow && r < targetRow + word.length) {
                            return { ...cell, letter: word[r - targetRow] };
                        }
                        if (c === targetColumn && (r >= targetRow + word.length || r < targetRow) && gridValues[r][c]?.letter == EMPTY_CELL_VALUE) {
                            return { ...cell, blocked: true }
                        }
                    }
                    return cell;
                })
            )
        );
        setNewWord([]);
        setSaveWordFlag(false)
    }

    function manageCellClick(cellLocation: [number, number]) {

        clearCellHighlights();
        const clue = typingDirection == "Horizontal" ? clueMap.get(cellLocation[0]) : clueMap.get(cellLocation[1]);
        if (!clue) {
            setActiveClue(undefined);

            // highlight selected cell before continuing
            console.log("FIRST")
            setGridValues(prev =>
                prev.map((row, r) =>
                    row.map((cell, c) => {
                        if (r === cellLocation[0] && c === cellLocation[1]) {
                            return { ...cell, sourceHighlighted: true }
                        } else {
                            return cell;
                        }
                    })))
            return;
        }
        setActiveClue(clue);

        const targetLocation = typingDirection == "Horizontal" ? clue.acrossTargetLocation : clue.downTargetLocation;
        const targetLength = typingDirection == "Horizontal" ? clue.acrossTargetLength : clue.downTargetLength;
        if (!targetLocation || !targetLength) return;

        const [targetRow, targetColumn] = targetLocation;

        setGridValues(prev =>
            prev.map((row, r) =>
                row.map((cell, c) => {
                    if (typingDirection === "Horizontal") {
                        if (r === targetRow && c >= targetColumn && c < targetColumn + targetLength) {
                            if (r === cellLocation[0] && c === cellLocation[1]) {
                                return { ...cell, sourceHighlighted: true };
                            }
                            return { ...cell, highlighted: true };
                        }
                    } else {
                        if (c === targetColumn && r >= targetRow && r < targetRow + targetLength) {
                            if (r === cellLocation[0] && c === cellLocation[1]) {
                                return { ...cell, sourceHighlighted: true };
                            }
                            return { ...cell, highlighted: true };
                        }
                    }
                    return cell;
                })
            )
        );
    }
    return <div style={{ width: "100%", height: "100%", overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'row' }}>
        <Modal
            isOpen={showNewPuzzleModal}
            onClose={() => setShowNewPuzzleModal(false)}
            title="New Puzzle"
        >
            <form onSubmit={handleNewPuzzleSubmit}>
                <input name="title" placeholder="Puzzle title" required />
                <input name="width" type="number" min={4} max={8} required />
                <input name="height" type="number" min={4} max={8} required />

                <button type="submit">Create</button>
            </form>
        </Modal>
        <Modal
            isOpen={showSolvedModal}
            onClose={() => setShowSolvedModal(false)}
            title="Puzzle Complete!"
        >
            <></>
        </Modal>
        <div style={{ width: "33%", marginTop: "2%" }}>
            <h2 style={{ fontFamily: "Bodoni", fontWeight: "bold" }}>SETTINGS</h2>
            <div style={{ marginTop: "5%", marginLeft: "10%", marginRight: "10%", maxHeight: "50%", overflowY: "auto" }} className={mainStyles.contrastCard}>
                <h4 style={{ color: "black", marginTop: 0 }}><i>User Mode</i></h4>
                <div className={mainStyles.modeToggle}>
                    <button
                        className={`${mainStyles.modeButton} ${mode === "edit" ? mainStyles.activeMode : ""
                            }`}
                        onClick={() => setMode("edit")}
                    >
                        Edit: ✍
                    </button>
                    <button
                        className={`${mainStyles.modeButton} ${mode === "play" ? mainStyles.activeMode : ""
                            }`}
                        onClick={() => setMode("play")}
                    >
                        Play: ▚
                    </button>
                    <button
                        className={`${mainStyles.modeButton} ${mode === "play" ? mainStyles.activeMode : ""
                            }`}
                        onClick={() => {
                            loadFreeForm();
                            setMode("freeform");
                        }}
                    >
                        Freeform: 🧩
                    </button>
                </div>
                {mode === 'play' && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            loadPuzzleFromCode(userProvidedPuzzleCode);
                        }}
                    >
                        <input
                            value={userProvidedPuzzleCode}
                            style={{ marginTop: 5 }}
                            className={inputStyles.wordInput}
                            placeholder="Puzzle Code"
                            onChange={(event) => setUserProvidedPuzzleCode(event.target.value)}
                        />
                    </form>
                )}
                {mode === 'edit' && (
                    <button className={mainStyles.actionButton} onClick={() => {
                        sharePuzzle();
                    }}>Share Puzzle 📋</button>
                )}
                {mode === 'edit' && (
                    <button className={mainStyles.actionButton} onClick={() => {
                        setShowNewPuzzleModal(true);
                    }}>New Puzzle ✨</button>
                )}
            </div>
            <div style={{ marginTop: "5%", marginLeft: "10%", marginRight: "10%", maxHeight: "50%", overflowY: "auto" }} className={`${mainStyles.accentCard} ${mode !== "play" ? mainStyles.locked : ""
                }`} >
                <h4 style={{ color: "black", marginTop: 0 }}><i>Active Puzzle</i></h4>
                {mode !== "play" && (
                    <div className={mainStyles.cardOverlay}>
                        🔒
                    </div>
                )}
                <div style={{ margin: "2%", display: "flex", flexDirection: 'row', flexWrap: 'wrap', justifyContent: "space-evenly" }}>
                    <button style={{ borderColor: autoCheck ? "#a7d8ff" : "transparent" }} className={mainStyles.actionButton} disabled={mode !== "play"} onClick={() => setAutoCheck(!autoCheck)}>Auto-check</button>
                    <button className={mainStyles.actionButton} disabled={mode !== "play"} onClick={() => clearPuzzle()}>Clear Puzzle</button>
                    <button className={mainStyles.actionButton} disabled={mode === "play"} onClick={() => revealPuzzle()}>Reveal Puzzle</button>
                </div>
            </div>
            <div style={{ marginTop: "5%", marginLeft: "10%", marginRight: "10%", maxHeight: "50%", overflowY: "auto" }} className={mainStyles.card}>
                <h4 style={{ color: "black", marginTop: 0 }}><i>Curated Puzzles</i></h4>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {puzzleList.map(puzzle => (
                        <button
                            key={puzzle.id}
                            onClick={() => loadPuzzle(puzzle)}
                            style={{
                                background: activePuzzle.id === puzzle.id ? "#e6c300" : "#f5f5f5",
                                borderColor: activePuzzle.id === puzzle.id ? "black" : "transparent",
                                borderWidth: 5
                            }}
                            className={mainStyles.puzzleListItem}
                        >
                            {puzzle.title + ": "}<i>{puzzle.height + "x" + puzzle.width}</i>
                        </button>
                    ))}
                </div>
            </div>
        </div>
        <div className={clueStyles.divider}></div>
        <div style={{ width: "33%", marginTop: "2%", }}>
            <div className={inputStyles.inputDiv} style={{ marginBottom: 20 }}>
                <h2 style={{ fontFamily: "Bodoni", fontWeight: "bold" }}>PUZZLE</h2>
                {mode === 'play' && (
                    <Timer isActive={mode === "play"} resetSignal={timerReset} />
                )}
                {mode === 'edit' && (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <h5 style={{ marginBottom: 5, color: "black" }}><i>Your Word:</i></h5>
                        <input className={inputStyles.wordInput} name="wordInput" value={wordInput} placeholder="Enter Word" onChange={(event) => {
                            setWordInput(event.target.value)
                        }} />
                    </div>
                )}
                {mode === 'edit' && (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <h5 style={{ marginBottom: 0, marginTop: 10, color: "black" }}><i>Your Clue:</i></h5>
                        <input className={inputStyles.clueInput} name="clueInput" value={clueInput} placeholder="Enter Clue" onChange={(event) => {
                            setClueInput(event.target.value)
                        }} />
                    </div>
                )}
            </div>
            {mode === "edit" && (
                <div style={{ marginBottom: 50 }}>
                    {newWord.length != 0
                        ? <div style={{ display: "flex", flexDirection: 'row', justifyContent: "space-evenly", width: "75%", marginLeft: "12.5%" }}>
                            <button className={inputStyles.saveWord} onClick={() => setSaveWordFlag(true)}>Save Word </button>
                            <button className={inputStyles.addWord} onClick={() => resetWord()}>Undo Word </button>
                        </div>
                        : <button className={inputStyles.addWord} onClick={addValidatedWord}>
                            Add Word
                        </button>
                    }
                </div>
            )}
            {(mode === 'play' && activeClue) && (
                <div style={{ marginBottom: 10 }} className={clueStyles.mainClueDiv}>
                    {activeClue ? typingDirection == "Horizontal" && activeClue.across ? <p className={clueStyles.clueText}><b>{activeClue.acrossTargetLocation[0] + "A: "}</b>{activeClue.across}</p> : activeClue.down ? <p className={clueStyles.clueText}><b>{activeClue.downTargetLocation[1] + "D: "}</b>{activeClue.down}</p> : <></> : <></>}
                </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <svg ref={gridProps.gridRef} height={gridProps.heightCells * CELL_SIZE} width={gridProps.widthCells * CELL_SIZE}>
                    {
                        gridValues.map((row, i) => row.map((cell, j) => (
                            <g
                                transform={`translate(${j * CELL_SIZE},${i * CELL_SIZE})`}
                                onClick={() => {
                                    if (gridValues[i][j].blocked || mode === "edit" || gridValues[i][j].letter == EMPTY_CELL_VALUE) {
                                        return;
                                    }
                                    setSelectedCellLocation([i, j]);
                                }}
                            >
                                <path d={Cell({
                                    cellArea: [
                                        { x: 0, y0: 0, y1: CELL_SIZE },
                                        { x: CELL_SIZE, y0: 0, y1: CELL_SIZE }
                                    ],
                                    correctLetter: cell.letter,
                                    input: cell.input ?? ""
                                })} stroke={cell.blocked || cell.letter != EMPTY_CELL_VALUE ? "black" : "#E2E6E7"} fill={cell.blocked ? "black" : cell.letter == EMPTY_CELL_VALUE ? "#6F828A" : cell.sourceHighlighted ? "#EFBF04" : cell.highlighted ? "#a7d8ff" : "white"} strokeWidth={1}
                                    key={`${i}-${j}`} />;
                                <text x={CELL_SIZE / 2} y={CELL_SIZE / 2} textAnchor="middle" dominantBaseline="middle" fill={autoCheck && mode === 'play' ? (cell.letter == cell.input) ? "#2860d8" : "red" : "black"
                                }>
                                    {mode !== 'edit' ? cell.input : cell.letter}
                                </text>
                            </g>
                        )))
                    }
                </svg>
                {
                    newWord.map((props, i) =>
                    (
                        <Word key={"newWord"} {...props} saveWordFlag={saveWordFlag} saveWordFunction={saveWord} />
                    ))
                }
            </div>
        </div>
        <div className={clueStyles.divider}> </div>
        <div style={{ width: "33%", marginTop: "2%", display: "flex", flexDirection: "column" }}>
            <h2 style={{ fontFamily: "Bodoni", fontWeight: "bold" }}> CLUES </h2>
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-evenly" }}>
                <div style={{ display: "flex", flexDirection: "column", flexWrap: "wrap", width: "50%", overflowY: "auto" }}>
                    <h4><i>Across</i></h4>
                    {
                        Array.from(clueMap?.entries() ?? []).sort((a, b) => a[0] - b[0]).map((clue, i) => (
                            clue[1].across ? <div className={clueStyles.clueDiv} onMouseLeave={() => onClueDismiss("Horizontal", clue[1].acrossTargetLocation[0], clue[1].acrossTargetLocation[1], clue[1].acrossTargetLength)} onMouseEnter={() => onClueHighlight("Horizontal", clue[1].acrossTargetLocation[0], clue[1].acrossTargetLocation[1], clue[1].acrossTargetLength)} key={clue[0] + clue[1].across}><p style={{ color: "black" }}><b><i>{clue[0] + ": "}</i></b> {clue[1].across}</p></div> : <></>
                        ))
                    }
                </div>

                <div style={{ display: "flex", flexDirection: "column", flexWrap: "wrap", width: "50%", overflowY: "auto" }}>
                    <h4><i>Down</i></h4>
                    {
                        Array.from(clueMap?.entries() ?? []).sort((a, b) => a[0] - b[0]).map((clue, i) => (
                            clue[1].down ? <div className={clueStyles.clueDiv} onMouseLeave={() => onClueDismiss("Vertical", clue[1].downTargetLocation[0], clue[1].downTargetLocation[1], clue[1].downTargetLength)} onMouseEnter={() => onClueHighlight("Vertical", clue[1].downTargetLocation[0], clue[1].downTargetLocation[1], clue[1].downTargetLength)} key={clue[0] + clue[1].down}><p style={{ color: "black" }}><b><i>{clue[0] + ": "}</i></b> {clue[1].down}</p></div> : <></>
                        ))
                    }
                    <div></div>
                </div>
            </div>
        </div>
    </div>

}