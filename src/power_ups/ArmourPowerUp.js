import PowerUp from "./PowerUp.js";

export default class ArmourPowerUp extends PowerUp{
    constructor() {
        super();
        this.texture_id = 'armour_pu'
        this.id = 'pu' + Math.floor(Math.random() * 1000000)
    }

    pickUp(player){
        player.armour += 50
    }
}