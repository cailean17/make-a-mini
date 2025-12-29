import * as d3 from "d3";
import { useRef, useState, useLayoutEffect, useEffect } from "react";
import Cell, { CELL_SIZE } from "./Cell";
import { animated, useSpring } from "@react-spring/web";
import { useDrag } from "react-use-gesture";
import type { GridProps } from "./Grid";

export type WordOrientation = "Vertical" | "Horizontal";

export interface WordProps {
    word: string;
    clue: string;
    orientation: WordOrientation;
    gridProps: GridProps;
    saveWordFunction: (targetRow: number, targetColumn: number, orientation: WordOrientation, clue: string) => void;
    saveWordFlag: boolean;
}

export default function Word(wordProps: WordProps) {


    const wordRef = useRef<HTMLDivElement | null>(null);
    const wordStartRef = useRef<DOMRect | null>(null);
    const rotationXOffsetRef = useRef<number>(0);
    const [orientation, setOrientation] = useState<WordOrientation>(wordProps.orientation);
    const boundsRef = useRef({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
    const placedCell= useRef({column : 0, row: 0});
    const [wordSprings, wordSpringsApi] = useSpring(() => {
        return {
            x: 0,
            y: 0,
            immediate: true
        }
    }, []);
    function rotateWord(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key !== "r") return;
        event.preventDefault();

        if (!wordRef.current) return;
        const before = wordRef.current.getBoundingClientRect();
        setOrientation(o => (o === "Horizontal" ? "Vertical" : "Horizontal"));
        requestAnimationFrame(() => {
            if (!wordRef.current) return;

            const after = wordRef.current.getBoundingClientRect();
            const dx = before.left - after.left;
            const dy = before.top - after.top;
            wordSpringsApi.start({
                x: (wordSprings.x.get() ?? 0) + dx,
                y: (wordSprings.y.get() ?? 0) + dy,
                immediate:true
            });

            rotationXOffsetRef.current += dx;
            console.log("DX: " + dx + "DY: " + dy);
            console.log("AFTER WORDSPRINGS: " + (wordSprings.x.get() + dx) + ", " + (wordSprings.y.get() + dy))
        });
    }

    const component =
        orientation === "Horizontal" ? (
            <svg height={CELL_SIZE} width={wordProps.word.length * CELL_SIZE}>
                {wordProps.word.split("").map((letter, i) => (
                    <g transform={`translate(${i * CELL_SIZE}, 0)`} key={i}>
                        <path
                            d={Cell({
                                cellArea: [
                                    { x: 0, y0: 0, y1: CELL_SIZE },
                                    { x: CELL_SIZE, y0: 0, y1: CELL_SIZE }
                                ],
                                correctLetter: letter,
                                input: ""
                            })}
                            fill="white"
                            stroke="black"
                            strokeWidth={1}
                        />
                        <text
                            x={CELL_SIZE / 2}
                            y={CELL_SIZE / 2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                        >
                            {letter}
                        </text>
                    </g>
                ))}
            </svg>
        ) : (
            <svg height={wordProps.word.length * CELL_SIZE} width={CELL_SIZE}>
                {wordProps.word.split("").map((letter, i) => (
                    <g transform={`translate(0, ${i * CELL_SIZE})`} key={i}>
                        <path
                            d={Cell({
                                cellArea: [
                                    { x: 0, y0: 0, y1: CELL_SIZE },
                                    { x: CELL_SIZE, y0: 0, y1: CELL_SIZE }
                                ],
                                correctLetter: letter,
                                input: ""
                            })}
                            fill="white"
                            stroke="black"
                            strokeWidth={1}
                        />
                        <text
                            x={CELL_SIZE / 2}
                            y={CELL_SIZE / 2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                        >
                            {letter}
                        </text>
                    </g>
                ))}
            </svg>
        );

    useLayoutEffect(() => {
        if (!wordRef.current) return;
        wordStartRef.current = wordRef.current.getBoundingClientRect();
    }, []);

    useLayoutEffect(() => {
        if (!wordRef.current || !wordProps.gridProps.gridRef?.current) return;

        const gridRect = wordProps.gridProps.gridRef.current.getBoundingClientRect();

        boundsRef.current.minX = gridRect.left;
        boundsRef.current.minY = gridRect.top;

        if (orientation === "Horizontal") {
            boundsRef.current.maxX =
                boundsRef.current.minX + (wordProps.gridProps.widthCells * CELL_SIZE - wordProps.word.length * CELL_SIZE);
            boundsRef.current.maxY =
                boundsRef.current.minY + (wordProps.gridProps.heightCells * CELL_SIZE - CELL_SIZE);
        } else {
            boundsRef.current.maxX =
                boundsRef.current.minX + (wordProps.gridProps.widthCells * CELL_SIZE - CELL_SIZE);
            boundsRef.current.maxY =
                boundsRef.current.minY + (wordProps.gridProps.heightCells * CELL_SIZE - wordProps.word.length * CELL_SIZE);
        }
    }, [orientation]);

    const wordDrag = useDrag(({ xy, last, first }) => {
        if (!wordStartRef.current) return;

        const x = Math.min(Math.max(boundsRef.current.minX, xy[0]), boundsRef.current.maxX);
        const y = Math.min(Math.max(boundsRef.current.minY, xy[1]), boundsRef.current.maxY);

        const nextX = x - wordStartRef.current.left + rotationXOffsetRef.current;
        const nextY = y - wordStartRef.current.top;

        // Animate while dragging
        wordSpringsApi.start({
            x: nextX,
            y: nextY,
            
        });

        if (last) {
            const sampledWordRect = wordRef.current?.getBoundingClientRect();
            if(sampledWordRect){
                placedCell.current.column = Math.round((sampledWordRect.x - boundsRef.current.minX)/CELL_SIZE); 
                placedCell.current.row = Math.round((sampledWordRect.y - boundsRef.current.minY)/CELL_SIZE); 
                const finalX = (boundsRef.current.minX + (placedCell.current.column * CELL_SIZE)) - wordStartRef.current.left + rotationXOffsetRef.current;
                const finalY = (boundsRef.current.minY + (placedCell.current.row * CELL_SIZE)) - wordStartRef.current.top;
                wordSpringsApi.start({
                    x: finalX,
                    y: finalY,
                    immediate:true    
                });

            }
        }

    });

    useEffect(() => {
        if(wordProps.saveWordFlag){
            wordProps.saveWordFunction(placedCell.current.row, placedCell.current.column, orientation, wordProps.clue);
        }
    },[wordProps.saveWordFlag])

    return (
        <animated.div
            ref={wordRef}
            style={{
                ...wordSprings,
                display: "inline-block",
                transformOrigin: "top left",
                padding: 0,
                margin: 0,
                lineHeight: 0
            }}
            {...wordDrag()}
            onKeyDown={rotateWord}
            tabIndex={0}
        >
            {component}
        </animated.div>
    );
}
