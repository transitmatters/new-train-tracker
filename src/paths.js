const sind = theta => Math.sin(theta * (Math.PI / 180));
const cosd = theta => Math.cos(theta * (Math.PI / 180));
const tand = theta => Math.tan(theta * (Math.PI / 180));
const round = (x, n = 2) => Math.round(x * Math.pow(10, n)) / Math.pow(10, n);

const path = (strings, ...args) => {
    const roundedString = (i) => {
        if (args[i] !== undefined) {
            return round(args[i]).toString();
        }
        return '';
    }

    return strings.reduce((acc, next, i) => `${acc}${next}${roundedString(i)}`, '');
}

const start = (x, y, theta) => {
    return {
        type: 'start',
        path: '',
        turtle: { x, y, theta },
    }
}

const line = (length, { exclude = false, id = null } = {}) => (turtle) => {
    const { x, y, theta } = turtle;
    const x2 = x + length * cosd(theta);
    const y2 = y + length * sind(theta);
    return {
        type: 'line',
        path: path`M ${x} ${y} L ${x2} ${y2}`,
        turtle: { x: x2, y: y2, theta },
        id,
    }
}

const curve = (length, angle, { exclude = false, id = null } = {}) => (turtle) => {
    const { x: x1, y: y1, theta } = turtle;
    const nextTheta = theta + angle;
    const x2 = x1 + length * cosd(theta + angle / 2);
    const y2 = y1 + length * sind(theta + angle / 2);
    // Slope of tangent passing through turtle
    const m1 = tand(theta);
    // Slope of tangent passing through output point
    const m2 = tand(nextTheta);
    // Calculate control point, which is the intersection of these two tangent lines
    let xc, yc;
    if (theta % 90 === 0) {
        // tan(theta) = infinity, so the line through (x1, y1) is vertical, and xc = x1
        xc = x1;
        yc = m2 * (xc - x2) + y2;

    } else {
        xc = (y1 - x1 * m1 - y2 + x2 * m2) / (m2 - m1);
        yc = m1 * (xc - x1) + y1;
    }
    return {
        type: 'curve',
        path: path`M ${x1} ${y1} Q ${xc} ${yc} ${x2} ${y2}`,
        turtle: { x: x2, y: y2, theta: nextTheta },
        exclude,
        id,
    }
}

const wiggle = (length, width, angle = 0, { exclude = true, id = null } = {}) => (turtle) => {
    const { x: x1, y: y1, theta } = turtle;
    const nextTheta = theta + angle;
    const x2 = x1 + length * cosd(theta) + width * cosd(theta - 90);
    const y2 = y1 + length * sind(theta) + width * sind(theta - 90);
    // The first control point is parallel to the turtle's incoming line, and is half the total
    // distance between (x1, y1) and (x2, y2).
    const halfDist = 0.5 * Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
    const xp1 = x1 + halfDist * cosd(theta);
    const yp1 = y1 + halfDist * sind(theta);
    // The second control point is parallel to the turtle's outgoing line, and is also half the 
    // total point-point distance.
    const xp2 = x2 - halfDist * cosd(nextTheta);
    const yp2 = y2 - halfDist * sind(nextTheta);
    return {
        type: 'branch',
        path: path`M ${x1} ${y1} C ${xp1} ${yp1} ${xp2} ${yp2} ${x2} ${y2}`,
        turtle: { x: x2, y: y2, theta: nextTheta },
        exclude,
        id,
    }
}

export const greenShared = [
    start(90, -90, 90),
    line(30),
    curve(20, 60),
    line(20),
];

export const greenBCDTrunk = [
    line(20)
]

export const greenB = [
    ...greenShared,
    ...greenBCDTrunk,
    wiggle(30, -20),
    line(100),
]

export const greenC = [
    ...greenShared,
    ...greenBCDTrunk,
    line(135)
]

export const greenD = [
    ...greenShared,
    ...greenBCDTrunk,
    wiggle(30, 20),
    line(100),
]

export const greenE = [
    ...greenShared,
    wiggle(60, 40),
    line(40),
]

export const greenLine = {
    name: "green",
    paths: {
        greenB,
        greenC,
        greenD,
        greenE
    },
    servicePathMapping: {
        'Green-B': {
            path: 'greenB',
            segmentation: [
                ''
            ]
        }
    }
}