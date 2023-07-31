import './LineStats.css';
import * as stats from '../../../static/static_data.json';

interface Props {
    line: string;
}

export const LineStats: React.FunctionComponent<Props> = ({ line }) => {
    const lineName = stats[line];

    if (line === 'Blue') {
        return null;
    }

    return (
        <details className="stats-container">
            <summary className="stats-title">Stats for {line} line</summary>
            {lineName ? (
                <table className="stats-table">
                    <tbody>
                        <tr>
                            <td>New Trains Delivered:</td>
                            <td>{lineName?.totalNewDelivered}</td>
                        </tr>
                        <tr>
                            <td>New Trains Awaiting Delivery:</td>
                            <td>{lineName?.totalNewUndelivered}</td>
                        </tr>
                        <tr>
                            <td>Old Trains Active:</td>
                            <td>{lineName?.totalOldActive}</td>
                        </tr>
                        <tr>
                            <td>Old Trains Inactive:</td>
                            <td>{lineName?.totalOldInactive}</td>
                        </tr>
                    </tbody>
                </table>
            ) : null}
            <div className={'updated'}>
                <span style={{ fontWeight: 'bold' }}>Delivery info last updated: </span>
                <span>{new Date(stats.Updated).toDateString()}</span>
            </div>
        </details>
    );
};
