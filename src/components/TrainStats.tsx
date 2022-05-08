import * as stats from '../../static/static_data.json';
import '../styles/TrainStats.css'

interface IStats {
    line: string;
}

export const Stats = ({line}: IStats): JSX.Element => {
    return (
        <details className='stats-container'>
            <summary className='stats-title'>Stats for {line} line</summary>
            <table className='stats-table'>
                <tbody>
                    <tr>
                        <td>New Trains Delivered:</td>
                        <td>{stats[line]?.totalNewDelivered}</td>
                    </tr>
                    <tr>
                        <td>New Trains Awaiting Delivery:</td>
                        <td>{stats[line]?.totalNewUndelivered}</td>
                    </tr>
                    <tr>
                        <td>Old Trains Active:</td>
                        <td>{stats[line]?.totalOldActive}</td>
                    </tr>
                    <tr>
                        <td>Old Trains Inactive:</td>
                        <td>{stats[line]?.totalOldInactive}</td>
                    </tr>
                </tbody>
            </table>
        </details>
    );
};
