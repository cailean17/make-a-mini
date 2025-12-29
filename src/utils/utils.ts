import type { CellValue } from "../components/Cell";
import type { ClueGroup, Puzzle } from "../components/Grid";
import LZSring from 'lz-string';

export function serializeGrid(gridValues: CellValue[][]){
    return gridValues.map(row => 
        row.map(cell => ({
            letter: cell.letter,
            blocked: cell.blocked
        } as CellValue))
    )
}

export function serializeClues(clueMap: Map<number, ClueGroup>){
   if(!clueMap){
    return [];
   } 

   return Array.from(clueMap.entries()).map(([number, clue]) => ({
     exportNumber:number,
     across: clue.across,
     down: clue.down,
     downTargetLocation: clue.downTargetLocation,
     acrossTargetLocation: clue.acrossTargetLocation,
     downTargetLength: clue.downTargetLength,
     acrossTargetLength: clue.acrossTargetLength,
   } as ClueGroup))
}

export function deserializeClues(clueList: ClueGroup[]) : Map<number, ClueGroup>{
    return new Map(
        clueList.map(clue => [
            clue.exportNumber,
            {
                across: clue.across,
                down: clue.down,
                downTargetLocation: clue.downTargetLocation,
                acrossTargetLocation: clue.acrossTargetLocation,
                downTargetLength: clue.downTargetLength,
                acrossTargetLength: clue.acrossTargetLength,
            } as ClueGroup
        ])
    )
}

export function exportPuzzle(gridValues : CellValue[][], clueMap : Map<number, ClueGroup>, width : number, height : number, id : string, title: string) : Puzzle{
    return {
        width: width, 
        height: height,
        grid: serializeGrid(gridValues),
        clues: serializeClues(clueMap),
        id: id, 
        title: title
    }
}

export function encodePuzzle(puzzle:Puzzle){
    const json = JSON.stringify(puzzle);

    const compressed = LZSring.compressToBase64(json);
    const urlSafe = compressed.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    return urlSafe;
}

export function decodePuzzle(encodedPuzzle: string) : Puzzle{
    const decodedPuzzle = LZSring.decompressFromBase64(encodedPuzzle.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodedPuzzle);
}