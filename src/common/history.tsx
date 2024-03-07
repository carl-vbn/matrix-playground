import { useEffect, useRef, useState } from "react";
import { Matrix } from "./math";
import MatrixHTML from "./matrixHTML";

export interface MatrixEntry {
    mainMatrix: Matrix;
    multiplyingMatrix: Matrix;
    showMultiplyingMatrix: boolean;
    time: number;
}

export interface History {
    entries: MatrixEntry[];
    backsteps: number;
}

export function HistoryBar(props: { history: History, onEntryClicked: (entryIndex: number) => void, onClear: () => void }) {
    const scrollView = useRef<HTMLDivElement>(null);
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        if (scrollView.current !== null) {
            scrollView.current.scrollLeft = scrollView.current!.scrollWidth;
        }
    }, [props.history.entries, hidden]);

    return <div className={`history${hidden ? ' hidden' : ''}`}>
        <h3>History{!hidden && <span className="no-bold"> &mdash; Click any entry to revert to it</span>}
        <div className="controls">{!hidden && <button onClick={props.onClear} className="clear-btn red">Clear</button>}<button onClick={_ => setHidden(!hidden)} className="hide-btn blue">{hidden ? `Show`: `Hide`}</button></div></h3>
        
        {!hidden && <div id="history-container" ref={scrollView}>
            {props.history.entries.map((entry, index) => {
                const selected = index === props.history.entries.length - 1 - props.history.backsteps;
                return [
                    (
                        <div key={index} className={`history-entry${selected ? ' selected' : ''}${entry.multiplyingMatrix ? ' double' : ''}`} onClick={() => {
                            props.onEntryClicked(index);
                        }}>
                            <MatrixHTML matrix={entry.mainMatrix} />
                            {entry.showMultiplyingMatrix && <><div className="symbol-container">&times;</div><MatrixHTML matrix={entry.multiplyingMatrix} /></>}
                        </div>
                    ),
                    (
                        index < props.history.entries.length - 1 && <div key={index + '_arrow'} className="arrow">➜</div>
                    )
                ];
            }).flat()}
        </div>}
    </div>;
}