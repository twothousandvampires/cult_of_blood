import PowerUp from "./PowerUp.js";
import FireBallSpell from "../spells/FireballSpell.js";

export default class BloodOfferingPowerUp extends PowerUp{
    constructor() {
        super()
        this.texture_id = 'blood_offering_pu'
        this.id = 'pu' + Math.floor(Math.random() * 1000000)
    }
    pickUp(player, io, game){
        player.blood_offering_count ++
        if(player.blood_offering_count >= 1){
            player.TransformIntoBeast(io)
            game.beast_is_spawned = true
            game.clearPowerUps()
        }
        else{
            player.power ++
            player.hp ++
        }
    }
}