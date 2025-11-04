import * as stats from '../../static_data.json';
import { LineName } from '../../types';
import { LastUpdatedStats } from './LastUpdatedStats';
import { LineStatsTable } from './LineStatsTable';
import './LineStats.css';

interface Props {
    line: LineName;
}

export const LineStats: React.FunctionComponent<Props> = ({ line }) => {
    const lineStats = stats[line];

    return (
        <details className="stats-container">
            <summary className="stats-title">Stats for {line} line</summary>
            {lineStats && <LineStatsTable line={line} stats={lineStats} />}
            <LastUpdatedStats stats={stats} />
        </details>
    );
};
