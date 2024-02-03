export default class Functions{
    static degreeToRadians(degree) {
        let pi = Math.PI;
        return degree * pi / 180;
    }
    static checkAngleDiffForBlock(one, two){
        let diff = Math.abs(one - two)
        return diff > 112.5 && diff < 247.5
    }
}