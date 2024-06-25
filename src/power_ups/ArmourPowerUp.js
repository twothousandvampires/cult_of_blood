import PowerUp from "./PowerUp.js";

export default class ArmourPowerUp extends PowerUp{
    constructor() {
        super();
        this.texture_id = 'energy_pu'
        this.id = 'pu' + Math.floor(Math.random() * 1000000)
    }

    pickUp(player){
        player.energy += 50
        if(player.energy > 100){
            player.energy = 100
        }
    }
}