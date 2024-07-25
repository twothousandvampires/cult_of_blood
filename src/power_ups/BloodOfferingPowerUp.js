import PowerUp from "./PowerUp.js";
import FireBallSpell from "../spells/FireballSpell.js";

export default class BloodOfferingPowerUp extends PowerUp{
    constructor() {
        super()
        this.texture_id = 'blood_offering_pu'
        this.id = 'pu' + Math.floor(Math.random() * 1000000)
    }
    pickUp(player, io){
        player.power ++
        player.hp ++
    }
}