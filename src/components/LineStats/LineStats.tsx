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

    const lineName = data[line];

    return (
        <details className="stats-container">
            <summary className="stats-title">Stats for {line} line</summary>
            {lineName ? (
                <table className="stats-table">
                    <tbody>
                        <tr>
                            <td>Maximum trains seen:</td>
                            <td>{lineName?.max?.value}</td>
                        </tr>
                        <tr>
                            <td>On date:</td>
                            <td>{lineName?.max?.on_date}</td>
                        </tr>
                    </tbody>
                </table>
            ) : null}
            <div className={'updated'}>
                <span style={{ fontWeight: 'bold' }}>Delivery info last updated: </span>
            </div>
        </details>
    );
};
