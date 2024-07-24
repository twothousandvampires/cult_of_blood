import PowerUp from "./PowerUp.js";

export default class SpeedPowerUp extends PowerUp{
    constructor() {
        super();
        this.texture_id = 'speed_pu'
        this.id = 'pu' + Math.floor(Math.random() * 1000000)
    }

    pickUp(player){
        player.movement_speed += 0.01
    }
}