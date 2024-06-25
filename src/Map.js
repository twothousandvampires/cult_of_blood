export default class Map{

    constructor() {

    }
    getLayout(){
        return this.layout
    }
    getPossiblePowerUpSpot(currentPowerUps){
        let result = []
        this.power_up_spots.forEach(spot => {
            if(!currentPowerUps.find(current => current.x === spot.x && current.y === spot.y)){
                result.push(spot)
            }
        })
        return result[Math.floor(Math.random() * result.length)]
    }
}