export default class Functions{
    static degreeToRadians(degree) {
        let pi = Math.PI;
        return degree * pi / 180;
    }
    static checkAngleDiffForBlock(one, two){
        let diff = Math.abs(one - two)
        return diff > 112.5 && diff < 247.5
    }
    static getAnglePoints(x1, y1, x2, y2, x3, y3)
    {
        return (Math.atan2(y3 - y1, x3 - x1) - Math.atan2(y2 - y1, x2 - x1)) * 180 / Math.PI;
    }
    static calcDistanceFromLineToPoint(line_start, line_end, point){
        let x1 = line_start.x, y1 = line_start.y, x2 = line_end.x, y2 = line_end.y, x3 = point.x, y3 = point.y;

        let double_x = (x1 * x1 * x3 - 2 * x1 * x2 * x3 + x2 * x2 * x3 + x2 *
            (y1 - y2) * (y1 - y3) - x1 * (y1 - y2) * (y2 - y3)) / ((x1 - x2) *
            (x1 - x2) + (y1 - y2) * (y1 - y2));
        let double_y = (x2 * x2 * y1 + x1 * x1 * y2 + x2 * x3 * (y2 - y1) - x1 *
            (x3 * (y2 - y1) + x2 * (y1 + y2)) + (y1 - y2) * (y1 - y2) * y3) / ((
            x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));

        return  Math.sqrt(Math.pow(point.x - double_x, 2) + Math.pow(point.y - double_y, 2));
    }
    static degreeToRadians(degree){
        let pi = Math.PI;
        return degree * pi / 180;
    }
    static distance(from, to){
        let distance = Math.sqrt(((from.x - to.x) ** 2) + ((from.y - to.y) ** 2))
        return distance
    }

    static circleCollision(item, other, radius){
        return Functions.distance(item, other) < radius
    }
}