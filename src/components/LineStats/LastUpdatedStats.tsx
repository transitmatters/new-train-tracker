interface Props {
    stats: {
        Updated: string;
        Sources: {
            fleet_numbers: string;
        };
    };
}

export const LastUpdatedStats: React.FunctionComponent<Props> = ({ stats }) => {
    return (
        <div className={'updated'}>
            <span style={{ fontWeight: 'bold' }}>Delivery info last updated: </span>
            <span>{new Date(stats.Updated).toDateString()}</span>
            {' ('}
            <a href={stats.Sources.fleet_numbers}>source</a>
            {')'}
        </div>
    );
};
