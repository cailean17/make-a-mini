import { useRef, useState } from 'react'
import './App.css'
import Word, { type WordProps } from './components/Word'
import Grid, { type GridProps } from './components/Grid'


function App() {
  const gridRef = useRef<SVGSVGElement | null>(null);
  const [gridWidth, setGridWidth] = useState(6);
  const [gridHeight, setGridHeight] = useState(7);
  let gridProps: GridProps = { widthCells: gridWidth, heightCells: gridHeight, setGridWidth: setGridWidth, setGridHeight: setGridHeight, gridRef: gridRef};


  return (
    <div style={{width: "100vw", height:"100vh", backgroundColor:"#f9fafb"}}>
      <Grid {...gridProps}/>
    </div>
  )
}

export default App
