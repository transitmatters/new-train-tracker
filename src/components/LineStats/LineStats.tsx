import * as stats from '../../../public/static_data.json';
import { LineName } from '../../types';
import './LineStats.css';

interface Props {
    line: LineName;
}

export const LineStats: React.FunctionComponent<Props> = ({ line }) => {
    const lineStats: {
        totalNewDelivered?: number;
        totalNewUndelivered?: number;
        totalOldActive?: number;
        totalOldInactive?: number;
        totalActive?: number;
        totalInactive?: number;
    } = stats[line];

    if (line === 'Blue') {
        return (
            <details className="stats-container">
                <summary className="stats-title">Stats for {line} line</summary>
                {lineStats ? (
                    <table className="stats-table">
                        <tbody>
                            <tr>
                                <td>Train Cars Active:</td>
                                <td>{lineStats?.totalOldActive}</td>
                            </tr>
                        </tbody>
                    </table>
                ) : null}
                <div className={'updated'}>
                    <span style={{ fontWeight: 'bold' }}>Delivery info last updated: </span>
                    <span>{new Date(stats.Updated).toDateString()}</span> (
                    <a href={stats.Sources.fleet_numbers}>source</a>)
                </div>
            </details>
        );
    }

    return (
        <details className="stats-container">
            <summary className="stats-title">Stats for {line} line</summary>
            {lineStats ? (
                <table className="stats-table">
                    <tbody>
                        <tr>
                            <td>New Train Cars Delivered:</td>
                            <td>{lineStats?.totalNewDelivered}</td>
                        </tr>
                        <tr>
                            <td>New Train Cars Awaiting Delivery:</td>
                            <td>{lineStats?.totalNewUndelivered}</td>
                        </tr>
                        <tr>
                            <td>Old Train Cars Active:</td>
                            <td>{lineStats?.totalOldActive}</td>
                        </tr>
                        <tr>
                            <td>Old Train Cars Inactive:</td>
                            <td>{lineStats?.totalOldInactive}</td>
                        </tr>
                    </tbody>
                </table>
            ) : null}
            <div className={'updated'}>
                <span style={{ fontWeight: 'bold' }}>Delivery info last updated: </span>
                <span>{new Date(stats.Updated).toDateString()}</span> (
                <a href={stats.Sources.fleet_numbers}>source</a>)
            </div>
        </details>
    );
};
