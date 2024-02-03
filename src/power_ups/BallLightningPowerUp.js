import PowerUp from "./PowerUp.js";
import LightningBoltSpell from "../spells/LightningBoltSpell.js";

export default class BallLightningPowerUp extends PowerUp{
    constructor() {
        super()
        this.texture_id = 'ball_lightning_pu'
        this.id = 'pu' + Math.floor(Math.random() * 1000000)
    }
    pickUp(player){
        player.newSpell(new LightningBoltSpell())
    }
}