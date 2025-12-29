import * as d3 from "d3";
import { useRef, useEffect } from "react";

export const CELL_SIZE = 30;
export const EMPTY_CELL_VALUE = "";

export type CellAreaDatum = {
    x: number;
    y0: number;
    y1: number;
}
export interface CellValue {
    letter: string,
    input: string,
    highlighted: boolean,
    sourceHighlighted: boolean
    blocked: boolean
}
export interface CellProps {
    correctLetter: string,
    input: string,
    cellArea: CellAreaDatum[]
}

export default function Cell(cellProps: CellProps) {
    const cellRef = useRef<SVGSVGElement | null>(null);
    const cellAreaGenerator = d3.area<CellAreaDatum>().x(d => d.x).y0(d => d.y0).y1(d => d.y1);
    const cellPath = cellAreaGenerator(cellProps.cellArea) ?? "";
    return cellPath
}
