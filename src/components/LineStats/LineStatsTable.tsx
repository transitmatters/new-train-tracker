import { LineName } from '../../types';

interface LineStatsTableProps {
    line: LineName;
    stats: {
        totalNewDelivered?: number;
        totalNewUndelivered?: number;
        totalType7Active?: number;
        totalType7Inactive?: number;
        totalType8Active?: number;
        totalType8Inactive?: number;
        totalType9Active?: number;
        totalType9Inactive?: number;
        totalType10Delivered?: number;
        totalType10Undelivered?: number;
        totalOldActive?: number;
        totalOldInactive?: number;
        totalActive?: number;
        totalInactive?: number;
    };
}

export const LineStatsTable: React.FC<LineStatsTableProps> = ({ line, stats }) => {
    // Special case for Green line for Type 10 trains
    if (line === 'Green') {
        return (
            <table className="stats-table">
                <tbody>
                    <tr>
                        <td>
                            New <span className="train-type-text">Type 10</span> Train Cars
                            Delivered:
                        </td>
                        <td className="stat-count">{stats.totalType10Delivered}</td>
                    </tr>
                    <tr>
                        <td>
                            New <span className="train-type-text">Type 10</span> Train Cars Awaiting
                            Delivery:
                        </td>
                        <td className="stat-count">{stats.totalType10Undelivered}</td>
                    </tr>
                    <tr>
                        <td>
                            New <span className="train-type-text">Type 9</span> Train Cars
                            Delivered:
                        </td>
                        <td className="stat-count">{stats.totalType9Active}</td>
                    </tr>
                    <tr>
                        <td>
                            New <span className="train-type-text">Type 9</span> Train Cars Awaiting
                            Delivery:
                        </td>
                        <td className="stat-count">{stats.totalType9Inactive}</td>
                    </tr>
                    <br />
                    <tr>
                        <td>
                            Old <span className="train-type-text">Type 8</span> Train Cars Active:
                        </td>
                        <td className="stat-count">{stats.totalType8Active}</td>
                    </tr>
                    <tr>
                        <td>
                            Old <span className="train-type-text">Type 8</span> Train Cars Inactive:
                        </td>
                        <td className="stat-count">{stats.totalType8Inactive}</td>
                    </tr>
                    <tr>
                        <td>
                            Old <span className="train-type-text">Type 7</span> Train Cars Active:
                        </td>
                        <td className="stat-count">{stats.totalType7Active}</td>
                    </tr>
                    <tr>
                        <td>
                            Old <span className="train-type-text">Type 7</span> Train Cars Inactive:
                        </td>
                        <td className="stat-count">{stats.totalType7Inactive}</td>
                    </tr>
                </tbody>
            </table>
        );
    }

    // For all other lines
    return (
        <table className="stats-table">
            <tbody>
                {stats.totalActive !== undefined && (
                    <tr>
                        <td>Train Cars Active:</td>
                        <td className="stat-count">{stats.totalActive}</td>
                    </tr>
                )}
                {stats.totalInactive !== undefined && (
                    <tr>
                        <td>Train Cars Inactive:</td>
                        <td className="stat-count">{stats.totalInactive}</td>
                    </tr>
                )}
                {stats.totalNewDelivered !== undefined && (
                    <tr>
                        <td>New Train Cars Delivered:</td>
                        <td className="stat-count">{stats.totalNewDelivered}</td>
                    </tr>
                )}
                {stats.totalNewUndelivered !== undefined && (
                    <tr>
                        <td>New Train Cars Awaiting Delivery:</td>
                        <td className="stat-count">{stats.totalNewUndelivered}</td>
                    </tr>
                )}
                {stats.totalOldActive !== undefined && (
                    <tr>
                        <td>Old Train Cars Active:</td>
                        <td className="stat-count">{stats.totalOldActive}</td>
                    </tr>
                )}
                {stats.totalOldInactive !== undefined && (
                    <tr>
                        <td>Old Train Cars Inactive:</td>
                        <td className="stat-count">{stats.totalOldInactive}</td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};
