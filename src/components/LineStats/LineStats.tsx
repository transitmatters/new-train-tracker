import { useAPICall } from '../../hooks/useAPICall';
import './LineStats.css';

interface Props {
    line: string;
}

export const LineStats = ({ line }: Props): JSX.Element => {
    const { data, error, loading } = useAPICall(
        'https://traintracker.transitmatters.org/statistics',
        'GET',
        null
    );

    console.log(line);
    console.log(data);

    const lineName = data[line];

    return (
        <details className="stats-container">
            <summary className="stats-title">Stats for {line} line</summary>
            {lineName ? (
                <table className="stats-table">
                    <tbody>
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
                {/* <span>{new Date(stats.Updated).toDateString()}</span> */}
            </div>
        </details>
    );
};
