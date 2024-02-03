import PowerUp from "./PowerUp.js";

export default class PowerPowerUp extends PowerUp{
    constructor() {
        super();
        this.texture_id = 'power_pu'
        this.id = 'pu' + Math.floor(Math.random() * 1000000)
    }

    pickUp(player){
        player.power += 5
    }
}