import { Line, Train } from '../types';
import { LineTabPicker } from './LineTabPicker';

interface SeparatedLineTabPickerProps {
    lines: Line[];
    trainsByRoute: { [key: string]: Train[] };
}

export const SeparatedLineTabPicker: React.FC<SeparatedLineTabPickerProps> = ({
    lines,
    trainsByRoute,
}) => {
    // Separate subway lines from commuter rail lines
    const subwayLines = lines.filter(
        (line) =>
            !line.name.startsWith('cr') &&
            ![
                'Worcester',
                'Fairmount',
                'Fitchburg',
                'Kingston',
                'Lowell',
                'Needham',
                'Greenbush',
                'Haverhill',
                'Franklin',
                'Providence',
            ].includes(line.name)
    );

    const commuterRailLines = lines.filter(
        (line) =>
            line.name.startsWith('cr') ||
            [
                'Worcester',
                'Fairmount',
                'Fitchburg',
                'Kingston',
                'Lowell',
                'Needham',
                'Greenbush',
                'Haverhill',
                'Franklin',
                'Providence',
            ].includes(line.name)
    );

    return (
        <div className="separated-line-tabs">
            <div className="subway-tabs">
                <LineTabPicker lines={subwayLines} trainsByRoute={trainsByRoute} />
            </div>
            <div className="commuter-rail-tabs">
                <LineTabPicker lines={commuterRailLines} trainsByRoute={trainsByRoute} />
            </div>
        </div>
    );
};
