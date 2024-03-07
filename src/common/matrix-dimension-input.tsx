import { useEffect, useState } from "react";

export default function DimensionInput(props: { rows: number | undefined, columns: number | undefined, onDimensionChange?: (rows: number, columns: number) => void, readonly?: boolean}) {    
    const [rows, setRows] = useState(props.rows == undefined ? '?' : props.rows.toString());
    const [columns, setColumns] = useState(props.columns == undefined ? '?' : props.columns.toString());

    useEffect(() => {
        setRows(props.rows == undefined ? '?' : props.rows.toString());
        setColumns(props.columns == undefined ? '?' : props.columns.toString());
    }, [props.rows, props.columns]);

    function confirm() {
        const rowsNumber = parseInt(rows);
        const columnsNumber = parseInt(columns);
        
        if (isNaN(rowsNumber) || isNaN(columnsNumber)) {
            return;
        }

        if (rowsNumber < 1 || columnsNumber < 1) {
            return;
        }

        if (rowsNumber === props.rows && columnsNumber === props.columns) {
            return;
        }

        if (props.onDimensionChange)
            props.onDimensionChange(rowsNumber, columnsNumber);
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            confirm();
        }
    }

    return <div className="matrix-dimension-input">
        <input id="matrix-row-count-input" type={rows == '?' ? "text" : "number"} value={rows} min="1" onBlur={confirm} onKeyDown={onKeyDown} onChange={e => { setRows(e.target.value) }} readOnly={props.readonly} />
        <span>&times;</span>
        <input id="matrix-column-count-input" onBlur={confirm} onKeyDown={onKeyDown} type={columns == '?' ? "text" : "number"} value={columns} min="1" onChange={e => setColumns(e.target.value)} readOnly={props.readonly} />
    </div>;
}